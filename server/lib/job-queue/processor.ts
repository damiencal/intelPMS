import { prisma } from '../prisma'

export type JobHandler = (payload: Record<string, unknown>) => Promise<void>

const handlers = new Map<string, JobHandler>()

/**
 * Register a handler for a specific queue name
 */
export function registerJobHandler(queue: string, handler: JobHandler): void {
  handlers.set(queue, handler)
}

/**
 * Enqueue a job for async processing
 */
export async function enqueueJob(
  queue: string,
  payload: Record<string, unknown>,
  options?: { scheduledAt?: Date; maxAttempts?: number }
): Promise<string> {
  const job = await prisma.jobQueue.create({
    data: {
      queue,
      payload: payload as never,
      maxAttempts: options?.maxAttempts ?? 3,
      scheduledAt: options?.scheduledAt ?? new Date(),
    },
  })
  return job.id
}

/**
 * Process pending jobs — called by polling interval or cron
 */
export async function processJobs(batchSize = 10): Promise<number> {
  const now = new Date()

  // Select pending jobs that are scheduled for now or earlier
  const jobs = await prisma.jobQueue.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: batchSize,
  })

  let processed = 0

  for (const job of jobs) {
    const handler = handlers.get(job.queue)
    if (!handler) {
      console.warn(`No handler registered for queue: ${job.queue}`)
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          lastError: `No handler registered for queue: ${job.queue}`,
        },
      })
      continue
    }

    // Mark as processing
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: {
        status: 'processing',
        startedAt: new Date(),
        attempts: job.attempts + 1,
      },
    })

    try {
      await handler(job.payload as Record<string, unknown>)

      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })
      processed++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const newAttempts = job.attempts + 1

      if (newAttempts >= job.maxAttempts) {
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            lastError: errorMessage,
          },
        })
      } else {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, newAttempts) * 1000 // 2s, 4s, 8s, ...
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'pending',
            lastError: errorMessage,
            scheduledAt: new Date(Date.now() + retryDelay),
          },
        })
      }
    }
  }

  return processed
}

let pollingInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start polling for jobs at a given interval (ms)
 */
export function startJobProcessor(intervalMs = 10_000): void {
  if (pollingInterval) return

  console.log(`[JobQueue] Starting processor, polling every ${intervalMs}ms`)
  pollingInterval = setInterval(async () => {
    try {
      const count = await processJobs()
      if (count > 0) {
        console.log(`[JobQueue] Processed ${count} jobs`)
      }
    } catch (error) {
      console.error('[JobQueue] Processing error:', error)
    }
  }, intervalMs)
}

/**
 * Stop polling
 */
export function stopJobProcessor(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
    console.log('[JobQueue] Processor stopped')
  }
}
