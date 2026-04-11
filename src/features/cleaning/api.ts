import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface CleaningSchedule {
  id: string
  organizationId: string
  propertyId: string
  property: { id: string; name: string } | null
  reservationId: string | null
  type: 'turnover' | 'deep_clean' | 'routine' | 'pre_checkin'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  scheduledDate: string
  scheduledTime: string | null
  assignee: string | null
  estimatedHours: number | null
  actualHours: number | null
  cost: number | null
  notes: string | null
  checklist: string | null // JSON
  completedAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CleaningStats {
  today: number
  thisWeek: number
  pending: number
  completed: number
}

export const CLEANING_TYPES = [
  { value: 'turnover', label: 'Turnover' },
  { value: 'deep_clean', label: 'Deep Clean' },
  { value: 'routine', label: 'Routine' },
  { value: 'pre_checkin', label: 'Pre Check-in' },
]

export const CLEANING_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
]

const cleaningKeys = {
  all: ['cleaning'] as const,
  list: (p: Record<string, unknown>) => ['cleaning', 'list', p] as const,
  upcoming: (days?: number) => ['cleaning', 'upcoming', days] as const,
  stats: ['cleaning', 'stats'] as const,
}

export function useCleaningSchedules(params: {
  page?: number
  perPage?: number
  status?: string
  propertyId?: string
  type?: string
  startDate?: string
  endDate?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.status) sp.set('status', params.status)
  if (params.propertyId) sp.set('property_id', params.propertyId)
  if (params.type) sp.set('type', params.type)
  if (params.startDate) sp.set('start_date', params.startDate)
  if (params.endDate) sp.set('end_date', params.endDate)

  return useQuery({
    queryKey: cleaningKeys.list(params),
    queryFn: () =>
      api.get<{
        data: CleaningSchedule[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/cleaning?${sp}`),
  })
}

export function useUpcomingCleanings(days = 7) {
  return useQuery({
    queryKey: cleaningKeys.upcoming(days),
    queryFn: () => api.get<{ data: CleaningSchedule[] }>(`/cleaning/upcoming?days=${days}`),
    select: (res) => res.data,
  })
}

export function useCleaningStats() {
  return useQuery({
    queryKey: cleaningKeys.stats,
    queryFn: () => api.get<{ data: CleaningStats }>('/cleaning/stats'),
    select: (res) => res.data,
  })
}

export function useCreateCleaning() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      propertyId: string
      reservationId?: string
      type: string
      scheduledDate: string
      scheduledTime?: string
      assignee?: string
      estimatedHours?: number
      cost?: number
      notes?: string
      checklist?: { item: string; done: boolean }[]
    }) => api.post<{ data: CleaningSchedule }>('/cleaning', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cleaningKeys.all })
    },
  })
}

export function useUpdateCleaning() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<{
      type: string
      status: string
      scheduledDate: string
      scheduledTime: string | null
      assignee: string | null
      estimatedHours: number | null
      actualHours: number | null
      cost: number | null
      notes: string | null
      checklist: { item: string; done: boolean }[]
    }>) => api.put<{ data: CleaningSchedule }>(`/cleaning/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cleaningKeys.all })
    },
  })
}

export function useDeleteCleaning() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cleaning/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cleaningKeys.all })
    },
  })
}
