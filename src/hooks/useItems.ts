import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import type { Item } from '@/types'

export function useItems(categoryId?: string) {
  const params = categoryId ? `?categoryId=${categoryId}` : ''

  return useQuery({
    queryKey: ['items', categoryId],
    queryFn: () => apiGet<Item[]>(`/guest/items${params}`),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => apiGet<Item>(`/guest/items/${id}`),
    enabled: !!id,
  })
}
