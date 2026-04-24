import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Item } from '@/types'

export interface CartItem extends Item {
  quantity: number
  cartItemId: string
  selectedSizeId?: string
  selectedSizeName?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: Item, sizeId?: string, sizeName?: string) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  hasItem: (itemId: string, sizeId?: string) => boolean
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, sizeId, sizeName) =>
        set((state) => {
          const cartItemId = sizeId ? `${item.id}-${sizeId}` : item.id
          if (state.items.some((i) => i.cartItemId === cartItemId)) return state
          return {
            items: [...state.items, {
              ...item,
              quantity: 1,
              cartItemId,
              selectedSizeId: sizeId,
              selectedSizeName: sizeName,
            }],
          }
        }),

      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        })),

      updateQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      hasItem: (itemId, sizeId) => {
        const cartItemId = sizeId ? `${itemId}-${sizeId}` : itemId
        return get().items.some((i) => i.cartItemId === cartItemId)
      },

      clear: () => set({ items: [] }),
    }),
    { name: 'bete-cart' }
  )
)
