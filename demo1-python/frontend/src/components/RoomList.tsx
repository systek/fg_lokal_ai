import type { Room } from '../api'

interface Props {
  rooms: Room[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function RoomList({ rooms, selectedId, onSelect }: Props) {
  return (
    <ul className="room-list">
      {rooms.map((room) => (
        <li key={room.id}>
          <button
            className={room.id === selectedId ? 'selected' : ''}
            onClick={() => onSelect(room.id)}
          >
            <strong>{room.name}</strong>
            <span>
              {room.floor}. etg · {room.capacity} pers
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
