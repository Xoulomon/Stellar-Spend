# Design Document: Utility Function Tests

## Overview

This design document outlines the comprehensive test suite for critical utility functions in the Stellar Spend application. The utilities under test include number conversion functions for Soroban smart contracts, polling mechanisms with timeout handling, input validation functions, and transaction storage management. The test suite ensures correctness, handles edge cases, and validates that these foundational components behave reliably across all scenarios.

The testing approach combines unit tests for specific examples and edge cases with property-based tests for universal correctness properties. This dual approach ensures both concrete behavior validation and comprehensive input coverage.

## Architecture

### Test Organization

The test suite is organized into four main test modules, each corresponding to a utility category:

1. **Soroban Number Conversion Tests** (`soroban-tx-builder.test.ts`)
   - Tests for `floatToInt()` function
   - Tests for `getNonceBigInt()` function

2. **Polling Utility Tests** (`polling.test.ts`)
   - Tests for `pollWithTimeout()` function
   - Uses Jest fake timers to control time progression

3. **Validation Utility Tests** (`validation.test.ts`)
   - Tests for `validateAmount()` function
   - Tests for `validateAddress()` function
   - Tests for `validateToken()` function

4. **Transaction Storage Tests** (`transaction-storage.test.ts`)
   - Tests for all `TransactionStorage` class methods
   - Mocks `localStorage` for isolated testing

### Testing Framework

- **Framework**: Jest (already configured in the project)
- **Mocking**: Jest mocks for `localStorage` and timers
- **Property-Based Testing**: Not applicable for this feature (unit tests only)
- **Test Location**: Co-located with source files using `.test.ts` suffix

## Components and Interfaces

### 1. Soroban Number Conversion Module

**Functions Under Test:**

```typescript
// Convert float string to integer with specified decimals
function floatToInt(amount: string, decimals: number): string

// Generate unique positive BigInt nonce
function getNonceBigInt(): bigint
```

**Test Interface:**
- Input: Various float strings and decimal place values
- Output: String representation of converted integers
- Edge cases: Very small numbers, truncation scenarios, zero values

### 2. Polling Utility Module

**Function Under Test:**

```typescript
interface PollOptions {
  interval?: number;
  timeout?: number;
  onProgress?: (attempt: number) => void;
}

function pollWithTimeout<T>(
  pollFn: () => Promise<T>,
  checkCondition: (result: T) => boolean,
  options?: PollOptions
): Promise<T>
```

**Test Interface:**
- Input: Mock poll functions with configurable success timing
- Output: Resolved value or timeout error
- Time control: Jest fake timers for deterministic testing

### 3. Validation Utility Module

**Functions Under Test:**

```typescript
function validateAmount(amount: string): boolean
function validateAddress(address: string, chain: 'stellar' | 'base'): boolean
function validateToken(token: string): boolean
```

**Test Interface:**
- Input: Various valid and invalid strings
- Output: Boolean validation results
- Coverage: All branches including edge cases

### 4. Transaction Storage Module

**Class Under Test:**

```typescript
class TransactionStorage {
  static save(transaction: Transaction): void
  static update(id: string, updates: Partial<Transaction>): void
  static getAll(): Transaction[]
  static getByUser(userAddress: string): Transaction[]
  static getById(id: string): Transaction | undefined
  static clear(): void
  static generateId(): string
}
```

**Test Interface:**
- Storage: Mocked `localStorage`
- Input: Transaction objects with various properties
- Output: Stored, retrieved, or modified transactions

## Data Models

### Transaction Interface

```typescript
interface Transaction {
  id: string;
  timestamp: number;
  userAddress: string;
  amount: string;
  currency: string;
  stellarTxHash?: string;
  bridgeStatus?: string;
  payoutOrderId?: string;
  payoutStatus?: string;
  beneficiary: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    currency: string;
  };
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}
```

### Test Data Factories

Test helper functions will be created to generate valid test data:

