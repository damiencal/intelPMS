import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface Expense {
  id: string
  organizationId: string
  propertyId: string | null
  property: { id: string; name: string } | null
  category: string
  description: string
  amount: number
  currency: string
  date: string
  vendor: string | null
  receiptUrl: string | null
  recurring: boolean
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseSummary {
  byCategory: { category: string; amount: number }[]
  monthly: { month: string; amount: number }[]
  total: number
}

export type ExpenseCategory =
  | 'cleaning'
  | 'maintenance'
  | 'supplies'
  | 'utilities'
  | 'insurance'
  | 'taxes'
  | 'marketing'
  | 'other'

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
]

// ---- Keys ----
const expenseKeys = {
  all: ['expenses'] as const,
  list: (params: Record<string, unknown>) => ['expenses', 'list', params] as const,
  summary: (months?: number) => ['expenses', 'summary', months] as const,
}

// ---- Hooks ----

export function useExpenses(params: {
  page?: number
  perPage?: number
  category?: string
  propertyId?: string
  startDate?: string
  endDate?: string
} = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.perPage) searchParams.set('per_page', String(params.perPage))
  if (params.category) searchParams.set('category', params.category)
  if (params.propertyId) searchParams.set('property_id', params.propertyId)
  if (params.startDate) searchParams.set('start_date', params.startDate)
  if (params.endDate) searchParams.set('end_date', params.endDate)

  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () =>
      api.get<{
        data: Expense[]
        meta: { total: number; page: number; perPage: number; totalPages: number; totalAmount: number }
      }>(`/expenses?${searchParams}`),
  })
}

export function useExpenseSummary(months = 12) {
  return useQuery({
    queryKey: expenseKeys.summary(months),
    queryFn: () => api.get<{ data: ExpenseSummary }>(`/expenses/summary?months=${months}`),
    select: (res) => res.data,
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      propertyId?: string
      category: string
      description: string
      amount: number
      currency?: string
      date: string
      vendor?: string
      receiptUrl?: string
      recurring?: boolean
      notes?: string
    }) => api.post<{ data: Expense }>('/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useUpdateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Omit<Expense, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy'>>) =>
      api.put<{ data: Expense }>(`/expenses/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}
