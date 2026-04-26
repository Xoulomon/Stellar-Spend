/**
 * Transaction splitting — split a single USDC amount across multiple beneficiaries.
 * All amounts are in USDC (string decimals). Percentages must sum to 100.
 */

export interface SplitRecipient {
  id: string;
  label: string;
  /** Percentage of the total (0–100, must sum to 100 across all recipients) */
  percentage: number;
  /** Resolved USDC amount (computed from percentage × total) */
  amount?: string;
}

export interface SplitTransaction {
  id: string;
  createdAt: number;
  totalAmount: string;
  currency: string;
  recipients: SplitRecipient[];
  status: 'pending' | 'partial' | 'completed' | 'failed';
  /** Per-recipient execution results */
  results: Record<string, { status: 'pending' | 'completed' | 'failed'; error?: string }>;
}

const STORAGE_KEY = 'stellar_spend_splits';

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function validateSplit(recipients: SplitRecipient[]): string | null {
  if (recipients.length < 2) return 'At least 2 recipients required';
  const total = recipients.reduce((s, r) => s + r.percentage, 0);
  if (Math.abs(total - 100) > 0.01) return `Percentages must sum to 100 (currently ${total.toFixed(2)})`;
  if (recipients.some((r) => r.percentage <= 0)) return 'Each recipient must have a positive percentage';
  return null;
}

export function computeSplitAmounts(
  totalAmount: string,
  recipients: SplitRecipient[],
): SplitRecipient[] {
  const total = parseFloat(totalAmount);
  if (isNaN(total) || total <= 0) return recipients;
  return recipients.map((r) => ({
    ...r,
    amount: ((total * r.percentage) / 100).toFixed(2),
  }));
}

export function deriveSplitStatus(
  results: SplitTransaction['results'],
  recipientCount: number,
): SplitTransaction['status'] {
  const values = Object.values(results);
  if (values.length === 0) return 'pending';
  const completed = values.filter((v) => v.status === 'completed').length;
  const failed = values.filter((v) => v.status === 'failed').length;
  if (completed === recipientCount) return 'completed';
  if (failed === recipientCount) return 'failed';
  if (completed + failed === recipientCount) return 'partial';
  return 'pending';
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export class SplitStorage {
  static getAll(): SplitTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static save(split: SplitTransaction): void {
    if (typeof window === 'undefined') return;
    const all = this.getAll().filter((s) => s.id !== split.id);
    all.unshift(split);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)));
  }

  static updateResult(
    splitId: string,
    recipientId: string,
    result: { status: 'completed' | 'failed'; error?: string },
  ): void {
    const all = this.getAll();
    const idx = all.findIndex((s) => s.id === splitId);
    if (idx === -1) return;
    all[idx].results[recipientId] = result;
    all[idx].status = deriveSplitStatus(all[idx].results, all[idx].recipients.length);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  static generateId(): string {
    return `split_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}
