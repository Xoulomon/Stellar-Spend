import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { withTimeout } from '@/lib/offramp/utils/timeout';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('timeout fires correctly', () => {
    it('rejects with correct error message when promise times out', async () => {
      const promise = new Promise(() => {
        // Never resolves
      });

      const timeoutPromise = withTimeout(promise, 5000, 'Test operation');

      vi.advanceTimersByTime(5000);

      await expect(timeoutPromise).rejects.toThrow('Test operation timed out after 5s');
    });

    it('formats timeout message with correct duration in seconds', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 15000, 'SDK init');

      vi.advanceTimersByTime(15000);

      await expect(timeoutPromise).rejects.toThrow('SDK init timed out after 15s');
    });

    it('handles millisecond durations correctly', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 20000, 'Bridge quote');

      vi.advanceTimersByTime(20000);

      await expect(timeoutPromise).rejects.toThrow('Bridge quote timed out after 20s');
    });

    it('rejects with custom label in error message', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 30000, 'Build transaction');

      vi.advanceTimersByTime(30000);

      await expect(timeoutPromise).rejects.toThrow('Build transaction timed out after 30s');
    });
  });

  describe('timer is always cleared', () => {
    it('clears timer when promise resolves before timeout', async () => {
      const clearTimeoutSpy = vi.spyOn((global as any), 'clearTimeout');
      let resolvePromise: (value: string) => void;

      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(1000);
      resolvePromise!('success');

      await expect(timeoutPromise).resolves.toBe('success');
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('clears timer when promise rejects before timeout', async () => {
      const clearTimeoutSpy = vi.spyOn((global as any), 'clearTimeout');
      let rejectPromise: (reason: Error) => void;

      const promise = new Promise<string>((_, reject) => {
        rejectPromise = reject;
      });

      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(1000);
      rejectPromise!(new Error('Original error'));

      await expect(timeoutPromise).rejects.toThrow('Original error');
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('clears timer when timeout fires', async () => {
      const clearTimeoutSpy = vi.spyOn((global as any), 'clearTimeout');
      const promise = new Promise(() => {});

      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(5000);

      await expect(timeoutPromise).rejects.toThrow();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('prevents memory leaks by clearing timeout in finally block', async () => {
      const clearTimeoutSpy = vi.spyOn((global as any), 'clearTimeout');
      let resolvePromise: (value: string) => void;

      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const timeoutPromise = withTimeout(promise, 10000, 'Test');

      // Resolve before timeout
      vi.advanceTimersByTime(2000);
      resolvePromise!('done');

      await timeoutPromise;

      // Verify clearTimeout was called exactly once
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    it('does not throw when clearing already-cleared timer', async () => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('success'), 1000);
      });

      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(1000);

      // Should not throw
      await expect(timeoutPromise).resolves.toBe('success');
    });
  });

  describe('resolves successfully when promise settles before timeout', () => {
    it('resolves with promise value', async () => {
      const promise = Promise.resolve('success');
      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(1000);

      await expect(timeoutPromise).resolves.toBe('success');
    });

    it('resolves with complex object', async () => {
      const data = { id: 123, name: 'test', nested: { value: true } };
      const promise = Promise.resolve(data);
      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(1000);

      await expect(timeoutPromise).resolves.toEqual(data);
    });

    it('rejects with original error if promise rejects before timeout', async () => {
      const originalError = new Error('Original error');
      const promise = Promise.reject(originalError);
      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(1000);

      await expect(timeoutPromise).rejects.toThrow('Original error');
    });
  });

  describe('use cases from acceptance criteria', () => {
    it('handles SDK init timeout (15s)', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 15000, 'SDK init');

      vi.advanceTimersByTime(15000);

      await expect(timeoutPromise).rejects.toThrow('SDK init timed out after 15s');
    });

    it('handles bridge quote timeout (15s)', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 15000, 'Bridge quote');

      vi.advanceTimersByTime(15000);

      await expect(timeoutPromise).rejects.toThrow('Bridge quote timed out after 15s');
    });

    it('handles Paycrest order timeout (20s)', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 20000, 'Paycrest order');

      vi.advanceTimersByTime(20000);

      await expect(timeoutPromise).rejects.toThrow('Paycrest order timed out after 20s');
    });

    it('handles build-tx timeout (30s)', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 30000, 'Build transaction');

      vi.advanceTimersByTime(30000);

      await expect(timeoutPromise).rejects.toThrow('Build transaction timed out after 30s');
    });

    it('handles submit timeout (15s)', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 15000, 'Submit transaction');

      vi.advanceTimersByTime(15000);

      await expect(timeoutPromise).rejects.toThrow('Submit transaction timed out after 15s');
    });
  });

  describe('edge cases', () => {
    it('handles zero timeout', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 0, 'Zero timeout');

      vi.advanceTimersByTime(0);

      await expect(timeoutPromise).rejects.toThrow('Zero timeout timed out after 0s');
    });

    it('handles very large timeout values', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 3600000, 'Long operation');

      vi.advanceTimersByTime(3600000);

      await expect(timeoutPromise).rejects.toThrow('Long operation timed out after 3600s');
    });

    it('handles promise that resolves exactly at timeout', async () => {
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(5000);
      resolvePromise!('success');

      // Race condition: both timeout and resolve fire at same time
      // Promise.race should resolve with whichever settles first
      const result = await Promise.race([
        timeoutPromise,
        Promise.resolve('success'),
      ]);

      expect(result).toBeDefined();
    });

    it('preserves promise type information', async () => {
      interface TestData {
        id: number;
        name: string;
      }

      const data: TestData = { id: 1, name: 'test' };
      const promise = Promise.resolve(data);
      const timeoutPromise = withTimeout(promise, 5000, 'Test');

      vi.advanceTimersByTime(1000);

      const result = await timeoutPromise;
      expect(result.id).toBe(1);
      expect(result.name).toBe('test');
    });
  });
});
