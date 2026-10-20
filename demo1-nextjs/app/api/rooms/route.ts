import { handleErrors } from '@/server/errors'
import { roomRepository } from '@/server/rooms/roomRepository'

export const GET = handleErrors(async () => Response.json(roomRepository.findAll()))
