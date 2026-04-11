import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authMiddleware } from './middleware/auth'
import authRoutes from './routes/auth'
import connectionRoutes from './routes/connections'
import propertyRoutes from './routes/properties'
import pricingRoutes from './routes/pricing'
import userRoutes from './routes/users'
import webhookRoutes from './routes/webhooks'
import analyticsRoutes from './routes/analytics'
import reservationRoutes from './routes/reservations'
import reviewRoutes from './routes/reviews'
import conversationRoutes from './routes/conversations'
import activityRoutes from './routes/activity'
import conciergeRoutes from './routes/concierge'
import taskRoutes from './routes/tasks'
import reportRoutes from './routes/reports'
import messagingRoutes from './routes/messaging'
import expenseRoutes from './routes/expenses'
import maintenanceRoutes from './routes/maintenance'
import cleaningRoutes from './routes/cleaning'
import documentRoutes from './routes/documents'
import autoMessageRoutes from './routes/auto-messages'
import ownerStatementRoutes from './routes/owner-statements'
import vendorRoutes from './routes/vendors'
import inventoryRoutes from './routes/inventory'
import notificationRoutes from './routes/notifications'
import guestCheckinRoutes from './routes/guest-checkins'
import keyHandoverRoutes from './routes/key-handovers'
import revenueForecastRoutes from './routes/revenue-forecast'
import teamShiftRoutes from './routes/team-shifts'
import taxReportRoutes from './routes/tax-reports'
import propertyComparisonRoutes from './routes/property-comparison'
import guestFeedbackRoutes from './routes/guest-feedback'
import securityDepositRoutes from './routes/security-deposits'
import rateParityRoutes from './routes/rate-parity'
import competitorRateRoutes from './routes/competitor-rates'
import loyaltyRoutes from './routes/loyalty'
import insuranceRoutes from './routes/insurance'
import utilityRoutes from './routes/utilities'
import pricingRecsRoutes from './routes/pricing-recommendations'
import portfolioRoutes from './routes/portfolio'
import staffPayrollRoutes from './routes/staff-payroll'
import channelSyncRoutes from './routes/channel-sync'
import { startJobProcessor } from './lib/job-queue'
import { registerAllJobHandlers } from './lib/jobs/handlers'

const app = new Hono()

// ==========================================
// Global middleware
// ==========================================
app.use('*', logger())

