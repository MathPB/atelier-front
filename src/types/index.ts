export interface Category {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  maintenanceDays: number | null
  createdAt: string
  updatedAt: string
  _count?: {
    items: number
  }
}

export interface ItemImage {
  id: string
  itemId: string
  url: string
  key: string
  order: number
  createdAt: string
}

/** Tamanho do catálogo de uma categoria */
export interface ItemSize {
  id: string
  categoryId: string
  size: string
  createdAt: string
  updatedAt: string
}

/** Estoque de um tamanho específico para um item */
export interface ItemStock {
  id: string
  itemId: string
  sizeId: string
  quantity: number
  available: boolean
  createdAt: string
  updatedAt: string
  size: ItemSize
}

export interface ItemReservation {
  id: string
  status: string
  startDate: string
  endDate: string
}

export interface Item {
  id: string
  name: string
  description: string | null
  color: string | null
  price: number
  categoryId: string
  active: boolean
  createdAt: string
  updatedAt: string
  category?: Category
  images: ItemImage[]
  stocks: ItemStock[]
  reservations?: ItemReservation[]
}

export interface OrderItem {
  id: string
  orderId: string
  itemId: string
  item: Item
}

export interface Order {
  id: string
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export interface CreateOrderPayload {
  clientName: string
  clientPhone?: string
  clientEmail?: string
  notes?: string
  itemIds: string[]
}

export interface Reservation {
  id: string
  itemId: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  eventDay?: string
  startDate: string
  endDate: string
  notes?: string
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING_APPROVAL'
  createdAt: string
  updatedAt: string
  item?: Item
  items?: ReservationItem[]
}

export interface ReservationItem {
  id: string
  reservationId: string
  itemId: string
  item?: Item
}

export interface CreateReservationPayload {
  itemId?: string
  itemIds?: string[]
  clientName: string
  clientPhone: string
  clientEmail?: string
  eventDay?: string
  startDate: string
  endDate: string
  notes?: string
}
