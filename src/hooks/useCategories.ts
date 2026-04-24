import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import type { Category } from '@/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<Category[]>('/guest/categories'),
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  })
}
