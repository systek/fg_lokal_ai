# Romby (.NET): meeting-room booking

The .NET version of [`demo1`](../demo1). Same app, same React frontend, same exercises and same hidden bug. Only the backend is rewritten, in C# with ASP.NET Core. Use it for participants who work in .NET rather than Kotlin/Spring.

Romby lists meeting rooms and shows a weekly calendar for the selected room. You can add bookings and delete them. A room cannot be double-booked.

| Part     | Stack                                                                                       |
|----------|---------------------------------------------------------------------------------------------|
| Backend  | C# 14, .NET 10 (LTS), ASP.NET Core controllers, EF Core 10 with SQLite in-memory, xUnit      |
| Frontend | React 19, TypeScript 7, Vite 8 (dev server proxies `/api` to `localhost:8080`). Identical to `demo1` |

There is no Docker, no external database and no cloud API. The database is rebuilt in `Data/SeedData.cs` on every start, and the seed bookings always land in the current week.

```
backend/
  Romby.slnx, global.json
  src/Romby.Api/
    Program.cs                 wiring, keeps the in-memory DB alive, runs the seed
    ApiException.cs            ApiException + handler that returns { status, message }
    Data/      RombyDbContext, SeedData
    Rooms/     Room, RoomsController
    Bookings/  Booking (+ Overlaps()), BookingDto, BookingRepository, BookingService, BookingsController
  tests/Romby.Api.Tests/
    RoomsControllerTests.cs    the only test, on purpose
frontend/
  src/api.ts, hooks.ts, App.tsx
  src/components/  RoomList, WeekCalendar, BookingForm
```

### How it maps to the Kotlin version

| Spring Boot (`demo1`)                        | ASP.NET Core (`demo1-dotnet`)                         |
|----------------------------------------------|-------------------------------------------------------|
| `@RestController` + `@GetMapping`            | `[ApiController]` + `[HttpGet]`                       |
| `Mono<T>` / `Flux<T>` (Reactor)              | `Task<T>` / `Task<List<T>>` (async/await)             |
| R2DBC repository with derived queries        | `BookingRepository` wrapping EF Core LINQ queries     |
| `ResponseStatusException`                    | `ApiException` + `ApiExceptionHandler`                |
| H2 in-memory + `schema.sql` / `data.sql`     | SQLite in-memory + `EnsureCreated()` + `SeedData`     |
| `LocalDateTime` + Jackson                    | `DateTime` + System.Text.Json                         |
| `WebTestClient`                              | `WebApplicationFactory` + `HttpClient`                |

## Prerequisites

- **.NET SDK 10.0.100 or newer** (`dotnet --version`). `global.json` allows any 10.0.x feature band.
- **Node.js >= 24** (with npm).

## Running

### Backend

- **Rider / Visual Studio:** open `backend/Romby.slnx` and run the `Romby.Api` project (the `http` launch profile).
- **VS Code:** open `backend/` with the C# Dev Kit extension, then run `Romby.Api`.
- **CLI:**
  ```bash
  cd backend
  dotnet run --project src/Romby.Api
  ```

The API runs on <http://localhost:8080>, the same port as the Kotlin version, so the frontend works unchanged. Try `curl localhost:8080/api/rooms`.

Run the tests with `dotnet test` from `backend/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### Preparing for offline use (do this before the workshop)

```bash
cd backend  && dotnet test                  # restores all NuGet packages into ~/.nuget/packages
cd backend  && dotnet build --no-restore    # confirms the build now works without network
cd frontend && npm ci                       # installs exactly what package-lock.json specifies
```

Also download your local model (for example a `qwen2.5-coder-7b-instruct.Q4_K_M.gguf` or a `-4bit-mlx` variant) and test it once with the IDE plugin while you still have network.

---

## Exercise 1: Inline completion

The goal is to write code while the local model suggests the next lines. Start typing and accept suggestions with Tab. Watch how well the model picks up patterns from the surrounding code.

| Where | What to write | Pattern to imitate |
|---|---|---|
| `Bookings/BookingDto.cs` | `public static Booking ToEntity(this BookingDto dto) => new() { ... }`, then use it in `BookingService.CreateAsync` | the `ToDto()` extension directly above |
| `Bookings/BookingRepository.cs` | more queries, e.g. `Task<List<Booking>> FindByRoomIdAndStartBetweenAsync(long roomId, DateTime from, DateTime to)` or `FindByBookedByAsync` | `FindByRoomIdAsync` |
| `frontend/src/hooks.ts` | `export function useBookings(roomId: number \| null)` returning `{ bookings, error, reload }`, then replace the inline `useEffect` in `App.tsx` | `useRooms` in the same file |
| `Rooms/RoomsController.cs` | `[HttpGet("available")]`, a room search by minimum capacity | the existing endpoints |

Tips:
- Type a comment first, such as `// returns all bookings for a room within a week`, then start the method signature.
- Compare small (1.5B to 3B) models with larger (7B+) ones. Small models are fast but drift more.

## Exercise 2: Chat on selected code

Select the code, open the plugin chat, and use prompts like these:

1. **Explain an async flow.** Select the body of `BookingService.CreateAsync`.
   > Explain step by step what this method does. Where does it actually hit the database, and how many round-trips are there? What happens if the room doesn't exist? Is the conflict check safe if two requests arrive at the same time?

