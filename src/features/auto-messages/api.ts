import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AutoMessage {
  id: string
  organizationId: string
  templateId: string
  template: { id: string; name: string; trigger: string } | null
  reservationId: string
  guestName: string | null
  channel: string | null
  triggerEvent: string
  scheduledAt: string
  sentAt: string | null
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  renderedBody: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface AutoMessageStats {
  pending: number
  sent: number
  failed: number
  cancelled: number
}

export const TRIGGER_EVENTS = [
  { value: 'booking_confirmed', label: 'Booking Confirmed' },
  { value: 'check_in_reminder', label: 'Check-in Reminder' },
  { value: 'check_out_reminder', label: 'Check-out Reminder' },
  { value: 'review_request', label: 'Review Request' },
]

const autoMsgKeys = {
  all: ['auto-messages'] as const,
  list: (p: Record<string, unknown>) => ['auto-messages', 'list', p] as const,
  stats: ['auto-messages', 'stats'] as const,
}

export function useAutoMessages(params: {
  page?: number
  perPage?: number
  status?: string
  triggerEvent?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.status) sp.set('status', params.status)
  if (params.triggerEvent) sp.set('trigger_event', params.triggerEvent)

  return useQuery({
    queryKey: autoMsgKeys.list(params),
    queryFn: () =>
      api.get<{
        data: AutoMessage[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/auto-messages?${sp}`),
  })
}

export function useAutoMessageStats() {
  return useQuery({
    queryKey: autoMsgKeys.stats,
    queryFn: () => api.get<{ data: AutoMessageStats }>('/auto-messages/stats'),
    select: (res) => res.data,
  })
}

export function useCreateAutoMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      templateId: string
      reservationId: string
      guestName?: string
      channel?: string
      triggerEvent: string
      scheduledAt: string
      renderedBody?: string
    }) => api.post<{ data: AutoMessage }>('/auto-messages', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: autoMsgKeys.all })
    },
  })
}

export function useUpdateAutoMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string
      status?: string
      sentAt?: string
      errorMessage?: string
    }) => api.put<{ data: AutoMessage }>(`/auto-messages/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: autoMsgKeys.all })
    },
  })
}

export function useDeleteAutoMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auto-messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: autoMsgKeys.all })
    },
  })
}
