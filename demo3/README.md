# Kanban-lite

A small team task board used to demo **local AI coding assistants** (a model running on your laptop, e.g. a Qwen coder GGUF via an IDE plugin).

- Three columns: **TODO / IN_PROGRESS / DONE**. Drag cards between them.
- A paginated, filterable **backlog** table.
- **Live updates** via Server-Sent Events: open the board in two tabs, move a card in one, watch it move in the other.

| Part     | Stack |
|----------|-------|
| Backend  | Kotlin 2.4, Spring Boot 4.1 (WebFlux), Spring Data R2DBC, H2 in-memory, Java 25 |
| Frontend | React 19, TypeScript 7, Vite 8, plain CSS, native HTML5 drag-and-drop |

Everything runs offline: no Docker, no external database, no cloud APIs.

## Prerequisites

- **JDK:** any JDK that can run Gradle (21 is fine). The build uses a Java 25 toolchain; if JDK 25 is not installed, Gradle downloads it automatically into `~/.gradle/jdks` on the first build (foojay toolchain resolver in `settings.gradle.kts`). Nothing is installed system-wide.
- **Node.js 24 or newer** (see `engines` in `frontend/package.json`).
- Network on the first build only; see *Preparing for offline use* below.

## Layout

```
backend/
  src/main/kotlin/no/systek/kanban/
    KanbanApplication.kt
    card/    Card, CardStatus (+ Priority), CardDto (+ requests, PageDto), CardRepository, CardController
    events/  BoardEvent, BoardEventBus (Sinks.many().multicast()), BoardEventController (SSE endpoint)
  src/main/resources/  application.yml, schema.sql, data.sql (30 seed cards)
  src/test/kotlin/...  CardControllerTest (one sample WebTestClient test)
frontend/
  src/  App, Board, Column, CardView, NewCardForm, Backlog, api.ts, types.ts, useBoardEvents.ts, styles.css
```

## Running

**Backend** (port 8080)

- IntelliJ: open `backend/` as a Gradle project and run `KanbanApplication`.
- CLI: `cd backend && ./gradlew bootRun`

**Frontend** (port 5173, proxies `/api` to `localhost:8080`)

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (twice, side by side, to see live updates).

If port 8080 is taken, start the backend with `./gradlew bootRun --args="--server.port=8081"` and change `target` in `frontend/vite.config.ts`.

### API

| Method | Path | |
|---|---|---|
| GET   | `/api/cards` | all cards (board) |
| GET   | `/api/cards/{id}` | one card |
| GET   | `/api/cards/backlog?page=&size=&q=` | paginated backlog, `q` filters on title |
| POST  | `/api/cards` | create `{title, assignee?, priority?}` |
| PATCH | `/api/cards/{id}/move` | move `{status}` |
| GET   | `/api/board/events` | SSE stream of `BoardEvent`s |

### Preparing for offline use

Do this once while you still have network, e.g. before the workshop:

```
cd backend  && ./gradlew build              # downloads Gradle, JDK 25, plugins and all dependencies
cd frontend && npm ci                       # installs exactly what package-lock.json says
```

After that, `./gradlew build --offline` and `npm run dev` work without network. Also make sure your local model is downloaded and your IDE plugin points at it.

## Exercises

### 1. Inline completion

Let the model complete code while you type. Accept with Tab, reject by typing on.

- **Missing endpoints.** At the bottom of `CardController.kt` there are TODOs for `PUT /api/cards/{id}` and `DELETE /api/cards/{id}`. Start typing `@PutMapping("/{id}")` and see if the model follows the pattern of `move` (find, 404, `copy()`, save, publish event). Do the same for delete. You will need an `UpdateCardRequest` in `CardDto.kt`: type `data class UpdateCardRequest(` and let it fill in the fields.
- **`copy()` for changes.** Inside the update endpoint, type `card.copy(` and see whether it suggests the right fields.
- **New component by imitation.** Create `frontend/src/CardDetails.tsx` with `CardView.tsx` open in another tab. Type `export default function CardDetails({ card }: Props) {` and see what it produces. Then add `updateCard` and `deleteCard` to `api.ts` next to `moveCard`.
- **SQL.** Add a `due_date` column to `schema.sql` and see if it suggests matching values in `data.sql`.

