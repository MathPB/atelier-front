import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiDelete } from '@/api/client'

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => apiDelete(`/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
