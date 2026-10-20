import type { Booking } from '../api'

const FIRST_HOUR = 7
const LAST_HOUR = 18
const HOUR_HEIGHT = 48 // px
const DAY_NAMES = ['Man', 'Tir', 'Ons', 'Tor', 'Fre']

interface Props {
  weekStart: Date // a Monday at 00:00
  bookings: Booking[]
  onDelete: (id: number) => void
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export function WeekCalendar({ weekStart, bookings, onDelete }: Props) {
  const days = DAY_NAMES.map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)

  return (
    <div className="calendar">
      <div className="hours">
        <div className="day-header" />
        {hours.map((h) => (
          <div key={h} className="hour-label" style={{ height: HOUR_HEIGHT }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {days.map((day, i) => (
        <div key={i} className="day">
          <div className="day-header">
            {DAY_NAMES[i]} {day.getDate()}.{day.getMonth() + 1}
          </div>
          <div className="day-body" style={{ height: hours.length * HOUR_HEIGHT }}>
            {bookings
              .map((b) => ({ ...b, startDate: new Date(b.start), endDate: new Date(b.end) }))
              .filter((b) => sameDay(b.startDate, day))
              .map((b) => {
                // Position the block by minutes since FIRST_HOUR.
                const startMin = b.startDate.getHours() * 60 + b.startDate.getMinutes() - FIRST_HOUR * 60
                const endMin = b.endDate.getHours() * 60 + b.endDate.getMinutes() - FIRST_HOUR * 60
                return (
                  <div
                    key={b.id}
                    className="booking"
                    style={{
                      top: (startMin / 60) * HOUR_HEIGHT,
                      height: ((endMin - startMin) / 60) * HOUR_HEIGHT,
                    }}
                    title={`${b.title} (${b.bookedBy})`}
                  >
                    <div className="booking-time">
                      {formatTime(b.startDate)}–{formatTime(b.endDate)}
                    </div>
                    <div>{b.title}</div>
                    <button className="delete" onClick={() => onDelete(b.id)} aria-label="Slett">
                      ×
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
