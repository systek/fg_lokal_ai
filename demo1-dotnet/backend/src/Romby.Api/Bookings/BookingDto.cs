namespace Romby.Api.Bookings;

/// <summary>What the API sends and receives. Kept separate from the entity so the DB shape can change freely.</summary>
public record BookingDto(
    long? Id,
    long RoomId,
    string Title,
    string BookedBy,
    DateTime Start,
    DateTime End);

public static class BookingMappings
{
    public static BookingDto ToDto(this Booking booking) => new(
        Id: booking.Id,
        RoomId: booking.RoomId,
        Title: booking.Title,
        BookedBy: booking.BookedBy,
        Start: booking.Start,
        End: booking.End);
}
