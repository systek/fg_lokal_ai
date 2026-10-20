import type { NextRequest } from 'next/server'
import { bookingService } from '@/server/bookings/bookingService'
import { handleErrors } from '@/server/errors'

export const DELETE = handleErrors(async (_request: NextRequest, ctx: RouteContext<'/api/bookings/[id]'>) => {
  bookingService.delete(Number((await ctx.params).id))
  return new Response(null, { status: 204 })
})
