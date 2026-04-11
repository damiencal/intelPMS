import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export const TRIGGER_OPTIONS = [
  { value: 'booking_confirmed', label: 'Booking Confirmed' },
  { value: 'check_in_reminder', label: 'Check-in Reminder' },
  { value: 'check_out_reminder', label: 'Check-out Reminder' },
  { value: 'review_request', label: 'Review Request' },
  { value: 'custom', label: 'Custom / Manual' },
] as const

export const CHANNEL_OPTIONS = [
  { value: 'all', label: 'All Channels' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'direct', label: 'Direct' },
] as const

export interface MessageTemplate {
  id: string
  organizationId: string
  name: string
  trigger: string
  subject: string | null
  body: string
  channel: string
  delayMinutes: number
  enabled: boolean
  propertyIds: string[] | null
  createdAt: string
  updatedAt: string
}

export interface CreateTemplatePayload {
  name: string
  trigger: string
  subject?: string
  body: string
  channel?: string
  delayMinutes?: number
  enabled?: boolean
  propertyIds?: string[] | null
}

export interface UpdateTemplatePayload extends Partial<CreateTemplatePayload> {
  id: string
}

// ---- Hooks ----

export function useMessageTemplates() {
  return useQuery({
    queryKey: ['messaging', 'templates'],
    queryFn: () =>
      api.get<{ data: MessageTemplate[] }>('/messaging/templates'),
    select: (res) => res.data,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) =>
      api.post<{ data: MessageTemplate }>('/messaging/templates', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messaging'] }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTemplatePayload) =>
      api.put<{ data: MessageTemplate }>(`/messaging/templates/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messaging'] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/messaging/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messaging'] }),
  })
}

export function useToggleTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.put<{ data: MessageTemplate }>(`/messaging/templates/${id}`, {
        enabled,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messaging'] }),
  })
}
