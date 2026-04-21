import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/api/client'
import type { Category } from '@/types'

export interface CreateCategoryPayload {
  name: string
  description?: string
  maintenanceDays?: number
  image?: File
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const category = await apiPost<Category>('/categories', {
        name: payload.name,
        ...(payload.description && { description: payload.description }),
        ...(payload.maintenanceDays != null && { maintenanceDays: payload.maintenanceDays }),
      })

      if (payload.image) {
        const base64 = await fileToBase64(payload.image)
        await apiPost(`/categories/${category.id}/image`, { image: base64 })
      }

      return category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
