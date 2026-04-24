import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPut, apiPost, apiDelete } from '@/api/client'
import type { Category } from '@/types'

export interface UpdateCategoryPayload {
  id: string
  name: string
  description?: string
  maintenanceDays?: number
  image?: File | null
  removeImage?: boolean
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateCategoryPayload) => {
      const category = await apiPut<Category>(`/categories/${payload.id}`, {
        name: payload.name,
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.maintenanceDays != null && { maintenanceDays: payload.maintenanceDays }),
      })

      if (payload.removeImage) {
        await apiDelete(`/categories/${payload.id}/image`)
      } else if (payload.image) {
        const base64 = await fileToBase64(payload.image)
        const updated = await apiPost<Category>(`/categories/${payload.id}/image`, { image: base64 })
        return updated
      }

      return category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
