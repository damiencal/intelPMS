import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ---- Types ----

export interface PricingRule {
  id: string
  organizationId: string
  name: string
  type: string
  priority: number
  conditions: Record<string, unknown>[]
  action: Record<string, unknown>
  enabled: boolean
  appliesTo: { property_ids?: string[]; listing_ids?: string[]; all?: boolean }
  createdAt: string
  updatedAt: string
}

export interface CreateRulePayload {
  name: string
  type: string
  priority?: number
  conditions: Record<string, unknown>[]
  action: Record<string, unknown>
  enabled?: boolean
  appliesTo: { property_ids?: string[]; listing_ids?: string[]; all?: boolean }
}

export interface UpdateRulePayload extends Partial<CreateRulePayload> {
  id: string
}

interface RulesResponse {
  data: PricingRule[]
}

interface RuleResponse {
  data: PricingRule
}

// ---- Query keys ----

export const pricingKeys = {
  rules: ['pricing', 'rules'] as const,
  rule: (id: string) => ['pricing', 'rules', id] as const,
  proposals: (params: Record<string, unknown>) => ['pricing', 'proposals', params] as const,
  proposalDetail: (id: string) => ['pricing', 'proposals', id] as const,
  strategies: ['pricing', 'strategies'] as const,
}

// ---- Hooks ----

export function usePricingRules() {
  return useQuery({
    queryKey: pricingKeys.rules,
    queryFn: () => api.get<RulesResponse>('/pricing/rules'),
    select: (data) => data.data,
  })
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRulePayload) =>
      api.post<RuleResponse>('/pricing/rules', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.rules })
    },
  })
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateRulePayload) =>
      api.put<RuleResponse>(`/pricing/rules/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.rules })
    },
  })
}

export function useDeletePricingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/pricing/rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.rules })
    },
  })
}

export function useTogglePricingRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.put<RuleResponse>(`/pricing/rules/${id}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.rules })
    },
  })
}

// ---- Proposal Types ----

export interface PricingProposal {
  id: string
  status: string
  dateRangeStart: string
  dateRangeEnd: string
  totalChanges: number
  totalListingsAffected: number
  avgPriceChangePct: number
  estimatedRevenueImpact: number | null
  reviewNotes: string | null
  createdBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  appliedBy: string | null
  appliedAt: string | null
  createdAt: string
  _count?: { changes: number }
}

export interface ProposalChange {
  id: string
  listingId: string
  date: string
  currentPrice: number
  recommendedPrice: number
  changeAmount: number
  changePct: number
  rulesApplied: string[]
  included: boolean
  applyStatus: string | null
  applyError: string | null
  listing: {
    id: string
    channel: string
    channelName: string
    property: { id: string; name: string }
  }
}

export interface ProposalDetail extends PricingProposal {
  changes: ProposalChange[]
}

interface ProposalsResponse {
  data: PricingProposal[]
  meta: { total: number; page: number; perPage: number; totalPages: number }
}

interface ProposalDetailResponse {
  data: ProposalDetail
}

// ---- Seasonal Strategy Types ----

export interface SeasonalStrategy {
  id: string
  name: string
  propertyIds: string[]
  seasons: unknown
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface SeasonalStrategiesResponse {
  data: SeasonalStrategy[]
}

// ---- Proposal Hooks ----

export function usePricingProposals(params: { page?: number; perPage?: number; status?: string } = {}) {
  const { page = 1, perPage = 20, status } = params
  const searchParams = new URLSearchParams({ page: String(page), per_page: String(perPage) })
  if (status) searchParams.set('status', status)

  return useQuery({
    queryKey: pricingKeys.proposals(params),
    queryFn: () => api.get<ProposalsResponse>(`/pricing/proposals?${searchParams}`),
  })
}

export function useProposalDetail(id: string) {
  return useQuery({
    queryKey: pricingKeys.proposalDetail(id),
    queryFn: () => api.get<ProposalDetailResponse>(`/pricing/proposals/${id}`),
    select: (data) => data.data,
    enabled: !!id,
  })
}

export function useApproveProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes?: string }) =>
      api.post(`/pricing/proposals/${id}/approve`, { reviewNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', 'proposals'] })
    },
  })
}

export function useRejectProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes?: string }) =>
      api.post(`/pricing/proposals/${id}/reject`, { reviewNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', 'proposals'] })
    },
  })
}

export function useApplyProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/pricing/proposals/${id}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', 'proposals'] })
    },
  })
}

// ---- Seasonal Strategy Hooks ----

export function useSeasonalStrategies() {
  return useQuery({
    queryKey: pricingKeys.strategies,
    queryFn: () => api.get<SeasonalStrategiesResponse>('/pricing/seasonal-strategies'),
    select: (data) => data.data,
  })
}

export function useCreateSeasonalStrategy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; propertyIds: string[]; seasons: unknown; notes?: string }) =>
      api.post('/pricing/seasonal-strategies', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.strategies })
    },
  })
}
