import { useEffect, useState } from 'react'
import { fetchCards, moveCard } from './api'
import Column from './Column'
import NewCardForm from './NewCardForm'
import { useBoardEvents } from './useBoardEvents'
import { STATUSES, type BoardEvent, type Card, type CardStatus } from './types'

export default function Board() {
  const [cards, setCards] = useState<Card[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCards().then(setCards).catch((err) => setError(err.message))
  }, [])

  // Changes from any tab (including this one) arrive here. Upserting by id makes
  // it harmless to receive the same change both from our own request and from SSE.
  useBoardEvents((event: BoardEvent) => {
    setCards((current) => {
      const others = current.filter((c) => c.id !== event.card.id)
      return event.type === 'DELETED' ? others : [...others, event.card]
    })
  })

  const onDropCard = (cardId: number, status: CardStatus) => {
    moveCard(cardId, status).catch((err) => setError(err.message))
  }

  const byStatus = (status: CardStatus) =>
    cards.filter((c) => c.status === status).sort((a, b) => a.id - b.id)

  return (
    <>
      {error && <div className="error">{error}</div>}
      <div className="board">
        {STATUSES.map((status) => (
          <Column key={status} status={status} cards={byStatus(status)} onDropCard={onDropCard}>
            {status === 'TODO' && <NewCardForm />}
          </Column>
        ))}
      </div>
    </>
  )
}
