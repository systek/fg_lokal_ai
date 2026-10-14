from collections.abc import Sequence

from sqlalchemy import delete, select

from romby.bookings.models import Booking
from romby.db import SessionDep


class BookingRepository:
    """Keeps the queries for bookings in one place."""

    # FastAPI fills in the session when a request needs a BookingRepository.
    def __init__(self, session: SessionDep):
        self.session = session

    def find_all(self) -> Sequence[Booking]:
        return self.session.scalars(select(Booking)).all()

    def find_by_room_id(self, room_id: int) -> Sequence[Booking]:
        return self.session.scalars(select(Booking).where(Booking.room_id == room_id)).all()

    def save(self, booking: Booking) -> Booking:
        self.session.add(booking)
        self.session.commit()
        self.session.refresh(booking)  # loads the generated id
        return booking

    def delete_by_id(self, booking_id: int) -> None:
        self.session.execute(delete(Booking).where(Booking.id == booking_id))
        self.session.commit()
