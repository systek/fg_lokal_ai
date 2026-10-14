# Romby (Python): meeting-room booking

The Python version of [`demo1`](../demo1). Same app, same React frontend, same exercises and same hidden bug. Only the backend is rewritten, in Python with FastAPI. Use it for participants who work in Python rather than Kotlin/Spring.

Romby lists meeting rooms and shows a weekly calendar for the selected room. You can add bookings and delete them. A room cannot be double-booked.

| Part     | Stack                                                                                       |
|----------|---------------------------------------------------------------------------------------------|
| Backend  | Python 3.14, FastAPI, Pydantic 2, SQLAlchemy 2 with SQLite in-memory, pytest, managed with uv |
| Frontend | React 19, TypeScript 7, Vite 8 (dev server proxies `/api` to `localhost:8080`). Identical to `demo1` |

There is no Docker, no external database and no cloud API. The database is rebuilt in `romby/seed.py` on every start, and the seed bookings always land in the current week.

```
backend/
  pyproject.toml, uv.lock, .python-version
  romby/
    main.py        FastAPI app, error format, startup seeding, `python -m romby.main`
    db.py          engine, session-per-request dependency
    seed.py        schema + seed data
    rooms/     models (Room), schemas (RoomDto), router
    bookings/  models (Booking + overlaps()), schemas (BookingDto), repository, service, router
  tests/
    test_rooms.py  the only test, on purpose
frontend/
  src/api.ts, hooks.ts, App.tsx
  src/components/  RoomList, WeekCalendar, BookingForm
```

### How it maps to the Kotlin version

| Spring Boot (`demo1`)                        | FastAPI (`demo1-python`)                                   |
|----------------------------------------------|------------------------------------------------------------|
| `@RestController` + `@GetMapping`            | `APIRouter` + `@router.get`                                 |
| Constructor injection of `@Service` beans    | `Depends()`: FastAPI builds `BookingService` per request    |
| `Mono<T>` / `Flux<T>` (Reactor)              | plain `def` endpoints, which FastAPI runs in a thread pool  |
| R2DBC repository with derived queries        | `BookingRepository` with SQLAlchemy `select()` queries      |
| `ResponseStatusException`                    | `HTTPException` + a handler that returns `{ status, message }` |
| H2 in-memory + `schema.sql` / `data.sql`     | SQLite in-memory + `create_all()` + `seed.py`               |
| `LocalDateTime` + Jackson                    | `datetime` + Pydantic                                       |
| `WebTestClient`                              | `TestClient`                                                |

## Prerequisites

