import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export interface ConciergeKnowledge {
  id: string
  propertyId: string
  checkInInstructions: string | null
  houseRules: string | null
  localRestaurants: string | null
  localActivities: string | null
  transportation: string | null
  customNotes: string | null
  updatedAt: string
}

export interface ConciergeResponse {
  data: ConciergeKnowledge | null
  property: { id: string; name: string }
}

export interface UpdateConciergePayload {
  checkInInstructions?: string
  houseRules?: string
  localRestaurants?: string
  localActivities?: string
  transportation?: string
  customNotes?: string
}

export function useConciergeKnowledge(propertyId: string | null) {
  return useQuery({
    queryKey: ['concierge', propertyId],
    queryFn: () =>
      api.get<ConciergeResponse>(`/concierge/${propertyId}`),
    enabled: !!propertyId,
  })
}

export function useUpdateConcierge(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateConciergePayload) =>
      api.put<{ data: ConciergeKnowledge }>(`/concierge/${propertyId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge', propertyId] })
      toast.success('Concierge knowledge saved')
    },
    onError: () => {
      toast.error('Failed to save concierge knowledge')
    },
  })
}
