# Romby: meeting-room booking

A small, ordinary-looking app for practising **local AI coding assistance** (Qwen Coder or similar running on your laptop through an IDE plugin).

Romby lists meeting rooms and shows a weekly calendar for the selected room. You can add bookings and delete them. A room cannot be double-booked.

| Part     | Stack                                                                                |
|----------|--------------------------------------------------------------------------------------|
| Backend  | Kotlin 2.4, Spring Boot 4.1 (WebFlux, Jackson 3), Spring Data R2DBC, H2 in-memory, Java 25, Gradle 9.8 (wrapper) |
| Frontend | React 19, TypeScript 7, Vite 8 (dev server proxies `/api` to `localhost:8080`)      |

There is no Docker, no external database and no cloud API. The database is rebuilt from `schema.sql` and `data.sql` on every start. The seed bookings always land in the current week.

```
backend/
  src/main/kotlin/no/systek/romby/
    RombyApplication.kt
    room/     Room, RoomRepository, RoomController
    booking/  Booking (+ overlaps()), BookingDto, BookingRepository, BookingService, BookingController
  src/main/resources/  application.yml, schema.sql, data.sql
  src/test/kotlin/...  RoomControllerTest (the only test, on purpose)
frontend/
  src/api.ts, hooks.ts, App.tsx
  src/components/  RoomList, WeekCalendar, BookingForm
```

## Prerequisites

- **JDK:** any JDK that can run Gradle (17+). The build uses a Java **25** toolchain; if you don't have JDK 25 installed, Gradle downloads it automatically into `~/.gradle/jdks` on the first build (via the foojay toolchain resolver in `settings.gradle.kts`). Nothing is installed system-wide.
- **Node.js >= 24** (with npm).

## Running

### Backend

- **IntelliJ:** open `backend/` as a Gradle project, then run `RombyApplication` (the `main` function in `RombyApplication.kt`).
- **CLI:**
  ```bash
  cd backend
  ./gradlew bootRun
  ```

The API runs on <http://localhost:8080>. Try `curl localhost:8080/api/rooms`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### Preparing for offline use (do this before the workshop)

Workshop Wi-Fi is often unreliable, so fetch every dependency in advance:

```bash
cd backend  && ./gradlew build            # downloads Gradle, JDK 25, plugins and all jars into ~/.gradle
cd backend  && ./gradlew build --offline  # confirms the build now works without network
cd frontend && npm ci                     # installs exactly what package-lock.json specifies
```

Also download your local model (for example a `qwen2.5-coder-7b-instruct.Q4_K_M.gguf` or a `-4bit-mlx` variant) and test it once with the IDE plugin while you still have network.

---

## Exercise 1: Inline completion

The goal is to write code while the local model suggests the next lines. Start typing and accept suggestions with Tab. Watch how well the model picks up patterns from the surrounding code.

| Where | What to write | Pattern to imitate |
|---|---|---|
| `booking/BookingDto.kt` | `fun BookingDto.toEntity() = Booking(...)`, then use it in `BookingService.create` | the `Booking.toDto()` extension directly above |
| `booking/BookingRepository.kt` | more derived queries, e.g. `fun findByRoomIdAndStartBetween(roomId: Long, from: LocalDateTime, to: LocalDateTime): Flux<Booking>` or `findByBookedBy` | `findByRoomId` |
| `frontend/src/hooks.ts` | `export function useBookings(roomId: number \| null)` returning `{ bookings, error, reload }`, then replace the inline `useEffect` in `App.tsx` | `useRooms` in the same file |
| `room/RoomController.kt` | `@GetMapping("/available")`, a room search by minimum capacity | the existing endpoints |

Tips:
- Type a comment first, such as `// returns all bookings for a room within a week`, then start the function signature.
- Compare small (1.5B to 3B) models with larger (7B+) ones. Small models are fast but drift more.

## Exercise 2: Chat on selected code

Select the code, open the plugin chat, and use prompts like these:

1. **Explain a Reactor chain.** Select the body of `BookingService.create`.
   > Explain step by step what this Reactor chain does. When does the database actually get called? What happens if the room doesn't exist?

2. **Generate tests for a pure function.** Select `overlaps()` in `booking/Booking.kt`.
   > Write JUnit 5 tests in Kotlin for this function. Cover back-to-back bookings, zero-length intervals, one interval fully containing the other, and identical intervals. Use backtick test names.

   Then check the result: is the zero-length case actually correct? Does the model agree with the half-open interval comment?

