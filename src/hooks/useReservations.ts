import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/api/client'
import type { Reservation, CreateReservationPayload } from '@/types'

export function useReservations(enabled = true) {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: () => apiGet<Reservation[]>('/reservations'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled,
  })
}

export function useItemAvailability(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item-availability', itemId],
    queryFn: () => apiGet<Reservation[]>(`/items/${itemId}/availability`),
    enabled: !!itemId,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReservationPayload) =>
      apiPost<Reservation>('/reservations', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['item-availability', variables.itemId] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useCreateGuestReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReservationPayload) =>
      apiPost<Reservation>('/guest/reservations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: string) =>
      apiPost(`/reservations/${reservationId}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['item-availability'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useCompleteReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: string) =>
      apiPost(`/reservations/${reservationId}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['item-availability'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useApproveReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: string) =>
      apiPost(`/reservations/${reservationId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['item-availability'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useRejectReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reservationId: string) =>
      apiPost(`/reservations/${reservationId}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['item-availability'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
