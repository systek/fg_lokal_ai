from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from romby.db import Base


class Room(Base):
    __tablename__ = "room"

    # None until saved; the database generates the id.
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    floor: Mapped[int]
    capacity: Mapped[int]
