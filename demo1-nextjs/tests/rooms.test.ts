import { expect, test } from 'vitest'
import { GET } from '@/app/api/rooms/route'

// The one sample test. Use it as a pattern and let your local model generate the rest.
// Route handlers are plain functions from Request to Response, so we can call them directly.
test('lists the seeded rooms', async () => {
  const response = await GET()

  expect(response.status).toBe(200)
  const rooms = await response.json()
  expect(rooms).toHaveLength(4)
  expect(rooms[0].name).toBe('Fjorden')
})
