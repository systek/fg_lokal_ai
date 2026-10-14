from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from romby.bookings.schemas import BookingDto
from romby.bookings.service import BookingService

router = APIRouter(prefix="/api/bookings")

# Declare a parameter with this type and FastAPI builds a BookingService for the request.
ServiceDep = Annotated[BookingService, Depends()]


@router.get("")
def list_bookings(service: ServiceDep, room_id: Annotated[int | None, Query(alias="roomId")] = None) -> list[BookingDto]:
    return service.all() if room_id is None else service.for_room(room_id)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(dto: BookingDto, service: ServiceDep) -> BookingDto:
    return service.create(dto)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: int, service: ServiceDep) -> Response:
    service.delete(booking_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
