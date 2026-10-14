export interface Room {
  id: number
  name: string
  floor: number
  capacity: number
}

export interface Booking {
  id: number
  roomId: number
  title: string
  bookedBy: string
  start: string // e.g. "2026-10-13T09:00:00"
  end: string
}

export type NewBooking = Omit<Booking, 'id'>

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    // Spring puts the ResponseStatusException reason in "message".
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? `${response.status} ${response.statusText}`)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export const fetchRooms = () => request<Room[]>('/api/rooms')

export const fetchBookings = (roomId?: number) =>
  request<Booking[]>(roomId ? `/api/bookings?roomId=${roomId}` : '/api/bookings')

export const createBooking = (booking: NewBooking) =>
  request<Booking>('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  })

export const deleteBooking = (id: number) =>
  request<void>(`/api/bookings/${id}`, { method: 'DELETE' })
