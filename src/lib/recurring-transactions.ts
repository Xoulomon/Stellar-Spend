/**
 * Recurring transactions — schedule automatic periodic offramp payments.
 * Schedules are stored in localStorage; execution is triggered client-side.
 */

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringSchedule {
  id: string;
  createdAt: number;
  userAddress: string;
  label: string;
  amount: string;
  currency: string;
  frequency: RecurringFrequency;
  beneficiary: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    currency: string;
  };
  /** ISO date string of next scheduled execution */
  nextRunAt: number;
  /** Whether the schedule is active */
  paused: boolean;
  /** Number of times executed */
  executionCount: number;
  /** Last execution result */
  lastResult?: { status: 'success' | 'failed'; error?: string; timestamp: number };
  /** Max executions (undefined = unlimited) */
  maxExecutions?: number;
}

const STORAGE_KEY = 'stellar_spend_recurring';

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function computeNextRunAt(from: number, frequency: RecurringFrequency): number {
  const d = new Date(from);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.getTime();
}

export function isDue(schedule: RecurringSchedule): boolean {
  if (schedule.paused) return false;
  if (schedule.maxExecutions !== undefined && schedule.executionCount >= schedule.maxExecutions) return false;
  return Date.now() >= schedule.nextRunAt;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export class RecurringStorage {
  static getAll(): RecurringSchedule[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static getByUser(userAddress: string): RecurringSchedule[] {
    return this.getAll().filter(
      (s) => s.userAddress.toLowerCase() === userAddress.toLowerCase(),
    );
  }

  static save(schedule: RecurringSchedule): void {
    if (typeof window === 'undefined') return;
    const all = this.getAll().filter((s) => s.id !== schedule.id);
    all.unshift(schedule);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 50)));
  }

  static pause(id: string): void {
    this._update(id, { paused: true });
  }

  static resume(id: string): void {
    this._update(id, { paused: false });
  }

  static delete(id: string): void {
    if (typeof window === 'undefined') return;
    const all = this.getAll().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  static recordResult(
    id: string,
    result: { status: 'success' | 'failed'; error?: string },
  ): void {
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const s = all[idx];
    s.lastResult = { ...result, timestamp: Date.now() };
    if (result.status === 'success') {
      s.executionCount += 1;
      s.nextRunAt = computeNextRunAt(Date.now(), s.frequency);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  static generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private static _update(id: string, patch: Partial<RecurringSchedule>): void {
    if (typeof window === 'undefined') return;
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return;
    all[idx] = { ...all[idx], ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}
