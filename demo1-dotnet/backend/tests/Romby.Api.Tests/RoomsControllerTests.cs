using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Romby.Api.Tests;

// The one sample test. Use it as a pattern and let your local model generate the rest.
public class RoomsControllerTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Lists_the_seeded_rooms()
    {
        var response = await _client.GetAsync("/api/rooms");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rooms = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal(4, rooms.GetArrayLength());
        Assert.Equal("Fjorden", rooms[0].GetProperty("name").GetString());
    }
}
