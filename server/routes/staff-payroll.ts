import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { type AppVariables, requireRole } from '../middleware/auth'

const staffPayroll = new Hono<{ Variables: AppVariables }>()

// GET /api/staff-payroll
staffPayroll.get('/', async (c) => {
  const user = c.get('user')
  const page = Number(c.req.query('page') ?? '1')
  const perPage = Number(c.req.query('per_page') ?? '20')
  const role = c.req.query('role')
  const status = c.req.query('status')
  const payType = c.req.query('pay_type')

  const where: any = { organizationId: user.organizationId }
  if (role) where.role = role
  if (status) where.status = status
  if (payType) where.payType = payType

  const [data, total] = await Promise.all([
    prisma.staffPayroll.findMany({
      where,
      orderBy: { periodEnd: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.staffPayroll.count({ where }),
  ])

  return c.json({
    data,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
  })
})

// GET /api/staff-payroll/stats
staffPayroll.get('/stats', async (c) => {
  const user = c.get('user')
  const orgFilter = { organizationId: user.organizationId }

  const records = await prisma.staffPayroll.findMany({
    where: orgFilter,
    select: {
      role: true,
      payType: true,
      grossAmount: true,
      deductions: true,
      netAmount: true,
      status: true,
      hoursWorked: true,
      tasksCompleted: true,
    },
  })

  const total = records.length
  const pending = records.filter((r) => r.status === 'pending').length
  const approved = records.filter((r) => r.status === 'approved').length
  const paid = records.filter((r) => r.status === 'paid').length

  const totalGross = records.reduce((s, r) => s + (r.grossAmount || 0), 0)
  const totalDeductions = records.reduce((s, r) => s + (r.deductions || 0), 0)
  const totalNet = records.reduce((s, r) => s + (r.netAmount || 0), 0)
  const totalHours = records.reduce((s, r) => s + (r.hoursWorked || 0), 0)
  const totalTasks = records.reduce((s, r) => s + (r.tasksCompleted || 0), 0)

  // By role
  const byRole: Record<string, { count: number; totalNet: number }> = {}
  records.forEach((r) => {
    if (!byRole[r.role]) byRole[r.role] = { count: 0, totalNet: 0 }
    byRole[r.role].count++
    byRole[r.role].totalNet += r.netAmount || 0
  })

  // Unique staff count
  const uniqueStaff = new Set(records.map((r) => `${r.role}`)).size

  return c.json({
    data: {
      total,
      pending,
      approved,
      paid,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      totalTasks,
      byRole,
      uniqueStaff,
    },
  })
})

// POST /api/staff-payroll
staffPayroll.post('/', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const grossAmount =
    body.grossAmount ??
    (body.payType === 'hourly'
      ? (body.payRate || 0) * (body.hoursWorked || 0)
      : body.payType === 'per_task'
        ? (body.payRate || 0) * (body.tasksCompleted || 0)
        : body.payRate || 0)

  const netAmount = grossAmount - (body.deductions || 0)

  const record = await prisma.staffPayroll.create({
    data: {
      organizationId: user.organizationId,
      staffName: body.staffName,
      staffEmail: body.staffEmail || null,
      role: body.role,
      payType: body.payType,
      payRate: body.payRate,
      currency: body.currency || 'USD',
      hoursWorked: body.hoursWorked || null,
      tasksCompleted: body.tasksCompleted || null,
      grossAmount,
      deductions: body.deductions || 0,
      netAmount,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      paidDate: body.paidDate ? new Date(body.paidDate) : null,
      status: body.status || 'pending',
      notes: body.notes || null,
    },
  })

  return c.json({ data: record }, 201)
})

// PUT /api/staff-payroll/:id
staffPayroll.put('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json()

  const existing = await prisma.staffPayroll.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Payroll record not found' }, 404)

  const grossAmount =
    body.grossAmount ??
    (body.payType === 'hourly'
      ? (body.payRate || existing.payRate) * (body.hoursWorked ?? existing.hoursWorked ?? 0)
      : body.payType === 'per_task'
        ? (body.payRate || existing.payRate) *
          (body.tasksCompleted ?? existing.tasksCompleted ?? 0)
        : body.payRate || existing.payRate)

  const deductions = body.deductions ?? existing.deductions
  const netAmount = grossAmount - deductions

  const record = await prisma.staffPayroll.update({
    where: { id },
    data: {
      staffName: body.staffName ?? existing.staffName,
      staffEmail: body.staffEmail ?? existing.staffEmail,
      role: body.role ?? existing.role,
      payType: body.payType ?? existing.payType,
      payRate: body.payRate ?? existing.payRate,
      currency: body.currency ?? existing.currency,
      hoursWorked: body.hoursWorked ?? existing.hoursWorked,
      tasksCompleted: body.tasksCompleted ?? existing.tasksCompleted,
      grossAmount,
      deductions,
      netAmount,
      periodStart: body.periodStart ? new Date(body.periodStart) : existing.periodStart,
      periodEnd: body.periodEnd ? new Date(body.periodEnd) : existing.periodEnd,
      paidDate: body.paidDate ? new Date(body.paidDate) : existing.paidDate,
      status: body.status ?? existing.status,
      notes: body.notes ?? existing.notes,
    },
  })

  return c.json({ data: record })
})

// DELETE /api/staff-payroll/:id
staffPayroll.delete('/:id', requireRole('owner', 'manager'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const existing = await prisma.staffPayroll.findFirst({
    where: { id, organizationId: user.organizationId },
  })
  if (!existing) return c.json({ error: 'Payroll record not found' }, 404)

  await prisma.staffPayroll.delete({ where: { id } })
  return c.json({ message: 'Deleted' })
})

export default staffPayroll
