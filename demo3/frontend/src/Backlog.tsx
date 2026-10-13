import { useEffect, useState } from 'react'
import { fetchBacklog } from './api'
import type { Card, Page } from './types'

const PAGE_SIZE = 10

export default function Backlog() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [data, setData] = useState<Page<Card> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBacklog(page, PAGE_SIZE, filter)
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [page, filter])

  const totalPages = Math.max(data?.totalPages ?? 1, 1)

  return (
    <div className="backlog">
      <div className="backlog-toolbar">
        <input
          placeholder="Filter on title"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setPage(1) // a new filter starts from the first page
          }}
        />
        <span className="total">{data?.totalElements ?? 0} cards</span>
      </div>

      {error && <div className="error">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {data?.content.map((card) => (
            <tr key={card.id}>
              <td>{card.id}</td>
              <td>{card.title}</td>
              <td>{card.assignee ?? '-'}</td>
              <td>{card.priority}</td>
              <td>{card.status}</td>
              <td>{card.createdAt.replace('T', ' ').slice(0, 16)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
