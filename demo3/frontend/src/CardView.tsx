import type { Card } from './types'

interface Props {
  card: Card
}

export default function CardView({ card }: Props) {
  // Native HTML5 drag-and-drop: put the card id on the drag payload, the Column reads it on drop
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(card.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className={`card priority-${card.priority.toLowerCase()}`} draggable onDragStart={onDragStart}>
      <div className="card-title">{card.title}</div>
      <div className="card-meta">
        <span className="assignee">{card.assignee ?? 'Unassigned'}</span>
        <span className="priority">{card.priority}</span>
      </div>
    </div>
  )
}
