import type { NextRequest } from 'next/server'
import { parseBookingDto } from '@/server/bookings/bookingDto'
import { bookingService } from '@/server/bookings/bookingService'
import { handleErrors } from '@/server/errors'

export const GET = handleErrors(async (request: NextRequest) => {
  const roomId = request.nextUrl.searchParams.get('roomId')
  return Response.json(roomId == null ? bookingService.all() : bookingService.forRoom(Number(roomId)))
})

export const POST = handleErrors(async (request: NextRequest) => {
  const dto = parseBookingDto(await request.json())
  return Response.json(bookingService.create(dto), { status: 201 })
})
