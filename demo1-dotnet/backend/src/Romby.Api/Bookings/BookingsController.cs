using Microsoft.AspNetCore.Mvc;

namespace Romby.Api.Bookings;

[ApiController]
[Route("api/bookings")]
public class BookingsController(BookingService bookingService) : ControllerBase
{
    [HttpGet]
    public Task<List<BookingDto>> List([FromQuery] long? roomId) =>
        roomId == null ? bookingService.AllAsync() : bookingService.ForRoomAsync(roomId.Value);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BookingDto dto)
    {
        var created = await bookingService.CreateAsync(dto);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        await bookingService.DeleteAsync(id);
        return NoContent();
    }
}
