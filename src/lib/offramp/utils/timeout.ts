/**
 * Wraps a promise with a timeout that rejects if the promise doesn't settle
 * within the specified duration.
 *
 * @param promise - The promise to wrap
 * @param ms - Timeout duration in milliseconds
 * @param label - Human-readable label for the operation (used in error message)
 * @returns A promise that rejects with a timeout error if the original promise
 *          doesn't settle within the specified time
 *
 * @example
 * const result = await withTimeout(
 *   fetchData(),
 *   15000,
 *   "Data fetch"
 * );
 * // Throws: "Data fetch timed out after 15s"
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });
}
