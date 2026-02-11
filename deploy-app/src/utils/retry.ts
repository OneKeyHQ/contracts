/**
 * Retry utility with exponential backoff and jitter.
 * Used for RPC calls that may fail due to rate limiting or network issues.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Callback when a retry occurs */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * RPC-related error patterns that should trigger a retry
 */
const RETRYABLE_ERROR_PATTERNS = [
  /rate limit/i,
  /too many requests/i,
  /429/,
  /timeout/i,
  /timed out/i,
  /ETIMEDOUT/,
  /ECONNRESET/,
  /ECONNREFUSED/,
  /ENOTFOUND/,
  /network/i,
  /fetch failed/i,
  /failed to fetch/i,
  /connection/i,
  /unavailable/i,
  /503/,
  /502/,
  /500/,
];

/**
 * Error patterns that should NOT be retried (user errors)
 */
const NON_RETRYABLE_ERROR_PATTERNS = [
  /insufficient funds/i,
  /user rejected/i,
  /user denied/i,
  /rejected by user/i,
  /nonce too low/i,
  /already known/i,
  /replacement transaction/i,
];

/**
 * Check if an error is retryable based on error message patterns
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message || '';

  // First check if it's a non-retryable error
  if (NON_RETRYABLE_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return false;
  }

  // Then check if it matches retryable patterns
  return RETRYABLE_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Calculate delay with exponential backoff and jitter
 * Formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 * Jitter: random 0-500ms to prevent thundering herd
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic using exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry = opts.isRetryable
        ? opts.isRetryable(lastError)
        : isRetryableError(lastError);

      // If not retryable or last attempt, throw immediately
      if (!shouldRetry || attempt === opts.maxRetries) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay);
      opts.onRetry?.(lastError, attempt + 1, delay);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Classify error type for user-friendly messages
 */
export type ErrorType = 'rate_limit' | 'network' | 'user_rejected' | 'insufficient_funds' | 'unknown';

export function classifyError(error: Error): ErrorType {
  const message = error.message || '';

  if (/rate limit|too many requests|429/i.test(message)) {
    return 'rate_limit';
  }
  if (/user rejected|user denied|rejected by user/i.test(message)) {
    return 'user_rejected';
  }
  if (/insufficient funds/i.test(message)) {
    return 'insufficient_funds';
  }
  if (/timeout|network|connection|fetch failed|ECONNRESET|ETIMEDOUT/i.test(message)) {
    return 'network';
  }
  return 'unknown';
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error: Error): string {
  const errorType = classifyError(error);

  switch (errorType) {
    case 'rate_limit':
      return 'Rate limited by RPC, retrying...';
    case 'network':
      return 'Network error, retrying...';
    case 'user_rejected':
      return 'Transaction rejected by user';
    case 'insufficient_funds':
      return 'Insufficient balance for gas';
    default:
      // Return original message for unknown errors, truncated if too long
      const msg = error.message || 'Deployment failed';
      return msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
  }
}
