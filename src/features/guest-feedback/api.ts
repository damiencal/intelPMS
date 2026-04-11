import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface GuestFeedback {
  id: string
  organizationId: string
  propertyId: string
  reservationId: string | null
  guestName: string | null
  guestEmail: string | null
  overallRating: number
  cleanlinessRating: number | null
  communicationRating: number | null
  locationRating: number | null
  valueRating: number | null
  amenitiesRating: number | null
  comments: string | null
  improvements: string | null
  wouldRecommend: boolean | null
  source: string
  status: string
  respondedAt: string | null
  createdAt: string
  updatedAt: string
  property?: { id: string; name: string }
}

export interface FeedbackStats {
  total: number
  avgOverall: number
  avgCleanliness: number
  avgCommunication: number
  avgLocation: number
  avgValue: number
  avgAmenities: number
  recommendRate: number
  pending: number
  reviewed: number
}

export const FEEDBACK_SOURCES = [
  { value: 'internal', label: 'Internal' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'qr_code', label: 'QR Code' },
]

export const FEEDBACK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'received', label: 'Received' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'archived', label: 'Archived' },
]

const feedbackKeys = {
  all: ['guest-feedback'] as const,
  list: (p: Record<string, unknown>) => ['guest-feedback', 'list', p] as const,
  stats: () => ['guest-feedback', 'stats'] as const,
}

export function useGuestFeedback(
  params: {
    page?: number
    perPage?: number
    property_id?: string
    status?: string
    min_rating?: number
  } = {}
) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.property_id) sp.set('property_id', params.property_id)
  if (params.status) sp.set('status', params.status)
  if (params.min_rating) sp.set('min_rating', String(params.min_rating))

  return useQuery({
    queryKey: feedbackKeys.list(params),
    queryFn: () =>
      api.get(`/api/guest-feedback?${sp.toString()}`).then((r) => r.json()),
  })
}

export function useFeedbackStats() {
  return useQuery<{ data: FeedbackStats }>({
    queryKey: feedbackKeys.stats(),
    queryFn: () => api.get('/api/guest-feedback/stats').then((r) => r.json()),
  })
}

export function useCreateFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/guest-feedback', { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })
}

export function useUpdateFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      api.put(`/api/guest-feedback/${id}`, { json: data }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })
}

export function useDeleteFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/guest-feedback/${id}`).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })
}
