using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Romby.Api;
using Romby.Api.Bookings;
using Romby.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// A named, shared-cache in-memory SQLite database: no Docker, no external DB, works offline.
// The database lives only as long as at least one connection is open, so we keep one open
// for the lifetime of the app. Each DbContext still opens its own connection per request.
var connectionString = builder.Configuration.GetConnectionString("Romby")!;
var keepAlive = new SqliteConnection(connectionString);
keepAlive.Open();
builder.Services.AddSingleton(keepAlive);

builder.Services.AddDbContext<RombyDbContext>(options => options.UseSqlite(connectionString));
builder.Services.AddScoped<BookingRepository>();
builder.Services.AddScoped<BookingService>();

builder.Services.AddControllers();
// Turns ApiException into { status, message } so the frontend can show the reason.
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.MapControllers();

// Schema and seed data are rebuilt on every start, so you always begin with fresh data.
using (var scope = app.Services.CreateScope())
{
    SeedData.Initialize(scope.ServiceProvider.GetRequiredService<RombyDbContext>());
}

app.Run();

// Makes the generated Program class visible to WebApplicationFactory in the test project.
public partial class Program;
