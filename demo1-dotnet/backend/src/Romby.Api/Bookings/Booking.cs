namespace Romby.Api.Bookings;

public class Booking
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public required string Title { get; set; }
    public required string BookedBy { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    /// <summary>
    /// True if the half-open intervals [aStart, aEnd) and [bStart, bEnd) share any time.
    /// Half-open means back-to-back meetings (one ends 10:00, next starts 10:00) do not overlap.
    /// </summary>
    public static bool Overlaps(DateTime aStart, DateTime aEnd, DateTime bStart, DateTime bEnd) =>
        aStart < bEnd && bStart < aEnd;
}
