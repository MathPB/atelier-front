import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client'
import type { ItemStock } from '@/types'

export function useItemStocks(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item-stocks', itemId],
    queryFn: () => apiGet<ItemStock[]>(`/items/${itemId}/stocks`),
    enabled: !!itemId,
  })
}

export function useAddItemStock(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { sizeId: string; quantity: number; available: boolean }) =>
      apiPost<ItemStock>(`/items/${itemId}/stocks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-stocks', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateItemStock(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stockId, ...data }: { stockId: string; sizeId: string; quantity: number; available: boolean }) =>
      apiPut<ItemStock>(`/items/${itemId}/stocks/${stockId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-stocks', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useDeleteItemStock(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stockId: string) => apiDelete(`/items/${itemId}/stocks/${stockId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-stocks', itemId] })
      queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
