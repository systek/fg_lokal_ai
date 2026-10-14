using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Romby.Api.Data;

namespace Romby.Api.Rooms;

[ApiController]
[Route("api/rooms")]
public class RoomsController(RombyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<List<Room>> All() => await db.Rooms.AsNoTracking().OrderBy(r => r.Id).ToListAsync();

    [HttpGet("{id:long}")]
    public async Task<Room> ById(long id) =>
        await db.Rooms.AsNoTracking().SingleOrDefaultAsync(r => r.Id == id)
        ?? throw new ApiException(StatusCodes.Status404NotFound, $"Room {id} not found");
}
