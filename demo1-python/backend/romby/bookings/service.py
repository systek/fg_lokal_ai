from datetime import timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, status

from romby.bookings.models import Booking, overlaps
from romby.bookings.repository import BookingRepository
from romby.bookings.schemas import BookingDto, to_dto
from romby.db import SessionDep
from romby.rooms.models import Room

MAX_DURATION = timedelta(hours=4)


class BookingService:
    def __init__(self, repository: Annotated[BookingRepository, Depends()], session: SessionDep):
        # FastAPI caches dependencies per request, so the repository gets this same session.
        self.repository = repository
        self.session = session

    def all(self) -> list[BookingDto]:
        return [to_dto(b) for b in self.repository.find_all()]

    def for_room(self, room_id: int) -> list[BookingDto]:
        return [to_dto(b) for b in self.repository.find_by_room_id(room_id)]

    def create(self, dto: BookingDto) -> BookingDto:
        error = self.validate(dto)
        if error is not None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, error)

        room = self.session.get(Room, dto.room_id)
        if room is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Room {dto.room_id} not found")

        has_conflict = any(
            overlaps(existing.start, existing.end, dto.start, dto.end)
            for existing in self.repository.find_by_room_id(room.id)
        )
        if has_conflict:
            raise HTTPException(status.HTTP_409_CONFLICT, "Room is already booked in that period")

        saved = self.repository.save(
            Booking(
                room_id=dto.room_id,
                title=dto.title,
                booked_by=dto.booked_by,
                start=dto.start,
                end=dto.end,
            )
        )
        return to_dto(saved)

    def delete(self, booking_id: int) -> None:
        self.repository.delete_by_id(booking_id)

    def validate(self, dto: BookingDto) -> str | None:
        """Returns an error message, or None if the booking is valid."""
        if dto.title.strip():
            if dto.booked_by.strip():
                if dto.end > dto.start:
                    if dto.end - dto.start <= MAX_DURATION:
                        if dto.start.date() == dto.end.date():
                            return None
                        else:
                            return "A booking must start and end on the same day"
                    else:
                        return f"A booking can be at most {MAX_DURATION.seconds // 3600} hours"
                else:
                    return "End must be after start"
            else:
                return "Booked by is required"
        else:
            return "Title is required"
