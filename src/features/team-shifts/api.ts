import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface TeamShift {
  id: string
  organizationId: string
  propertyId: string | null
  property: { id: string; name: string } | null
  assignee: string
  date: string
  startTime: string
  endTime: string
  type: string
  status: string
  notes: string | null
  hoursWorked: number | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TeamShiftStats {
  total: number
  thisWeek: number
  completed: number
  cancelled: number
  uniqueAssignees: number
  byAssignee: { assignee: string; count: number }[]
}

export const SHIFT_TYPES = [
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'check_out', label: 'Check-out' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'general', label: 'General' },
]

export const SHIFT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

const shiftKeys = {
  all: ['team-shifts'] as const,
  list: (p: Record<string, unknown>) => ['team-shifts', 'list', p] as const,
  stats: ['team-shifts', 'stats'] as const,
  assignees: ['team-shifts', 'assignees'] as const,
}

export function useTeamShifts(params: {
  page?: number
  perPage?: number
  assignee?: string
  type?: string
  status?: string
  propertyId?: string
  dateFrom?: string
  dateTo?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.assignee) sp.set('assignee', params.assignee)
  if (params.type) sp.set('type', params.type)
  if (params.status) sp.set('status', params.status)
  if (params.propertyId) sp.set('property_id', params.propertyId)
  if (params.dateFrom) sp.set('date_from', params.dateFrom)
  if (params.dateTo) sp.set('date_to', params.dateTo)

  return useQuery({
    queryKey: shiftKeys.list(params),
    queryFn: () => api.get(`/api/team-shifts?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useTeamShiftStats() {
  return useQuery({
    queryKey: shiftKeys.stats,
    queryFn: () => api.get('/api/team-shifts/stats').then((r) => r.json()),
  })
}

export function useTeamShiftAssignees() {
  return useQuery({
    queryKey: shiftKeys.assignees,
    queryFn: () => api.get('/api/team-shifts/assignees').then((r) => r.json()),
  })
}

export function useCreateTeamShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/team-shifts', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}

export function useUpdateTeamShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      api.put(`/api/team-shifts/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}

export function useDeleteTeamShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/team-shifts/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}