3. **Refactor clunky code.** Select `BookingService.validate`.
   > Refactor this nested-if validation into idiomatic Kotlin. Introduce a `sealed class BookingResult` with `Ok` and `Invalid(reason)` and update the caller.

4. **Write a WebTestClient test.** Select `RoomControllerTest` and `BookingController`.
   > Using this test as a pattern, write tests for POST /api/bookings: a valid booking returns 201, an overlapping booking returns 409, and a missing title returns 400.

## Exercise 3: Agentic coding (a bug across layers)

Give the agent (Continue/Cline/Aider/etc. in agent mode, using a local model) a bug report written the way a user would write it:

> Users report that bookings show up at the wrong time. If I book Fjorden on Wednesday from 09:00 to 10:00, the calendar shows it at 07:00–08:00. Also, I can't book Monday 11:00–12:00 even though the room is free then ("Room is already booked in that period"), but I *can* book on top of the 09:00 sprint planning. Find the cause and fix it. The backend is in `backend/`, the frontend in `frontend/`.

How to reproduce it yourself: run both parts, select Fjorden, and book Wednesday 09:00–10:00 in the form.

Things to discuss afterwards:
- Did the agent read across files (React form to DTO to service to calendar), or did it patch only the symptom (for example adding 2 hours in the calendar)?
- Did it notice that the size of the shift changes with daylight saving time (2 hours in summer, 1 in winter in Norway)?
- How many tool calls and how much context did the local model need, compared with a cloud model?

---

## SPOILER: exercise 3 solution

<details>
<summary>Click to show</summary>

### Symptom

In a browser running in Europe/Oslo, a booking for 09:00–10:00 is stored and shown as 07:00–08:00 (summer time, UTC+2) or 08:00–09:00 (winter time, UTC+1). The conflict check compares these shifted times against seed data stored in local time, so real conflicts are missed and false conflicts appear.

### Root cause (three layers, each looking reasonable on its own)

1. **`frontend/src/components/BookingForm.tsx`**: `<input type="datetime-local">` gives `"2026-10-14T09:00"` (local, no zone). The form sends `new Date(start).toISOString()`, which converts to UTC: `"2026-10-14T07:00:00.000Z"`.
2. **`backend/.../booking/BookingDto.kt`**: `start`/`end` are `LocalDateTime`. Jackson's `LocalDateTimeDeserializer` (Jackson 3 in Spring Boot 4, same as Jackson 2 before it) is lenient by default. It accepts the trailing `Z`, interprets the value as UTC and throws away the zone, leaving `2026-10-14T07:00`. No error, no warning.
3. **`BookingService.create` / `overlaps()`**: compares `07:00–08:00` with the seed data, which is stored as local wall-clock time (`09:00–10:00`). The comparison is apples against oranges.
4. **`frontend/src/components/WeekCalendar.tsx`**: `new Date("2026-10-14T07:00:00")`. A string without a zone is parsed as *local* time, so the shifted value is displayed as 07:00.

Every layer does something defensible. The bug lives in the contract between them: is a timestamp "wall-clock time in the office" or "an instant in UTC"?

### Reference fix

A meeting room is in one physical building, so the booking is a **wall-clock time**. `LocalDateTime` is the right type in the backend. The fix is to stop converting to UTC in the frontend:

```diff
 // frontend/src/components/BookingForm.tsx
       const created = await createBooking({
         roomId,
         title,
         bookedBy,
-        start: new Date(start).toISOString(),
-        end: new Date(end).toISOString(),
+        // datetime-local is already local wall-clock time ("2026-10-14T09:00"),
+        // which is exactly what the backend's LocalDateTime expects.
+        start,
+        end,
       })
```

Verify by booking 09:00–10:00 again: the calendar now shows 09:00, Monday 11:00–12:00 is allowed, and Monday 09:30–10:30 is rejected with 409.

**Alternative:** if the rooms were in different time zones, you'd go the other way: use `Instant`/`OffsetDateTime` end-to-end (DTO, entity, a `TIMESTAMP WITH TIME ZONE` column, seed data with explicit offsets) and format to local time only in `WeekCalendar`. That's a bigger change across more files, which makes it a good follow-up prompt for the agent.

**Stretch goal:** ask the agent to make the backend *reject* zoned strings for `LocalDateTime` instead of silently accepting them, and to add a regression test that posts a `...Z` timestamp.

</details>
