using Microsoft.EntityFrameworkCore;
using Romby.Api.Bookings;
using Romby.Api.Rooms;

namespace Romby.Api.Data;

public class RombyDbContext(DbContextOptions<RombyDbContext> options) : DbContext(options)
{
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Room>(room =>
        {
            room.ToTable("room");
            room.Property(r => r.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Booking>(booking =>
        {
            booking.ToTable("booking");
            booking.Property(b => b.Title).HasMaxLength(200);
            booking.Property(b => b.BookedBy).HasMaxLength(100);
            // "start"/"end" are reserved words in SQL, hence the _time suffix.
            booking.Property(b => b.Start).HasColumnName("start_time");
            booking.Property(b => b.End).HasColumnName("end_time");
            booking.HasOne<Room>().WithMany().HasForeignKey(b => b.RoomId);
        });
    }
}