Talking point: completion is fast and good at *local patterns*; it only sees nearby files, so it may guess wrong field names.

### 2. Chat on selected code

Select code, open the plugin's chat, ask about it.

- **Explain.** Select `BoardEventBus.kt` and `BoardEventController.kt`:
  > Explain how this SSE stream works. What happens when two browser tabs are connected and a card is moved? What does `directBestEffort` mean versus `onBackpressureBuffer`, and why is `publish` synchronized?
- **Generate tests.** Select `CardController` and open `CardControllerTest`:
  > Using the existing test as a template, write WebTestClient tests for: creating a card with a blank title (400), moving a card (200 and new status), moving a card that does not exist (404), and the backlog endpoint returning `size` items.
- **Refactor.** Select the whole `CardController`:
  > This controller does validation, persistence and event publishing inline. Refactor it into a `CardService` (business logic + events) and a thin controller. Keep the API identical, use idiomatic Kotlin.

  Then run `./gradlew test` to check nothing broke.
- **Small one:** select `useBoardEvents.ts` and ask *"Why is the callback stored in a ref?"*

Talking point: compare quality with a cloud model if you have one; small local models do well on explain/tests, more variable on larger refactors.

### 3. Agentic coding: a bug across layers

Bug report from a user:

> In the Backlog, I can't find some of our cards. "Write onboarding guide" never shows up, and the last page is always empty. Sometimes the same card appears on two pages.

Give the agent the bug report and let it investigate both the frontend and backend:

> Here is a bug report: <paste>. The backlog is in `frontend/src/Backlog.tsx` and the API in `backend/.../card/CardController.kt`. Find the root cause, explain it, fix it, and add a backend test that would have caught it.

Things to watch: does it read across files, does it run the app or curl the API, does it find *both* problems? Tip: set `org.springframework.r2dbc.core: DEBUG` in `application.yml` to see the generated SQL.

---

---

## SPOILER — exercise 3 solution

Stop reading here if you are doing the exercise.

### Symptom

With 30 cards and 10 per page the UI shows "Page 1 of 3", but:

- the first 10 cards (oldest) never appear,
- "Page 3 of 3" is empty,
- cards that share a `createdAt` can show up on two pages while others vanish, and which ones differs between restarts.

```
curl 'localhost:8080/api/cards/backlog?page=0&size=10'   # the 10 oldest cards: the UI never asks for this
curl 'localhost:8080/api/cards/backlog?page=1&size=10'   # what the UI shows as "Page 1"
curl 'localhost:8080/api/cards/backlog?page=3&size=10'   # what the UI shows as "Page 3": empty
```

### Root cause: two bugs, two layers

1. **Off-by-one between frontend and backend page numbers.**
   `frontend/src/Backlog.tsx` keeps a 1-based page (`useState(1)`, "Page {page} of {totalPages}") and `api.ts` sends it unchanged.
   `CardController.backlog` passes it straight into `PageRequest.of(page, size, ...)`, which is **0-based**. So UI page 1 asks for `OFFSET 10`.
2. **Non-deterministic sort.**
   `Sort.by("createdAt")` is not a total order: `data.sql` has groups of 6-8 cards with the same `created_at` (sprint planning sessions). SQL gives no ordering guarantee between ties, so each `LIMIT/OFFSET` query may order a tie group differently, and a page boundary that cuts through a group can duplicate or drop cards.

### Reference fix

Pick one page base and stick to it. Here the API stays 0-based (Spring convention) and the UI converts:

```diff
 // frontend/src/Backlog.tsx
-    fetchBacklog(page, PAGE_SIZE, filter)
+    fetchBacklog(page - 1, PAGE_SIZE, filter) // API pages are 0-based, UI shows 1-based
```

(Alternatively keep `page` 0-based in state and render `Page {page + 1} of {totalPages}`.)

Add a unique tiebreaker so the order is total and stable across queries:

```diff
 // backend/.../card/CardController.kt
-        val pageable = PageRequest.of(page, size, Sort.by("createdAt"))
+        val pageable = PageRequest.of(page, size, Sort.by("createdAt").and(Sort.by("id")))
```

A test that catches both regressions: fetch every page from `page=0` until `totalPages`, collect the ids, and assert they equal all 30 ids with no duplicates.
