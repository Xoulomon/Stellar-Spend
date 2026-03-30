# Implementation Plan: Utility Function Tests

## Overview

This implementation plan breaks down the creation of comprehensive unit tests for critical utility functions in the Stellar Spend application. The tests will be organized into four test modules using Vitest as the testing framework. Each task builds incrementally, ensuring test infrastructure is set up first, followed by implementation of tests for each utility category.

## Tasks

- [x] 1. Set up test infrastructure and helpers
  - Create test data factories for generating valid test data
  - Set up localStorage mock utilities
  - Create helper functions for common test patterns
  - _Requirements: All requirements (foundation for testing)_

- [ ] 2. Implement Soroban number conversion tests
  - [x] 2.1 Create test file for soroban-tx-builder utilities
    - Create `src/lib/offramp/adapters/soroban-tx-builder.test.ts`
    - Import `floatToInt` and `getNonceBigInt` functions
    - Set up test structure with describe blocks
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Write unit tests for floatToInt function
    - Test conversion of "10.5" with 7 decimals → "105000000"
    - Test conversion of "1" with 7 decimals → "10000000"
    - Test conversion of "0.0000001" with 7 decimals → "1"
    - Test truncation: "10.12345678" with 7 decimals → "101234567"
    - Test edge cases: zero values, large numbers
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.3 Write tests for getNonceBigInt function
    - Test that returned value is always positive BigInt
    - Test that multiple calls return unique values
    - Run test multiple times to verify uniqueness property
    - _Requirements: 1.5, 1.6_

- [ ] 3. Implement polling utility tests
  - [x] 3.1 Create test file for polling utilities
    - Create `src/lib/offramp/utils/polling.test.ts`
    - Import `pollWithTimeout` function
    - Set up Vitest fake timers in beforeEach/afterEach
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Write tests for immediate resolution
    - Test that pollWithTimeout resolves immediately when condition is met on first attempt
    - Verify no unnecessary delays occur
    - _Requirements: 2.1_

  - [x] 3.3 Write tests for delayed resolution
    - Test that pollWithTimeout resolves after N attempts when condition is met
    - Use fake timers to advance time deterministically
    - Verify correct number of polling iterations
    - _Requirements: 2.2_

  - [x] 3.4 Write tests for timeout behavior
    - Test that pollWithTimeout throws error with message "Polling timeout exceeded"
    - Verify timeout occurs at the correct time boundary
    - _Requirements: 2.3_

  - [x] 3.5 Write tests for progress callback
    - Test that onProgress callback is invoked on each attempt
    - Verify callback receives correct attempt numbers
    - Test callback is not invoked after resolution
    - _Requirements: 2.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all tests created so far
  - Verify no flaky tests (run multiple times)
  - Ensure all tests pass, ask the user if questions arise

- [ ] 5. Implement validation utility tests
  - [x] 5.1 Create test file for validation utilities
    - Create `src/lib/offramp/utils/validation.test.ts`
    - Import all validation functions
    - Set up test structure with describe blocks for each function
    - _Requirements: 3.1-3.16_

  - [x] 5.2 Write tests for validateAmount function
    - Test valid positive numbers return true
    - Test "0" returns true
    - Test negative numbers return false
    - Test "NaN" returns false
    - Test "Infinity" returns false
    - Test empty string returns false
    - Test decimal numbers with various formats
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 5.3 Write tests for validateAddress function (Stellar mode)
    - Test valid G-key addresses (56 chars, starts with G) return true
    - Test addresses with invalid length return false
    - Test addresses with wrong prefix return false
    - Test empty string returns false
    - _Requirements: 3.7, 3.8, 3.9_

  - [x] 5.4 Write tests for validateAddress function (Base mode)
    - Test valid 0x addresses (42 chars, starts with 0x) return true
    - Test addresses with wrong length return false
    - Test addresses with missing 0x prefix return false
    - Test addresses with invalid hex characters return false
    - _Requirements: 3.10, 3.11, 3.12_

  - [x] 5.5 Write tests for validateToken function
    - Test "USDC" returns true
    - Test "USDT" returns true
    - Test lowercase "usdc" returns false
    - Test invalid tokens return false
    - Test empty string returns false
    - _Requirements: 3.13, 3.14, 3.15, 3.16_

- [ ] 6. Implement transaction storage tests
  - [x] 6.1 Create test file for TransactionStorage
    - Create `src/lib/transaction-storage.test.ts`
    - Import TransactionStorage class
    - Set up localStorage mock in beforeEach
    - Create test transaction factory helper
    - _Requirements: 4.1-4.10_

  - [x] 6.2 Write tests for save() method
    - Test that save() persists transaction to storage
    - Test that multiple saves prepend to array (newest first)
    - Test that storage is trimmed to 50 transactions when exceeded
    - Verify transactions are retrievable via getAll()
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.3 Write tests for update() method
    - Test that update() modifies existing transaction
    - Test that updates persist to storage
    - Test that non-existent IDs are handled gracefully
    - Verify partial updates work correctly
    - _Requirements: 4.4_

  - [x] 6.4 Write tests for retrieval methods
    - Test getAll() returns empty array when storage is empty
    - Test getAll() returns all stored transactions
    - Test getByUser() filters by address correctly
    - Test getByUser() is case-insensitive
    - Test getById() returns correct transaction
    - Test getById() returns undefined for non-existent ID
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

  - [x] 6.5 Write tests for clear() and generateId() methods
    - Test clear() removes all transactions from storage
    - Test generateId() returns unique IDs on each call
    - Test generateId() format matches expected pattern
    - Verify storage is empty after clear()
    - _Requirements: 4.9, 4.10_

- [ ] 7. Final checkpoint and coverage verification
  - Run complete test suite
  - Verify 100% branch coverage for validation functions
  - Check for any flaky tests
  - Ensure all tests complete in under 5 seconds
  - Verify proper cleanup (no memory leaks from timers/mocks)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tests use Vitest as the testing framework (not Jest)
- Test files should use `.test.ts` extension
- Use `vi.useFakeTimers()` for polling tests (Vitest equivalent of Jest fake timers)
- Mock localStorage using Vitest's `vi.mock()` or manual mock implementation
- Each test should be fully isolated with proper setup/teardown
- Follow existing test patterns in the codebase (see `src/test/cn.test.ts` for reference)
- Import test utilities from 'vitest': `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`
- Use descriptive test names: "should [expected behavior] when [condition]"
- Group related tests using `describe` blocks
- All edge cases should be explicitly tested
- Tests should be deterministic (no random failures)
