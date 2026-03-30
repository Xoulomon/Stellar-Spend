# Requirements Document: Utility Function Tests

## Introduction

This feature involves writing comprehensive unit tests for critical utility functions used throughout the Stellar Spend application. These utilities handle number conversions, polling with timeouts, input validation, and transaction storage management. The tests ensure correctness, edge case handling, and reliability of these foundational components.

## Glossary

- **Soroban**: Stellar's smart contract platform
- **floatToInt**: Utility function that converts decimal numbers to integers with specified decimal places
- **getNonceBigInt**: Utility function that generates unique nonce values as BigInts
- **pollWithTimeout**: Utility function that repeatedly checks a condition until met or timeout occurs
- **Validation Utilities**: Functions that verify input correctness (amounts, addresses, tokens)
- **TransactionStorage**: In-memory storage system for transaction history
- **localStorage**: Browser's persistent key-value storage API
- **Jest**: JavaScript testing framework used in this project
- **Fake Timers**: Jest feature to control time progression in tests

## Requirements

### Requirement 1: Soroban Number Conversion Tests

**User Story:** As a developer, I want unit tests for Soroban number conversion utilities, so that I can ensure numeric conversions are accurate and handle edge cases correctly.

#### Acceptance Criteria

1. WHEN floatToInt is called with "10.5" and 7 decimal places, THE System SHALL convert it to "105000000"
2. WHEN floatToInt is called with "1" and 7 decimal places, THE System SHALL convert it to "10000000"
3. WHEN floatToInt is called with "0.0000001" and 7 decimal places, THE System SHALL convert it to "1"
4. WHEN floatToInt is called with "10.12345678" and 7 decimal places, THE System SHALL truncate to 7 decimals and convert to "101234567"
5. WHEN getNonceBigInt is called, THE System SHALL return a positive BigInt value
6. WHEN getNonceBigInt is called multiple times, THE System SHALL return different values on each call

### Requirement 2: Polling with Timeout Tests

**User Story:** As a developer, I want unit tests for the polling utility with timeout functionality, so that I can verify polling behavior works correctly under various conditions.

#### Acceptance Criteria

1. WHEN pollWithTimeout is called and the condition is met on the first attempt, THE System SHALL resolve immediately
2. WHEN pollWithTimeout is called and the condition is met after N attempts, THE System SHALL resolve after N iterations
3. WHEN pollWithTimeout is called and the timeout is exceeded, THE System SHALL throw an error with message "Polling timeout exceeded"
4. WHEN pollWithTimeout is called with an onProgress callback, THE System SHALL call the callback on each attempt
5. WHEN testing pollWithTimeout, THE System SHALL use jest.useFakeTimers() to avoid real delays

### Requirement 3: Input Validation Tests

**User Story:** As a developer, I want comprehensive unit tests for all validation utilities, so that I can ensure input validation is robust and handles all edge cases.

#### Acceptance Criteria

1. WHEN validateAmount is called with valid float strings, THE System SHALL return true
2. WHEN validateAmount is called with "0", THE System SHALL return true
3. WHEN validateAmount is called with negative numbers, THE System SHALL return false
4. WHEN validateAmount is called with "NaN", THE System SHALL return false
5. WHEN validateAmount is called with "Infinity", THE System SHALL return false
6. WHEN validateAmount is called with empty string, THE System SHALL return false
7. WHEN validateAddress is called with "stellar" mode and valid G-key, THE System SHALL return true
8. WHEN validateAddress is called with "stellar" mode and invalid length, THE System SHALL return false
9. WHEN validateAddress is called with "stellar" mode and wrong prefix, THE System SHALL return false
10. WHEN validateAddress is called with "base" mode and valid 0x address, THE System SHALL return true
11. WHEN validateAddress is called with "base" mode and wrong length, THE System SHALL return false
12. WHEN validateAddress is called with "base" mode and missing 0x prefix, THE System SHALL return false
13. WHEN validateToken is called with "USDC", THE System SHALL return true
14. WHEN validateToken is called with "USDT", THE System SHALL return true
15. WHEN validateToken is called with lowercase "usdc", THE System SHALL return false
16. WHEN validateToken is called with invalid token, THE System SHALL return false

### Requirement 4: Transaction Storage Tests

**User Story:** As a developer, I want unit tests for all TransactionStorage methods, so that I can ensure transaction persistence and retrieval work correctly.

#### Acceptance Criteria

1. WHEN save() is called with a transaction, THE System SHALL save it to storage
2. WHEN save() is called with multiple transactions, THE System SHALL prepend new transactions to the array
3. WHEN save() is called and storage exceeds 50 transactions, THE System SHALL trim to 50 most recent
4. WHEN update() is called with an existing transaction ID, THE System SHALL update that transaction
5. WHEN getAll() is called and localStorage is empty, THE System SHALL return an empty array
6. WHEN getByUser() is called with an address, THE System SHALL return only transactions for that address
7. WHEN getByUser() is called with different case variations, THE System SHALL match case-insensitively
8. WHEN getById() is called with a valid ID, THE System SHALL return the correct transaction
9. WHEN clear() is called, THE System SHALL remove all transactions from storage
10. WHEN generateId() is called multiple times, THE System SHALL return unique IDs each time

## Testing Approach

- All tests use Jest as the testing framework
- localStorage is mocked using jest-localstorage-mock or manual Jest mocks
- Fake timers are used for timeout testing to avoid real delays
- Tests cover both happy paths and edge cases
- 100% branch coverage is targeted for validation functions
- Each utility function has at least one passing test

