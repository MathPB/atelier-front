import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client'
import type { ItemSize } from '@/types'

export function useCategorySizes(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['category-sizes', categoryId],
    queryFn: () => apiGet<ItemSize[]>(`/categories/${categoryId}/sizes`),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddCategorySize(categoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (size: string) =>
      apiPost<ItemSize>(`/categories/${categoryId}/sizes`, { size }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-sizes', categoryId] })
    },
  })
}

export function useUpdateCategorySize(categoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sizeId, size }: { sizeId: string; size: string }) =>
      apiPut<ItemSize>(`/categories/${categoryId}/sizes/${sizeId}`, { size }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-sizes', categoryId] })
    },
  })
}

export function useDeleteCategorySize(categoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sizeId: string) =>
      apiDelete(`/categories/${categoryId}/sizes/${sizeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-sizes', categoryId] })
    },
  })
}
