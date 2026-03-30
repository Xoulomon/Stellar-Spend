import type { Transaction } from '@/lib/transaction-storage';

/**
 * Factory for creating test transactions with sensible defaults
 */
export function createTestTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    userAddress: 'GABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDE',
    amount: '100.00',
    currency: 'USDC',
    beneficiary: {
      institution: 'Test Bank',
      accountIdentifier: '1234567890',
      accountName: 'Test User',
      currency: 'USD',
    },
    status: 'pending',
    ...overrides,
  };
}

/**
 * Factory for creating valid Stellar addresses (G-key format)
 */
export function createValidStellarAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let address = 'G';
  for (let i = 0; i < 55; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

/**
 * Factory for creating valid Base addresses (0x format)
 */
export function createValidBaseAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

/**
 * Mock localStorage for testing
 */
export function createLocalStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}
