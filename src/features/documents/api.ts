import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Document {
  id: string
  organizationId: string
  propertyId: string | null
  property: { id: string; name: string } | null
  name: string
  category: string
  fileUrl: string
  fileType: string | null
  fileSize: number | null
  expiresAt: string | null
  notes: string | null
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export const DOCUMENT_CATEGORIES = [
  { value: 'lease', label: 'Lease' },
  { value: 'contract', label: 'Contract' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'manual', label: 'Manual' },
  { value: 'license', label: 'License' },
  { value: 'tax', label: 'Tax' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'other', label: 'Other' },
]

const docKeys = {
  all: ['documents'] as const,
  list: (p: Record<string, unknown>) => ['documents', 'list', p] as const,
}

export function useDocuments(params: {
  page?: number
  perPage?: number
  category?: string
  propertyId?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.category) sp.set('category', params.category)
  if (params.propertyId) sp.set('property_id', params.propertyId)

  return useQuery({
    queryKey: docKeys.list(params),
    queryFn: () =>
      api.get<{
        data: Document[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/documents?${sp}`),
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      propertyId?: string
      name: string
      category: string
      fileUrl: string
      fileType?: string
      fileSize?: number
      expiresAt?: string
      notes?: string
    }) => api.post<{ data: Document }>('/documents', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all })
    },
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<{
      propertyId: string | null
      name: string
      category: string
      fileUrl: string
      fileType: string | null
      fileSize: number | null
      expiresAt: string | null
      notes: string | null
    }>) => api.put<{ data: Document }>(`/documents/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all })
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: docKeys.all })
    },
  })
}
