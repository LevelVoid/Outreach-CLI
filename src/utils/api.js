import { log } from './logger.js';

// ─── Fetch with Retry + Exponential Backoff ───────────────────────────────────

/**
 * Makes a fetch request with automatic retry on rate limits (429) and
 * server errors (5xx), using exponential backoff.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {{ maxRetries?: number, baseDelayMs?: number, timeoutMs?: number }} retryConfig
 * @returns {Promise<any>} Parsed JSON response
 */
export async function fetchWithRetry(url, options = {}, {
  maxRetries = 3,
  baseDelayMs = 1000,
  timeoutMs = 30000,
} = {}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Rate limited — wait and retry
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '1', 10);
        const waitMs = Math.max(retryAfter * 1000, baseDelayMs * Math.pow(2, attempt - 1));
        log.warn(`Rate limited. Waiting ${(waitMs / 1000).toFixed(1)}s before retry ${attempt}/${maxRetries}...`);
        await sleep(waitMs);
        continue;
      }

      // Server error — retry with backoff
      if (response.status >= 500) {
        const waitMs = baseDelayMs * Math.pow(2, attempt - 1);
        log.warn(`Server error ${response.status}. Retrying in ${(waitMs / 1000).toFixed(1)}s (attempt ${attempt}/${maxRetries})...`);
        await sleep(waitMs);
        continue;
      }

      // Client error — don't retry (e.g. 401, 403, 404)
      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (_) {}
        const err = new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
        err.status = response.status;
        err.body = errorBody;
        throw err;
      }

      // Success
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();

    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
      }

      // If it's our own thrown HTTP error, re-throw immediately (no retry)
      if (err.status && err.status < 500) {
        throw err;
      }

      // Network error — retry if we have attempts left
      if (attempt < maxRetries) {
        const waitMs = baseDelayMs * Math.pow(2, attempt - 1);
        log.warn(`Network error: ${err.message}. Retrying in ${(waitMs / 1000).toFixed(1)}s...`);
        await sleep(waitMs);
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${url}`);
}

// ─── Utility: Sleep ───────────────────────────────────────────────────────────

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
