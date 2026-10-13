import { useState } from 'react'
import CardView from './CardView'
import type { Card, CardStatus } from './types'

const TITLES: Record<CardStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

interface Props {
  status: CardStatus
  cards: Card[]
  onDropCard: (cardId: number, status: CardStatus) => void
  children?: React.ReactNode
}

export default function Column({ status, cards, onDropCard, children }: Props) {
  const [isOver, setIsOver] = useState(false)

  return (
    <section
      className={`column ${isOver ? 'drop-target' : ''}`}
      // preventDefault on dragover is what tells the browser "dropping here is allowed"
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const id = Number(e.dataTransfer.getData('text/plain'))
        if (id) onDropCard(id, status)
      }}
    >
      <h2>
        {TITLES[status]} <span className="count">{cards.length}</span>
      </h2>
      {children}
      {cards.map((card) => (
        <CardView key={card.id} card={card} />
      ))}
    </section>
  )
}
