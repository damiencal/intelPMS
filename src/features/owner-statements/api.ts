import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PropertySummary {
  propertyId: string
  propertyName: string
  currency: string | null
  revenue: number
  expenses: number
  reservationCount: number
  netIncome: number
}

export interface MonthStatement {
  month: string
  monthStart: string
  revenue: {
    total: number
    reservations: {
      guestName: string | null
      checkIn: string
      checkOut: string
      amount: number | null
      channel: string | null
    }[]
  }
  expenses: {
    total: number
    byCategory: { category: string; amount: number }[]
    items: { amount: number; category: string; description: string | null; date: string }[]
  }
  maintenance: {
    total: number
    items: { actualCost: number | null; estimatedCost: number | null; title: string; status: string }[]
  }
  netIncome: number
}

export interface PropertyStatement {
  property: { id: string; name: string; currency: string | null }
  statements: MonthStatement[]
  summary: {
    totalRevenue: number
    totalExpenses: number
    totalMaintenance: number
    netIncome: number
  }
}

const stmtKeys = {
  all: ['owner-statements'] as const,
  summary: (months?: number) => ['owner-statements', 'summary', months] as const,
  property: (id: string, months?: number) => ['owner-statements', 'property', id, months] as const,
}

export function useOwnerStatementsSummary(months = 1) {
  return useQuery({
    queryKey: stmtKeys.summary(months),
    queryFn: () => api.get<{ data: PropertySummary[] }>(`/owner-statements?months=${months}`),
    select: (res) => res.data,
  })
}

export function usePropertyStatement(propertyId: string, months = 3) {
  return useQuery({
    queryKey: stmtKeys.property(propertyId, months),
    queryFn: () =>
      api.get<{ data: PropertyStatement }>(`/owner-statements/${propertyId}?months=${months}`),
    select: (res) => res.data,
    enabled: !!propertyId,
  })
}