- **[uv](https://docs.astral.sh/uv/)** (`brew install uv`). It downloads Python 3.14 itself if you don't have it, and creates the virtualenv in `backend/.venv`.
- **Node.js >= 24** (with npm).

Without uv: create a Python 3.14 virtualenv yourself and `pip install fastapi "uvicorn[standard]" sqlalchemy pytest httpx2`.

## Running

### Backend

- **CLI:**
  ```bash
  cd backend
  uv run uvicorn romby.main:app --port 8080 --reload
  ```
- **PyCharm / VS Code:** open `backend/`, run `uv sync` once, and pick `backend/.venv` as the interpreter. Then run `romby/main.py`.

The API runs on <http://localhost:8080>, the same port as the Kotlin version, so the frontend works unchanged. Try `curl localhost:8080/api/rooms`, or open the generated API docs at <http://localhost:8080/docs>.

Run the tests with `uv run pytest` from `backend/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### Preparing for offline use (do this before the workshop)

```bash
cd backend  && uv sync                      # downloads Python 3.14 and all packages
cd backend  && uv sync --offline            # confirms everything is now in the local cache
cd frontend && npm ci                       # installs exactly what package-lock.json specifies
```

Also download your local model (for example a `qwen2.5-coder-7b-instruct.Q4_K_M.gguf` or a `-4bit-mlx` variant) and test it once with the IDE plugin while you still have network.

---

## Exercise 1: Inline completion

The goal is to write code while the local model suggests the next lines. Start typing and accept suggestions with Tab. Watch how well the model picks up patterns from the surrounding code.

| Where | What to write | Pattern to imitate |
|---|---|---|
| `bookings/schemas.py` | `def to_entity(dto: BookingDto) -> Booking:`, then use it in `BookingService.create` | `to_dto()` directly above |
| `bookings/repository.py` | more queries, e.g. `def find_by_room_id_and_start_between(self, room_id: int, start: datetime, end: datetime)` or `find_by_booked_by` | `find_by_room_id` |
| `frontend/src/hooks.ts` | `export function useBookings(roomId: number \| null)` returning `{ bookings, error, reload }`, then replace the inline `useEffect` in `App.tsx` | `useRooms` in the same file |
| `rooms/router.py` | `@router.get("/available")`, a room search by minimum capacity | the existing endpoints |

Tips:
- Type a comment or docstring first, such as `# returns all bookings for a room within a week`, then start the function signature.
- Compare small (1.5B to 3B) models with larger (7B+) ones. Small models are fast but drift more.
- For `/available`: FastAPI matches routes in the order they are declared. If the model puts it *below* `/{room_id}`, `GET /api/rooms/available` returns 422 because `"available"` isn't an int. Does the model know that?

## Exercise 2: Chat on selected code

Select the code, open the plugin chat, and use prompts like these:

1. **Explain the request flow.** Select `BookingService` in `bookings/service.py`.
   > Explain step by step what happens when `create` is called. Where does FastAPI get the repository and the session from, and are they the same session? Which thread does this run on? When does the database actually get called? Is the conflict check safe if two requests arrive at the same time?

2. **Generate tests for a pure function.** Select `overlaps()` in `bookings/models.py`.
   > Write pytest tests for this function. Cover back-to-back bookings, zero-length intervals, one interval fully containing the other, and identical intervals. Use `pytest.mark.parametrize` where it fits.

   Then check the result: is the zero-length case actually correct? Does the model agree with the half-open interval docstring?

3. **Refactor clunky code.** Select `BookingService.validate`.
   > Refactor this nested-if validation into idiomatic Python using guard clauses. Introduce a result type (for example frozen dataclasses `Ok` and `Invalid(reason)` with `BookingResult = Ok | Invalid`) and update the caller to use `match`.

4. **Write an API test.** Select `tests/test_rooms.py` and `bookings/router.py`.
   > Using this test as a pattern, write tests for POST /api/bookings: a valid booking returns 201, an overlapping booking returns 409, and a blank title returns 400.

   Follow-up: what does a request *without* a title return? (422, from Pydantic, before our own validation runs.) Did the model guess 400?

## Exercise 3: Agentic coding (a bug across layers)

Give the agent (Continue/Cline/Aider/etc. in agent mode, using a local model) a bug report written the way a user would write it:

> Users report that bookings show up at the wrong time. If I book Fjorden on Wednesday from 09:00 to 10:00, the calendar shows it at 07:00–08:00. Also, I can't book Monday 11:00–12:00 even though the room is free then ("Room is already booked in that period"), but I *can* book on top of the 09:00 sprint planning. Find the cause and fix it. The backend is in `backend/`, the frontend in `frontend/`.

How to reproduce it yourself: run both parts, select Fjorden, and book Wednesday 09:00–10:00 in the form.

Things to discuss afterwards:
- Did the agent read across files (React form to DTO to service to calendar), or did it patch only the symptom (for example adding 2 hours in the calendar)?
- Did it notice that the size of the shift changes with daylight saving time (2 hours in summer, 1 in winter in Norway)?
- Did it just delete `drop_timezone`? Then try a booking: what happens, and why was the validator there in the first place?
- How many tool calls and how much context did the local model need, compared with a cloud model?

---

## SPOILER: exercise 3 solution

<details>
<summary>Click to show</summary>

### Symptom

In a browser running in Europe/Oslo, a booking for 09:00–10:00 is stored and shown as 07:00–08:00 (summer time, UTC+2) or 08:00–09:00 (winter time, UTC+1). The conflict check compares these shifted times against seed data stored in local time, so real conflicts are missed and false conflicts appear.

### Root cause (several layers, each looking reasonable on its own)

1. **`frontend/src/components/BookingForm.tsx`**: `<input type="datetime-local">` gives `"2026-10-14T09:00"` (local, no zone). The form sends `new Date(start).toISOString()`, which converts to UTC: `"2026-10-14T07:00:00.000Z"`.
2. **`bookings/schemas.py`**: Pydantic correctly parses this as an *aware* datetime, `07:00+00:00`. Then the `drop_timezone` validator throws the zone away, leaving a naive `07:00`. No error, no warning.
3. **`bookings/service.py` / `overlaps()`**: compares the naive `07:00–08:00` with the seed data, which is stored as naive local wall-clock time (`09:00–10:00`). The comparison is apples against oranges.
4. **`frontend/src/components/WeekCalendar.tsx`**: `new Date("2026-10-14T07:00:00")`. A string without a zone is parsed as *local* time, so the shifted value is displayed as 07:00.

Every layer does something defensible. The bug lives in the contract between them: is a timestamp "wall-clock time in the office" or "an instant in UTC"?

**The Python twist:** Python is actually *stricter* here than Java or .NET. Comparing a naive datetime with an aware one raises `TypeError: can't compare offset-naive and offset-aware datetimes`. Without `drop_timezone`, the bug would have been a loud 500 on the first booking. The validator was written to make that error go away, and its comment sounds reasonable. It's a realistic example of fixing an error message instead of its cause.

### Reference fix

A meeting room is in one physical building, so the booking is a **wall-clock time**. A naive `datetime` is the right value in the backend. The fix is to stop converting to UTC in the frontend:

```diff
 // frontend/src/components/BookingForm.tsx
       const created = await createBooking({
         roomId,
         title,
         bookedBy,
-        start: new Date(start).toISOString(),
-        end: new Date(end).toISOString(),
+        // datetime-local is already local wall-clock time ("2026-10-14T09:00"),
+        // which is exactly what the backend's naive datetime expects.
+        start,
+        end,
       })
```

Verify by booking 09:00–10:00 again: the calendar now shows 09:00, Monday 11:00–12:00 is allowed, and Monday 09:30–10:30 is rejected with 409.

**Alternative:** if the rooms were in different time zones, you'd go the other way: keep aware datetimes end-to-end (DTO, `DateTime(timezone=True)` columns, seed data with explicit offsets) and format to local time only in `WeekCalendar`. Note that SQLite has no real timezone type, so SQLAlchemy may still hand back naive values. That makes this a good follow-up prompt for the agent.

**Stretch goal:** ask the agent to make the backend *reject* timestamps that carry a zone instead of silently stripping it, and to add a regression test that posts a `...Z` timestamp. In Pydantic this is nearly a one-liner: replace `drop_timezone` and type `start`/`end` as `pydantic.NaiveDatetime`, which answers aware input with 422. Does the agent know that type exists?

</details>