```typescript
// Factory for creating test transactions
function createTestTransaction(overrides?: Partial<Transaction>): Transaction

// Factory for creating valid Stellar addresses
function createValidStellarAddress(): string

// Factory for creating valid Base addresses
function createValidBaseAddress(): string
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Soroban Number Conversion Properties

**Property 1: Nonce Positivity**
*For any* call to `getNonceBigInt()`, the returned BigInt value should always be positive (greater than zero).
**Validates: Requirements 1.5**

**Property 2: Nonce Uniqueness**
*For any* sequence of calls to `getNonceBigInt()`, each returned value should be different from all previously returned values within the same test execution.
**Validates: Requirements 1.6**

### Polling Utility Properties

**Property 3: Polling Resolution After N Attempts**
*For any* polling function that succeeds after N attempts, `pollWithTimeout()` should resolve with the correct result after exactly N iterations.
**Validates: Requirements 2.2**

**Property 4: Progress Callback Invocation**
*For any* polling operation with an `onProgress` callback, the callback should be invoked exactly once per polling attempt with the correct attempt number.
**Validates: Requirements 2.4**

### Validation Utility Properties

**Property 5: Valid Amount Acceptance**
*For any* string representing a valid positive number (including decimals), `validateAmount()` should return true.
**Validates: Requirements 3.1**

**Property 6: Negative Amount Rejection**
*For any* string representing a negative number, `validateAmount()` should return false.
**Validates: Requirements 3.3**

**Property 7: Valid Stellar Address Acceptance**
*For any* string matching the pattern `^G[A-Z0-9]{55}$`, `validateAddress(address, 'stellar')` should return true.
**Validates: Requirements 3.7**

**Property 8: Invalid Stellar Address Length Rejection**
*For any* string with a 'G' prefix but length not equal to 56 characters, `validateAddress(address, 'stellar')` should return false.
**Validates: Requirements 3.8**

**Property 9: Invalid Stellar Address Prefix Rejection**
*For any* string of 56 characters that does not start with 'G', `validateAddress(address, 'stellar')` should return false.
**Validates: Requirements 3.9**

**Property 10: Valid Base Address Acceptance**
*For any* string matching the pattern `^0x[a-fA-F0-9]{40}$`, `validateAddress(address, 'base')` should return true.
**Validates: Requirements 3.10**

**Property 11: Invalid Base Address Length Rejection**
*For any* string with '0x' prefix but hex portion not equal to 40 characters, `validateAddress(address, 'base')` should return false.
**Validates: Requirements 3.11**

**Property 12: Invalid Base Address Prefix Rejection**
*For any* string of 42 characters that does not start with '0x', `validateAddress(address, 'base')` should return false.
**Validates: Requirements 3.12**

**Property 13: Invalid Token Rejection**
*For any* string that is not 'USDC' or 'USDT' (case-sensitive), `validateToken()` should return false.
**Validates: Requirements 3.16**

### Transaction Storage Properties

**Property 14: Transaction Persistence**
*For any* valid transaction object, calling `save()` should result in that transaction being retrievable via `getAll()`.
**Validates: Requirements 4.1**

**Property 15: Transaction Prepending Order**
*For any* sequence of transactions saved, the most recently saved transaction should always appear first in the array returned by `getAll()`.
**Validates: Requirements 4.2**

**Property 16: Storage Size Limit**
*For any* number of transactions saved exceeding 50, `getAll()` should return exactly 50 transactions, with the 50 most recent ones.
**Validates: Requirements 4.3**

**Property 17: Transaction Update Persistence**
*For any* existing transaction ID and valid update object, calling `update()` should result in the transaction having the updated properties when retrieved.
**Validates: Requirements 4.4**

**Property 18: User Filtering Correctness**
*For any* user address, `getByUser()` should return only transactions where the `userAddress` field matches (case-insensitively).
**Validates: Requirements 4.6**

**Property 19: Case-Insensitive User Matching**
*For any* user address with different case variations, `getByUser()` should return the same set of transactions regardless of the case used in the query.
**Validates: Requirements 4.7**

**Property 20: Transaction Retrieval by ID**
*For any* transaction ID that exists in storage, `getById()` should return the exact transaction with that ID.
**Validates: Requirements 4.8**

**Property 21: ID Uniqueness**
*For any* sequence of calls to `generateId()`, each returned ID should be unique and different from all previously generated IDs.
**Validates: Requirements 4.10**

## Error Handling

### Polling Timeout Errors

When `pollWithTimeout()` exceeds the specified timeout:
- Throw an `Error` with message: `"Polling timeout exceeded"`
- Ensure no memory leaks from pending timers
- Clean up any in-progress polling operations

### Validation Error Handling

Validation functions should handle edge cases gracefully:
- Empty strings → return `false`
- `null` or `undefined` → return `false`
- Special values (`"NaN"`, `"Infinity"`) → return `false`
- Malformed inputs → return `false` (never throw)

### Storage Error Handling

Transaction storage should handle errors gracefully:
- `localStorage` unavailable (SSR) → return empty arrays, no-op on writes
- Corrupted JSON in storage → return empty array
- Invalid transaction data → skip invalid entries

## Testing Strategy

### Unit Testing Approach

**Test Coverage Goals:**
- 100% branch coverage for validation functions
- All edge cases explicitly tested
- All error conditions validated
- Specific examples from requirements documented as tests

**Test Organization:**
- One test file per utility module
- Descriptive test names following pattern: `"should [expected behavior] when [condition]"`
- Group related tests using `describe` blocks
- Use `beforeEach` for test setup and cleanup

**Mock Strategy:**
- Mock `localStorage` using Jest mocks
- Mock `Date.now()` and `Math.random()` for deterministic ID generation
- Use `jest.useFakeTimers()` for polling tests

### Property-Based Testing

This feature uses unit tests exclusively. Property-based testing is not applicable as the requirements specify concrete test cases and edge case validation rather than universal properties requiring randomized input generation.

### Test Execution

**Running Tests:**
```bash
npm test -- soroban-tx-builder.test.ts
npm test -- polling.test.ts
npm test -- validation.test.ts
npm test -- transaction-storage.test.ts
```

**Coverage Reporting:**
```bash
npm test -- --coverage
```

### Edge Case Testing

**Critical Edge Cases:**
1. **Number Conversion:**
   - Very small decimals (0.0000001)
   - Truncation scenarios (more decimals than specified)
   - Zero values
   - Large numbers

2. **Polling:**
   - Immediate success (first attempt)
   - Timeout exactly at boundary
   - Progress callback with zero attempts

3. **Validation:**
   - Empty strings
   - Special numeric values (NaN, Infinity)
   - Case sensitivity
   - Boundary lengths

4. **Storage:**
   - Empty storage
   - Exactly 50 transactions
   - 51+ transactions (trimming)
   - Non-existent IDs
   - Case variations in addresses

### Test Data Management

**Test Fixtures:**
- Create reusable test data factories
- Use consistent test addresses and amounts
- Document magic numbers and test constants

**Example Test Data:**
```typescript
const VALID_STELLAR_ADDRESS = 'GABC...XYZ' // 56 chars, starts with G
const VALID_BASE_ADDRESS = '0x1234...5678' // 42 chars, starts with 0x
const VALID_AMOUNT = '10.5'
const INVALID_AMOUNT = '-5'
```

## Implementation Notes

### Jest Configuration

The project already has Jest configured. Tests should:
- Use TypeScript (`.test.ts` extension)
- Import from `@/lib/...` using the configured path alias
- Follow existing test patterns in the codebase

### Fake Timers Usage

For polling tests, use Jest fake timers:

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('polling with timeout', async () => {
  const promise = pollWithTimeout(/* ... */);
  jest.advanceTimersByTime(10000);
  await expect(promise).resolves.toBe(/* ... */);
});
```

### localStorage Mocking

For storage tests, mock localStorage:

```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  localStorageMock.clear();
});
```

### Test Isolation

Each test should be fully isolated:
- Clear localStorage before each test
- Reset all mocks
- Clean up timers
- No shared state between tests

## Success Criteria

The test suite is complete when:
1. All 4 test files are created and passing
2. All requirements have corresponding test cases
3. 100% branch coverage achieved for validation functions
4. All edge cases explicitly tested
5. No flaky tests (deterministic execution)
6. Tests run in under 5 seconds total
7. All mocks properly cleaned up (no memory leaks)
