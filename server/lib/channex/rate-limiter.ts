/**
 * Channex API rate limiter — mirrors the Hostex rate limiter pattern.
 * Channex allows reasonable request volumes; we throttle to 10 req/s per connection.
 */

interface RateLimitState {
  requestCount: number
  windowStart: number
}

const connectionLimits = new Map<string, RateLimitState>()

const MAX_REQUESTS_PER_SECOND = 10
const WINDOW_MS = 1000

export async function throttle(connectionId: string): Promise<void> {
  const now = Date.now()
  let state = connectionLimits.get(connectionId)

  if (!state || now - state.windowStart > WINDOW_MS) {
    state = { requestCount: 0, windowStart: now }
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
}

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

      const isRateLimit =
        lastError.message.includes('429') || lastError.message.toLowerCase().includes('rate limit')
      const delay = isRateLimit
        ? baseDelay * Math.pow(2, attempt) * 2
        : baseDelay * Math.pow(2, attempt)

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
