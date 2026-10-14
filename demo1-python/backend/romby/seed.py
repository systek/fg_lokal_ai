from datetime import date, datetime, time, timedelta

from romby.bookings.models import Booking
from romby.db import Base, SessionLocal, engine
from romby.rooms.models import Room


def seed_database() -> None:
    """Rebuilds the schema and seed data, so every start begins with fresh data."""
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    # Seed bookings relative to Monday of the current week, so the calendar is never empty.
    # weekday() is 0 for Monday.
    today = date.today()
    monday = datetime.combine(today - timedelta(days=today.weekday()), time())

    def at(room_id: int, title: str, booked_by: str, day: int, from_hour: int, to_hour: int) -> Booking:
        return Booking(
            room_id=room_id,
            title=title,
            booked_by=booked_by,
            start=monday + timedelta(days=day, hours=from_hour),
            end=monday + timedelta(days=day, hours=to_hour),
        )

    with SessionLocal() as session:
        session.add_all([
            Room(name="Fjorden", floor=2, capacity=8),
            Room(name="Vidda", floor=2, capacity=4),
            Room(name="Skogen", floor=3, capacity=12),
            Room(name="Telefonboksen", floor=3, capacity=1),
        ])
        session.flush()  # assigns room ids before the bookings refer to them

        session.add_all([
            at(1, "Sprint planning", "Kari", day=0, from_hour=9, to_hour=10),
            at(1, "Arkitekturmøte", "Ola", day=1, from_hour=13, to_hour=15),
            at(2, "1:1 Kari/Per", "Per", day=2, from_hour=10, to_hour=11),
            at(3, "Demo for kunde", "Lise", day=3, from_hour=9, to_hour=12),
            at(3, "Fredagslunsj", "Ola", day=4, from_hour=11, to_hour=12),
        ])
        session.commit()
