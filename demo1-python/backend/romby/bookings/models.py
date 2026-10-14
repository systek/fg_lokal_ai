from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from romby.db import Base


class Booking(Base):
    __tablename__ = "booking"

    id: Mapped[int] = mapped_column(primary_key=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("room.id"))
    title: Mapped[str] = mapped_column(String(200))
    booked_by: Mapped[str] = mapped_column(String(100))
    # "start"/"end" are reserved words in SQL, hence the _time suffix on the columns.
    start: Mapped[datetime] = mapped_column("start_time")
    end: Mapped[datetime] = mapped_column("end_time")


def overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    """True if the half-open intervals [a_start, a_end) and [b_start, b_end) share any time.

    Half-open means back-to-back meetings (one ends 10:00, next starts 10:00) do not overlap.
    """
    return a_start < b_end and b_start < a_end