app.use(
  '/api/*',
  cors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// ==========================================
// Public routes (no auth required)
// ==========================================
app.route('/api/auth', authRoutes)
app.route('/api/webhooks', webhookRoutes)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ==========================================
// Protected routes (auth required)
// ==========================================
app.use('/api/connections/*', authMiddleware)
app.use('/api/properties/*', authMiddleware)
app.use('/api/pricing/*', authMiddleware)
app.use('/api/users/*', authMiddleware)
app.use('/api/analytics/*', authMiddleware)
app.use('/api/reservations/*', authMiddleware)
app.use('/api/reviews/*', authMiddleware)
app.use('/api/conversations/*', authMiddleware)
app.use('/api/activity/*', authMiddleware)
app.use('/api/concierge/*', authMiddleware)
app.use('/api/tasks/*', authMiddleware)
app.use('/api/reports/*', authMiddleware)
app.use('/api/messaging/*', authMiddleware)
app.use('/api/expenses/*', authMiddleware)
app.use('/api/maintenance/*', authMiddleware)
app.use('/api/cleaning/*', authMiddleware)
app.use('/api/documents/*', authMiddleware)
app.use('/api/auto-messages/*', authMiddleware)
app.use('/api/owner-statements/*', authMiddleware)
app.use('/api/vendors/*', authMiddleware)
app.use('/api/inventory/*', authMiddleware)
app.use('/api/notifications/*', authMiddleware)
app.use('/api/guest-checkins/*', authMiddleware)
app.use('/api/key-handovers/*', authMiddleware)
app.use('/api/revenue-forecast/*', authMiddleware)
app.use('/api/team-shifts/*', authMiddleware)
app.use('/api/tax-reports/*', authMiddleware)
app.use('/api/property-comparison/*', authMiddleware)
app.use('/api/guest-feedback/*', authMiddleware)
app.use('/api/security-deposits/*', authMiddleware)
app.use('/api/rate-parity/*', authMiddleware)
app.use('/api/competitor-rates/*', authMiddleware)
app.use('/api/loyalty/*', authMiddleware)
app.use('/api/insurance/*', authMiddleware)
app.use('/api/utilities/*', authMiddleware)
app.use('/api/pricing-recommendations/*', authMiddleware)
app.use('/api/portfolio/*', authMiddleware)
app.use('/api/staff-payroll/*', authMiddleware)
app.use('/api/channel-sync/*', authMiddleware)

app.route('/api/connections', connectionRoutes)
app.route('/api/properties', propertyRoutes)
app.route('/api/pricing', pricingRoutes)
app.route('/api/users', userRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/reservations', reservationRoutes)
app.route('/api/reviews', reviewRoutes)
app.route('/api/conversations', conversationRoutes)
app.route('/api/activity', activityRoutes)
app.route('/api/concierge', conciergeRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/reports', reportRoutes)
app.route('/api/messaging', messagingRoutes)
app.route('/api/expenses', expenseRoutes)
app.route('/api/maintenance', maintenanceRoutes)
app.route('/api/cleaning', cleaningRoutes)
app.route('/api/documents', documentRoutes)
app.route('/api/auto-messages', autoMessageRoutes)
app.route('/api/owner-statements', ownerStatementRoutes)
app.route('/api/vendors', vendorRoutes)
app.route('/api/inventory', inventoryRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/guest-checkins', guestCheckinRoutes)
app.route('/api/key-handovers', keyHandoverRoutes)
app.route('/api/revenue-forecast', revenueForecastRoutes)
app.route('/api/team-shifts', teamShiftRoutes)
app.route('/api/tax-reports', taxReportRoutes)
app.route('/api/property-comparison', propertyComparisonRoutes)
app.route('/api/guest-feedback', guestFeedbackRoutes)
app.route('/api/security-deposits', securityDepositRoutes)
app.route('/api/rate-parity', rateParityRoutes)
app.route('/api/competitor-rates', competitorRateRoutes)
app.route('/api/loyalty', loyaltyRoutes)
app.route('/api/insurance', insuranceRoutes)
app.route('/api/utilities', utilityRoutes)
app.route('/api/pricing-recommendations', pricingRecsRoutes)
app.route('/api/portfolio', portfolioRoutes)
app.route('/api/staff-payroll', staffPayrollRoutes)
app.route('/api/channel-sync', channelSyncRoutes)

// ==========================================
// Static file serving (production only)
// ==========================================
if (process.env.NODE_ENV === 'production') {
  const { serveStatic } = await import('@hono/node-server/serve-static')

  // Serve Vite build output
  app.use('/*', serveStatic({ root: './dist' }))

  // SPA fallback — serve index.html for non-API routes
  app.get('*', async (c) => {
    const fs = await import('node:fs/promises')
    const html = await fs.readFile('./dist/index.html', 'utf-8')
    return c.html(html)
  })
}

// ==========================================
// Start server
// ==========================================
const port = parseInt(process.env.SERVER_PORT || '3001')

// Register job handlers and start job processor
registerAllJobHandlers()
startJobProcessor(10_000) // Poll every 10 seconds

console.log(`
╔══════════════════════════════════════════╗
║          HostGrowth API Server           ║
║──────────────────────────────────────────║
║  Port: ${String(port).padEnd(33)}║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(33)}║
║  Jobs: MySQL queue (10s poll)            ║
╚══════════════════════════════════════════╝
`)

serve({
  fetch: app.fetch,
  port,
})

export default app
