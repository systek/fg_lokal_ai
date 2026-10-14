using Romby.Api.Bookings;
using Romby.Api.Rooms;

namespace Romby.Api.Data;

public static class SeedData
{
    public static void Initialize(RombyDbContext db)
    {
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        db.Rooms.AddRange(
            new Room { Name = "Fjorden", Floor = 2, Capacity = 8 },
            new Room { Name = "Vidda", Floor = 2, Capacity = 4 },
            new Room { Name = "Skogen", Floor = 3, Capacity = 12 },
            new Room { Name = "Telefonboksen", Floor = 3, Capacity = 1 });
        db.SaveChanges();

        // Seed bookings relative to Monday of the current week, so the calendar is never empty.
        // DayOfWeek has Sunday = 0, so shift it to make Monday the first day of the week.
        var today = DateTime.Today;
        var monday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));

        Booking At(long roomId, string title, string bookedBy, int day, int fromHour, int toHour) => new()
        {
            RoomId = roomId,
            Title = title,
            BookedBy = bookedBy,
            Start = monday.AddDays(day).AddHours(fromHour),
            End = monday.AddDays(day).AddHours(toHour),
        };

        db.Bookings.AddRange(
            At(1, "Sprint planning", "Kari", day: 0, fromHour: 9, toHour: 10),
            At(1, "Arkitekturmøte", "Ola", day: 1, fromHour: 13, toHour: 15),
            At(2, "1:1 Kari/Per", "Per", day: 2, fromHour: 10, toHour: 11),
            At(3, "Demo for kunde", "Lise", day: 3, fromHour: 9, toHour: 12),
            At(3, "Fredagslunsj", "Ola", day: 4, fromHour: 11, toHour: 12));
        db.SaveChanges();
    }
}
