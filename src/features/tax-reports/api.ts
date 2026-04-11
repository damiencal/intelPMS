import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface TaxReport {
  id: string
  organizationId: string
  name: string
  period: string
  year: number
  quarter: number | null
  month: number | null
  totalIncome: number
  totalExpenses: number
  netIncome: number
  taxableAmount: number
  taxRate: number | null
  estimatedTax: number
  deductions: { category: string; amount: number }[] | null
  propertyBreakdown: { propertyId: string; propertyName: string; income: number; expenses: number }[] | null
  status: string
  notes: string | null
  filedAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TaxReportStats {
  year: number
  totalReports: number
  totalIncome: number
  totalExpenses: number
  netIncome: number
  totalEstimatedTax: number
  drafted: number
  finalized: number
  filed: number
}

export const PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
]

export const TAX_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
  { value: 'filed', label: 'Filed' },
]

const taxKeys = {
  all: ['tax-reports'] as const,
  list: (p: Record<string, unknown>) => ['tax-reports', 'list', p] as const,
  stats: (year: number) => ['tax-reports', 'stats', year] as const,
  detail: (id: string) => ['tax-reports', 'detail', id] as const,
}

export function useTaxReports(params: {
  page?: number
  perPage?: number
  year?: number
  period?: string
  status?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.year) sp.set('year', String(params.year))
  if (params.period) sp.set('period', params.period)
  if (params.status) sp.set('status', params.status)

  return useQuery({
    queryKey: taxKeys.list(params),
    queryFn: () => api.get(`/api/tax-reports?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useTaxReportStats(year: number = new Date().getFullYear()) {
  return useQuery<{ data: TaxReportStats }>({
    queryKey: taxKeys.stats(year),
    queryFn: () => api.get(`/api/tax-reports/stats?year=${year}`).then((r) => r.json()),
  })
}

export function useTaxReport(id: string) {
  return useQuery<{ data: TaxReport }>({
    queryKey: taxKeys.detail(id),
    queryFn: () => api.get(`/api/tax-reports/${id}`).then((r) => r.json()),
    enabled: !!id,
  })
}

export function useCreateTaxReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/tax-reports', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxKeys.all })
    },
  })
}

export function useUpdateTaxReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      api.put(`/api/tax-reports/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxKeys.all })
    },
  })
}

export function useDeleteTaxReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/tax-reports/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taxKeys.all })
    },
  })
}
