using Microsoft.EntityFrameworkCore;
using Romby.Api.Data;

namespace Romby.Api.Bookings;

// A thin layer over EF Core so the queries for bookings live in one place.
public class BookingRepository(RombyDbContext db)
{
    public Task<List<Booking>> FindAllAsync() =>
        db.Bookings.AsNoTracking().ToListAsync();

    public Task<List<Booking>> FindByRoomIdAsync(long roomId) =>
        db.Bookings.AsNoTracking().Where(b => b.RoomId == roomId).ToListAsync();

    public async Task<Booking> SaveAsync(Booking booking)
    {
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();
        return booking;
    }

    public Task DeleteByIdAsync(long id) =>
        db.Bookings.Where(b => b.Id == id).ExecuteDeleteAsync();
}
