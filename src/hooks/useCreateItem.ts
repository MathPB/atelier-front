import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/api/client'
import type { Item } from '@/types'

export interface StockEntry {
  sizeId: string
  quantity: number
  available: boolean
}

export interface CreateItemPayload {
  name: string
  description?: string
  color?: string
  price: number
  categoryId: string
  active?: boolean
  stocks: StockEntry[]
  images?: File[]
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateItemPayload) => {
      const item = await apiPost<Item>('/items', {
        name: payload.name,
        ...(payload.description && { description: payload.description }),
        ...(payload.color && { color: payload.color }),
        price: payload.price,
        categoryId: payload.categoryId,
        ...(payload.stocks.length ? { stocks: payload.stocks } : {}),
      })

      for (const file of payload.images ?? []) {
        const base64 = await fileToBase64(file)
        await apiPost(`/items/${item.id}/image`, { image: base64 })
      }

      return item
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
