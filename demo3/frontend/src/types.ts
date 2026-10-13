// Mirrors the Kotlin DTOs in backend/.../card/CardDto.kt and events/BoardEvent.kt

export type CardStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export const STATUSES: CardStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

export interface Card {
  id: number
  title: string
  assignee: string | null
  priority: Priority
  status: CardStatus
  createdAt: string // ISO-8601 local date-time, e.g. "2026-09-01T09:00:00"
}

export interface NewCard {
  title: string
  assignee?: string
  priority?: Priority
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type BoardEventType = 'CREATED' | 'MOVED' | 'UPDATED' | 'DELETED'

export interface BoardEvent {
  type: BoardEventType
  card: Card
}