2. **Generate tests for a pure function.** Select `Overlaps()` in `Bookings/Booking.cs`.
   > Write xUnit tests for this method. Cover back-to-back bookings, zero-length intervals, one interval fully containing the other, and identical intervals. Use `[Theory]` with `[InlineData]` where it fits.

   Then check the result: is the zero-length case actually correct? Does the model agree with the half-open interval comment?

3. **Refactor clunky code.** Select `BookingService.Validate`.
   > Refactor this nested-if validation into idiomatic C#. Use guard clauses or a switch expression, and introduce a `BookingResult` type (for example an abstract record with `Ok` and `Invalid(string Reason)`). Update the caller.

4. **Write an integration test.** Select `RoomsControllerTests` and `BookingsController`.
   > Using this test as a pattern, write tests for POST /api/bookings: a valid booking returns 201, an overlapping booking returns 409, and a blank title returns 400.

## Exercise 3: Agentic coding (a bug across layers)

Give the agent (Continue/Cline/Aider/etc. in agent mode, using a local model) a bug report written the way a user would write it:

> Users report that bookings show up at the wrong time. If I book Fjorden on Wednesday from 09:00 to 10:00, the calendar shows it at 07:00–08:00. Also, I can't book Monday 11:00–12:00 even though the room is free then ("Room is already booked in that period"), but I *can* book on top of the 09:00 sprint planning. Find the cause and fix it. The backend is in `backend/`, the frontend in `frontend/`.

How to reproduce it yourself: run both parts, select Fjorden, and book Wednesday 09:00–10:00 in the form.

Things to discuss afterwards:
- Did the agent read across files (React form to DTO to service to calendar), or did it patch only the symptom (for example adding 2 hours in the calendar)?
- Did it notice that the size of the shift changes with daylight saving time (2 hours in summer, 1 in winter in Norway)?
- Did it reach for `DateTime.ToLocalTime()` in the backend? That uses the *server's* time zone, which is only correct by accident on a laptop demo.
- How many tool calls and how much context did the local model need, compared with a cloud model?

---

## SPOILER: exercise 3 solution

<details>
<summary>Click to show</summary>

### Symptom

In a browser running in Europe/Oslo, a booking for 09:00–10:00 is stored and shown as 07:00–08:00 (summer time, UTC+2) or 08:00–09:00 (winter time, UTC+1). The conflict check compares these shifted times against seed data stored in local time, so real conflicts are missed and false conflicts appear.

### Root cause (several layers, each looking reasonable on its own)

1. **`frontend/src/components/BookingForm.tsx`**: `<input type="datetime-local">` gives `"2026-10-14T09:00"` (local, no zone). The form sends `new Date(start).toISOString()`, which converts to UTC: `"2026-10-14T07:00:00.000Z"`.
2. **`Bookings/BookingDto.cs`**: `Start`/`End` are `DateTime`. System.Text.Json accepts the trailing `Z` and produces `07:00` with `DateTime.Kind = Utc`. No error, no warning. The value is still 07:00; only the `Kind` flag records that it was UTC.
3. **`Bookings/BookingService.cs` / `Overlaps()`**: `DateTime` comparison **ignores `Kind`**, so a UTC `07:00` is compared directly with the seed data's local `09:00`. The comparison is apples against oranges.
4. **EF Core + SQLite**: `DateTime` is stored as text without the `Kind`, so it comes back as `Kind = Unspecified`. The `Z` disappears. (You can see this in the API: the POST response says `"07:00:00Z"`, but the same booking from GET says `"07:00:00"`.)
5. **`frontend/src/components/WeekCalendar.tsx`**: `new Date("2026-10-14T07:00:00")`. A string without a zone is parsed as *local* time, so the shifted value is displayed as 07:00.

Every layer does something defensible. The bug lives in the contract between them: is a timestamp "wall-clock time in the office" or "an instant in UTC"?

### Reference fix

A meeting room is in one physical building, so the booking is a **wall-clock time**. A `DateTime` with `Kind = Unspecified` is the right value in the backend. The fix is to stop converting to UTC in the frontend:

```diff
 // frontend/src/components/BookingForm.tsx
       const created = await createBooking({
         roomId,
         title,
         bookedBy,
-        start: new Date(start).toISOString(),
-        end: new Date(end).toISOString(),
+        // datetime-local is already local wall-clock time ("2026-10-14T09:00"),
+        // which is exactly what the backend's DateTime expects.
+        start,
+        end,
       })
```

Verify by booking 09:00–10:00 again: the calendar now shows 09:00, Monday 11:00–12:00 is allowed, and Monday 09:30–10:30 is rejected with 409.

**Alternative:** if the rooms were in different time zones, you'd go the other way: use `DateTimeOffset` end-to-end (DTO, entity, seed data with explicit offsets) and format to local time only in `WeekCalendar`. That touches more files, which makes it a good follow-up prompt for the agent. Note that EF Core's SQLite provider stores `DateTimeOffset` as text and can't translate comparisons on it to SQL. That doesn't matter here (the overlap check runs in memory), but an agent may run into it if it moves the check into the query.

**Stretch goal:** ask the agent to make the backend *reject* timestamps that carry a zone (`Z` or `+02:00`) instead of silently accepting them. One way is a custom `JsonConverter<DateTime>` registered in `AddControllers().AddJsonOptions(...)`. Then add a regression test that posts a `...Z` timestamp and expects 400. Because .NET 6+ has `DateOnly`/`TimeOnly` but no `LocalDateTime`, this is a good discussion point: would NodaTime's `LocalDateTime` have prevented the bug at compile time?

</details>
