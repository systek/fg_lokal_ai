import { queryAll, queryOne } from '../db'
import type { Room } from './room'

export const roomRepository = {
  findAll: () => queryAll<Room>('SELECT * FROM room ORDER BY id'),

  findById: (id: number) => queryOne<Room>('SELECT * FROM room WHERE id = ?', id),
}
