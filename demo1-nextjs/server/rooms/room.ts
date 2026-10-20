/** A row in the room table, also sent as-is by the API. */
export interface Room {
  id: number
  name: string
  floor: number
  capacity: number
}
