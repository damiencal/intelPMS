/**
 * Per-connection rate limiter with exponential backoff.
 * Ensures we don't exceed Hostex API rate limits.
 */

interface RateLimitState {
  lastRequestAt: number
  requestCount: number
  windowStart: number
}

const connectionLimits = new Map<string, RateLimitState>()

const MAX_REQUESTS_PER_SECOND = 5
const WINDOW_MS = 1000

/**
 * Wait if needed before making a request for a given connection
 */
export async function throttle(connectionId: string): Promise<void> {
  const now = Date.now()
  let state = connectionLimits.get(connectionId)

  if (!state || now - state.windowStart > WINDOW_MS) {
    state = { lastRequestAt: now, requestCount: 0, windowStart: now }
    connectionLimits.set(connectionId, state)
  }

  if (state.requestCount >= MAX_REQUESTS_PER_SECOND) {
    const waitMs = WINDOW_MS - (now - state.windowStart)
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
    state.requestCount = 0
    state.windowStart = Date.now()
  }

  state.requestCount++
  state.lastRequestAt = Date.now()
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) break

      // Check if it's a rate limit error (429) — wait longer
      const isRateLimit =
        lastError.message.includes('429') || lastError.message.includes('rate limit')
      const delay = isRateLimit
        ? baseDelay * Math.pow(2, attempt) * 2
        : baseDelay * Math.pow(2, attempt)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
