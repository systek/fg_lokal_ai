import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { seed } from './seed'

const SCHEMA = `
  CREATE TABLE room (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    floor    INTEGER NOT NULL,
    capacity INTEGER NOT NULL
  );

  CREATE TABLE booking (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id    INTEGER NOT NULL REFERENCES room (id),
    title      TEXT    NOT NULL,
    booked_by  TEXT    NOT NULL,
    -- "start"/"end" are reserved words in SQL, hence the _time suffix.
    -- SQLite has no timestamp type; we store "YYYY-MM-DDTHH:mm:ss" text.
    start_time TEXT    NOT NULL,
    end_time   TEXT    NOT NULL
  );
`

// `next dev` re-runs modules when you edit them. Keeping the database on globalThis
// means it survives those reloads instead of being re-created on every save.
const globalForDb = globalThis as unknown as { rombyDb?: DatabaseSync }

/** Node's built-in SQLite, in memory: no native npm module, no external database, works offline. */
export function db(): DatabaseSync {
  if (!globalForDb.rombyDb) {
    const database = new DatabaseSync(':memory:')
    database.exec(SCHEMA)
    seed(database)
    globalForDb.rombyDb = database
  }
  return globalForDb.rombyDb
}

// node:sqlite returns untyped rows; these helpers do the cast in one place.
export const queryAll = <T>(sql: string, ...params: SQLInputValue[]) =>
  db().prepare(sql).all(...params) as T[]

export const queryOne = <T>(sql: string, ...params: SQLInputValue[]) =>
  db().prepare(sql).get(...params) as T | undefined
