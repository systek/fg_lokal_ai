import type { Card, CardStatus, NewCard, Page } from './types'

// Relative URLs: in dev, Vite proxies /api to the Spring Boot backend (see vite.config.ts)
const BASE = '/api/cards'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function fetchCards(): Promise<Card[]> {
  return request<Card[]>(BASE)
}

export function fetchBacklog(page: number, size: number, filter = ''): Promise<Page<Card>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filter) params.set('q', filter)
  return request<Page<Card>>(`${BASE}/backlog?${params}`)
}

export function createCard(card: NewCard): Promise<Card> {
  return request<Card>(BASE, { method: 'POST', body: JSON.stringify(card) })
}

export function moveCard(id: number, status: CardStatus): Promise<Card> {
  return request<Card>(`${BASE}/${id}/move`, { method: 'PATCH', body: JSON.stringify({ status }) })
}
