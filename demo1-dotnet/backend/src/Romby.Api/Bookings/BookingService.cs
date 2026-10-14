using Microsoft.EntityFrameworkCore;
using Romby.Api.Data;

namespace Romby.Api.Bookings;

public class BookingService(BookingRepository bookingRepository, RombyDbContext db)
{
    public static readonly TimeSpan MaxDuration = TimeSpan.FromHours(4);

    public async Task<List<BookingDto>> AllAsync() =>
        (await bookingRepository.FindAllAsync()).Select(b => b.ToDto()).ToList();

    public async Task<List<BookingDto>> ForRoomAsync(long roomId) =>
        (await bookingRepository.FindByRoomIdAsync(roomId)).Select(b => b.ToDto()).ToList();

    public async Task<BookingDto> CreateAsync(BookingDto dto)
    {
        var error = Validate(dto);
        if (error != null)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, error);
        }

        // Each await hands the thread back to ASP.NET while the database works.
        var room = await db.Rooms.FindAsync(dto.RoomId)
            ?? throw new ApiException(StatusCodes.Status404NotFound, $"Room {dto.RoomId} not found");

        var hasConflict = (await bookingRepository.FindByRoomIdAsync(room.Id))
            .Any(existing => Booking.Overlaps(existing.Start, existing.End, dto.Start, dto.End));
        if (hasConflict)
        {
            throw new ApiException(StatusCodes.Status409Conflict, "Room is already booked in that period");
        }

        var saved = await bookingRepository.SaveAsync(new Booking
        {
            RoomId = dto.RoomId,
            Title = dto.Title,
            BookedBy = dto.BookedBy,
            Start = dto.Start,
            End = dto.End,
        });
        return saved.ToDto();
    }

    public Task DeleteAsync(long id) => bookingRepository.DeleteByIdAsync(id);

    /// <summary>Returns an error message, or null if the booking is valid.</summary>
    public string? Validate(BookingDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.Title))
        {
            if (!string.IsNullOrWhiteSpace(dto.BookedBy))
            {
                if (dto.End > dto.Start)
                {
                    if (dto.End - dto.Start <= MaxDuration)
                    {
                        if (dto.Start.Date == dto.End.Date)
                        {
                            return null;
                        }
                        else
                        {
                            return "A booking must start and end on the same day";
                        }
                    }
                    else
                    {
                        return $"A booking can be at most {MaxDuration.TotalHours} hours";
                    }
                }
                else
                {
                    return "End must be after start";
                }
            }
            else
            {
                return "Booked by is required";
            }
        }
        else
        {
            return "Title is required";
        }
    }
}
