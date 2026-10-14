namespace Romby.Api.Rooms;

public class Room
{
    // 0 until saved; the database generates the id.
    public long Id { get; set; }
    public required string Name { get; set; }
    public int Floor { get; set; }
    public int Capacity { get; set; }
}
