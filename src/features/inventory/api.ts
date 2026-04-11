import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InventoryItem {
  id: string
  organizationId: string
  propertyId: string | null
  property: { id: string; name: string } | null
  name: string
  category: string
  quantity: number
  minQuantity: number
  unit: string | null
  costPerUnit: number | null
  currency: string
  supplier: string | null
  location: string | null
  lastRestocked: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface InventoryStats {
  totalItems: number
  lowStockCount: number
  totalValue: number
  byCategory: { category: string; count: number }[]
}

export const INVENTORY_CATEGORIES = [
  { value: 'linens', label: 'Linens' },
  { value: 'toiletries', label: 'Toiletries' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'cleaning_supplies', label: 'Cleaning Supplies' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'safety', label: 'Safety' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'other', label: 'Other' },
]

const invKeys = {
  all: ['inventory'] as const,
  list: (p: Record<string, unknown>) => ['inventory', 'list', p] as const,
  stats: ['inventory', 'stats'] as const,
}

export function useInventory(params: {
  page?: number
  perPage?: number
  category?: string
  propertyId?: string
  lowStock?: string
} = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('per_page', String(params.perPage))
  if (params.category) sp.set('category', params.category)
  if (params.propertyId) sp.set('property_id', params.propertyId)
  if (params.lowStock) sp.set('low_stock', params.lowStock)

  return useQuery({
    queryKey: invKeys.list(params),
    queryFn: () =>
      api.get<{
        data: InventoryItem[]
        meta: { total: number; page: number; perPage: number; totalPages: number }
      }>(`/inventory?${sp}`),
  })
}

export function useInventoryStats() {
  return useQuery({
    queryKey: invKeys.stats,
    queryFn: () => api.get<{ data: InventoryStats }>('/inventory/stats'),
    select: (res) => res.data,
  })
}

export function useCreateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) =>
      api.post<{ data: InventoryItem }>('/inventory', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: invKeys.all }) },
  })
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryItem> & { id: string }) =>
      api.put<{ data: InventoryItem }>(`/inventory/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: invKeys.all }) },
  })
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: invKeys.all }) },
  })
}
