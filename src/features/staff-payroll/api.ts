import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StaffPayroll {
  id: string
  organizationId: string
  staffName: string
  staffEmail: string | null
  role: string
  payType: string
  payRate: number
  currency: string
  hoursWorked: number | null
  tasksCompleted: number | null
  grossAmount: number
  deductions: number
  netAmount: number
  periodStart: string
  periodEnd: string
  paidDate: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface StaffPayrollStats {
  total: number
  pending: number
  approved: number
  paid: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  totalHours: number
  totalTasks: number
  byRole: Record<string, { count: number; totalNet: number }>
  uniqueStaff: number
}

export const PAYROLL_ROLES = [
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'manager', label: 'Manager' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'other', label: 'Other' },
]

export const PAY_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
  { value: 'per_task', label: 'Per Task' },
  { value: 'commission', label: 'Commission' },
]

export const PAYROLL_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

const keys = {
  all: ['staff-payroll'] as const,
  list: (p: Record<string, unknown>) => ['staff-payroll', 'list', p] as const,
  stats: () => ['staff-payroll', 'stats'] as const,
}

export function useStaffPayroll(
  params: {
    page?: number
    perPage?: number
    role?: string
    status?: string
    pay_type?: string
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.role) sp.set('role', params.role)
  if (params.status) sp.set('status', params.status)
  if (params.pay_type) sp.set('pay_type', params.pay_type)

  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => api.get(`/staff-payroll?${sp.toString()}`),
  })
}

export function useStaffPayrollStats() {
  return useQuery({
    queryKey: keys.stats(),
    queryFn: () => api.get('/staff-payroll/stats'),
  })
}

export function useCreateStaffPayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/staff-payroll', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useUpdateStaffPayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) =>
      api.put(`/staff-payroll/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteStaffPayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff-payroll/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
