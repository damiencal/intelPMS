import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface GuestCheckin {
  id: string
  organizationId: string
  propertyId: string
  property: { id: string; name: string; address?: string | null } | null
  reservationId: string | null
  guestName: string | null
  accessCode: string | null
  wifiName: string | null
  wifiPassword: string | null
  checkInTime: string | null
  checkOutTime: string | null
  instructions: string | null
  houseRules: string | null
  parkingInfo: string | null
  emergencyContact: string | null
  guidebookUrl: string | null
  isActive: boolean
  viewedAt: string | null
  createdAt: string
  updatedAt: string
}

const checkinKeys = {
  all: ['guest-checkins'] as const,
  list: (p: Record<string, unknown>) => ['guest-checkins', 'list', p] as const,
  detail: (id: string) => ['guest-checkins', 'detail', id] as const,
}

export function useGuestCheckins(params: {
  page?: number
  perPage?: number
  propertyId?: string
  active?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.propertyId) sp.set('property_id', params.propertyId)
  if (params.active) sp.set('active', params.active)

  return useQuery({
    queryKey: checkinKeys.list(params),
    queryFn: () =>
      api.get<{
        data: GuestCheckin[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/guest-checkins?${sp}`),
  })
}

export function useGuestCheckin(id: string) {
  return useQuery({
    queryKey: checkinKeys.detail(id),
    queryFn: () => api.get<{ data: GuestCheckin }>(`/guest-checkins/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  })
}

export function useCreateGuestCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<GuestCheckin>) =>
      api.post<{ data: GuestCheckin }>('/guest-checkins', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: checkinKeys.all }) },
  })
}

export function useUpdateGuestCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<GuestCheckin> & { id: string }) =>
      api.put<{ data: GuestCheckin }>(`/guest-checkins/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: checkinKeys.all }) },
  })
}

export function useDeleteGuestCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/guest-checkins/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: checkinKeys.all }) },
  })
}
