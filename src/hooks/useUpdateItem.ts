import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPut, apiPost } from '@/api/client'
import type { Item } from '@/types'

export interface UpdateItemPayload {
  id: string
  name: string
  description?: string
  color?: string
  price: number
  categoryId: string
  active: boolean
  newImages?: File[]
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, newImages, ...data }: UpdateItemPayload) => {
      const item = await apiPut<Item>(`/items/${id}`, {
        name: data.name,
        ...(data.description && { description: data.description }),
        ...(data.color && { color: data.color }),
        price: data.price,
        categoryId: data.categoryId,
        active: data.active,
      })

      for (const file of newImages ?? []) {
        const base64 = await fileToBase64(file)
        await apiPost(`/items/${id}/image`, { image: base64 })
      }

      return item
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', vars.id] })
    },
  })
}
