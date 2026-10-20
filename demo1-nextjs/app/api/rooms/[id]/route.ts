import type { NextRequest } from 'next/server'
import { ApiError, handleErrors } from '@/server/errors'
import { roomRepository } from '@/server/rooms/roomRepository'

export const GET = handleErrors(async (_request: NextRequest, ctx: RouteContext<'/api/rooms/[id]'>) => {
  const id = Number((await ctx.params).id)
  const room = roomRepository.findById(id)
  if (!room) {
    throw new ApiError(404, `Room ${id} not found`)
  }
  return Response.json(room)
})
