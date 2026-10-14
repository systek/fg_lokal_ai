from collections.abc import Sequence

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from romby.db import SessionDep
from romby.rooms.models import Room
from romby.rooms.schemas import RoomDto

router = APIRouter(prefix="/api/rooms")


@router.get("")
def all_rooms(session: SessionDep) -> list[RoomDto]:
    rooms: Sequence[Room] = session.scalars(select(Room).order_by(Room.id)).all()
    return [RoomDto.model_validate(room) for room in rooms]


@router.get("/{room_id}")
def room_by_id(room_id: int, session: SessionDep) -> RoomDto:
    room = session.get(Room, room_id)
    if room is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Room {room_id} not found")
    return RoomDto.model_validate(room)
