import client from './client'

export interface ReservationInput {
  course_id: number
  staff_user_id?: number | null
  date: string
  start_time: string
  guest_name: string
  guest_email: string
  guest_phone?: string
  note?: string
}

export interface Reservation {
  id: number
  shop_id: number
  course_id: number
  staff_user_id: number | null
  date: string
  start_time: string
  end_time: string
  guest_name: string
  guest_email: string
  status: string
  shop?: { name: string }
  course?: { name: string; duration: number; price: number }
  staff_user?: { name: string } | null
}

export const reservationApi = {
  create: (shopId: number, data: ReservationInput) =>
    client.post<Reservation>(`/shops/${shopId}/reservations`, data),

  myList: () =>
    client.get<Reservation[]>('/my/reservations'),
}
