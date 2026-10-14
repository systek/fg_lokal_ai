from pydantic import BaseModel, ConfigDict


class RoomDto(BaseModel):
    # from_attributes lets Pydantic read straight from a SQLAlchemy Room object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    floor: int
    capacity: int
