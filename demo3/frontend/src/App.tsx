import { useState } from 'react'
import Board from './Board'
import Backlog from './Backlog'

type View = 'board' | 'backlog'

export default function App() {
  const [view, setView] = useState<View>('board')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kanban-lite</h1>
        <nav>
          <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
            Board
          </button>
          <button className={view === 'backlog' ? 'active' : ''} onClick={() => setView('backlog')}>
            Backlog
          </button>
        </nav>
      </header>
      <main>{view === 'board' ? <Board /> : <Backlog />}</main>
    </div>
  )
}
