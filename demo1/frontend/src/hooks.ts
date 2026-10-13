import { useEffect, useState } from 'react'
import { fetchRooms, type Room } from './api'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Guards against setting state after unmount (and StrictMode's double effect run in dev).
    let cancelled = false
    fetchRooms()
      .then((data) => !cancelled && setRooms(data))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  return { rooms, error }
}
