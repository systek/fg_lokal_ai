from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel

from romby.bookings.models import Booking


class BookingDto(BaseModel):
    """What the API sends and receives. Kept separate from the entity so the DB shape can change freely."""

    # snake_case in Python, camelCase in JSON (room_id <-> "roomId").
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: int | None = None
    room_id: int
    title: str
    booked_by: str
    start: datetime
    end: datetime

    @field_validator("start", "end")
    @classmethod
    def drop_timezone(cls, value: datetime) -> datetime:
        # The database hands back naive datetimes, and Python refuses to compare naive with
        # aware ones ("can't compare offset-naive and offset-aware datetimes"), so store naive.
        return value.replace(tzinfo=None)


def to_dto(booking: Booking) -> BookingDto:
    return BookingDto(
        id=booking.id,
        room_id=booking.room_id,
        title=booking.title,
        booked_by=booking.booked_by,
        start=booking.start,
        end=booking.end,
    )
