import { useEffect, useRef } from 'react'
import type { BoardEvent } from './types'

/**
 * Subscribes to the backend's Server-Sent Events stream for as long as the
 * component is mounted. EventSource reconnects by itself if the connection drops.
 */
export function useBoardEvents(onEvent: (event: BoardEvent) => void) {
  // Keep the latest callback in a ref so we don't reconnect on every render
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    const source = new EventSource('/api/board/events')

    // The backend sends named events ("event: board"), so onmessage would not fire
    const listener = (e: MessageEvent<string>) => {
      handlerRef.current(JSON.parse(e.data) as BoardEvent)
    }
    source.addEventListener('board', listener)

    return () => {
      source.removeEventListener('board', listener)
      source.close()
    }
  }, [])
}
