# Tasks

Do them in order. One task per session.

---

## [ ] Task 1: Project skeleton

- Run `go mod init gitstat`.
- Run `go get github.com/charmbracelet/bubbletea github.com/charmbracelet/bubbles github.com/charmbracelet/lipgloss`.
- Create `main.go` that prints `gitstat` and exits.
- Create empty package files `internal/gitstatus/status.go`, `internal/scan/scan.go`,
  `internal/ui/model.go`, each containing only its `package` line.

**Done when:** `go build ./...` succeeds and `go run .` prints `gitstat`.

---

## [ ] Task 2: Parse git status output

File: `internal/gitstatus/status.go`, test in `internal/gitstatus/status_test.go`.

```go
type Status struct {
    Branch     string // "main", or "(detached)"
    Upstream   string // "" if none
    Ahead      int
    Behind     int
    Staged     int
    Unstaged   int
    Untracked  int
    Conflicted int
    Files      []string // one line per changed file, e.g. " M src/main.go", "A  new.go", "?? notes.txt"
}

func (s Status) Dirty() bool // true if Staged+Unstaged+Untracked+Conflicted > 0

func Parse(out string) (Status, error) // parses `git status --porcelain=v2 --branch`
```

Rules for the input format (one record per line):

- `# branch.head NAME` sets Branch.
- `# branch.upstream NAME` sets Upstream.
- `# branch.ab +A -B` sets Ahead=A, Behind=B. Strip the leading `+` and `-` before `strconv.Atoi`,
  so `+2 -1` gives Ahead 2, Behind 1 (both positive).
- Other `# ...` lines are ignored.
- Lines starting with `1 ` or `2 `: the second field is two characters XY.
  If X != '.' then Staged++. If Y != '.' then Unstaged++.
  The path is the LAST field (for `2 ` lines the path is before a TAB; use the text before the TAB).
- Lines starting with `u ` count as Conflicted++. Path is the last field.
- Lines starting with `? ` count as Untracked++. Path is everything after `? `.
- For Files, use XY with '.' replaced by ' ' for `1`/`2`/`u` lines, and `??` for untracked,
  then one space, then the path. So `.M` gives `" M src/main.go"` and `A.` gives `"A  new.go"`.

Write table-driven tests with at least these inputs:

```
# branch.oid 1111111111111111111111111111111111111111
# branch.head main
# branch.upstream origin/main
# branch.ab +2 -1
1 .M N... 100644 100644 100644 aaaa aaaa src/main.go
1 A. N... 000000 100644 100644 0000 bbbb new.go
1 MM N... 100644 100644 100644 cccc dddd both.go
? notes.txt
```
Expect: Branch main, Upstream origin/main, Ahead 2, Behind 1, Staged 2, Unstaged 2, Untracked 1, 4 Files.

```
# branch.oid (initial)
# branch.head (detached)
```
Expect: Branch "(detached)", everything else zero, Dirty() false.

```
# branch.head feature
u UU N... 100644 100644 100644 100644 aaaa bbbb cccc conflict.go
```
Expect: Branch feature, Conflicted 1.

**Done when:** `go test ./internal/gitstatus/` passes.

---

## [ ] Task 3: Run git for one repository

File: `internal/gitstatus/git.go`, test in `internal/gitstatus/git_test.go`.

```go
// Get runs git in repoPath and returns the parsed status plus the time of the last commit.
// LastCommit is the zero time.Time if the repo has no commits.
func Get(ctx context.Context, repoPath string) (Status, time.Time, error)
```

- Run `git -C <repoPath> status --porcelain=v2 --branch` with `exec.CommandContext`, pass output to Parse.
- Run `git -C <repoPath> log -1 --format=%ct`. If it fails, LastCommit is the zero time (not an error).
  Otherwise parse the unix seconds.
- Set env `GIT_OPTIONAL_LOCKS=0` on both commands so the tool never takes git locks.

Test: in `t.TempDir()`, run `git init`, write a file, check Get reports Untracked 1 and zero LastCommit.
Then `git add` + `git -c user.name=t -c user.email=t@t commit -m x`, check Dirty() is false and LastCommit is not zero.
Skip the test with `t.Skip` if `git` is not in PATH.

**Done when:** `go test ./internal/gitstatus/` passes.

---

## [ ] Task 4: Find repositories

File: `internal/scan/scan.go`, test in `internal/scan/scan_test.go`.

```go
// FindRepos returns absolute paths of directories under root that contain a ".git" entry
// (directory or file), sorted alphabetically. It does not descend into a repo once found,
// and does not go deeper than maxDepth levels below root (root itself is depth 0).
func FindRepos(root string, maxDepth int) ([]string, error)
```

- Use `filepath.WalkDir`.
- Skip directories named `node_modules`, `.git`, `vendor`, `target`, `build`, `.idea`.
- Ignore permission errors on subdirectories (skip them, do not fail).

Test with `t.TempDir()`: create `a/.git/`, `b/c/.git/`, `b/c/d/.git/` (nested, must NOT appear),
`node_modules/x/.git/` (must NOT appear), `deep/1/2/3/4/.git/` with maxDepth 3 (must NOT appear).
Expect exactly `a` and `b/c`.

**Done when:** `go test ./internal/scan/` passes.

---

## [ ] Task 5: Plain text output (no TUI yet)

File: `main.go` only.

- Flags: `-depth` (int, default 3). First positional argument is the root dir (default `.`).
- Call FindRepos, then gitstatus.Get for each repo with a 10 second timeout per repo.
- Print one line per repo: relative path, branch, `+ahead -behind`, `S:n U:n ?:n`, and `clean` or `dirty`.
- On error for a repo, print the path and the error, and continue.

**Done when:** `go run . ~/some-folder-with-repos` prints a line for every repo.

---

## [ ] Task 6: Static TUI table

Files: `internal/ui/model.go` (model + Update), `internal/ui/view.go` (View), `main.go` (start the program).

- `type Row struct { Path string; Status gitstatus.Status; LastCommit time.Time; Err error; Loading bool }`
- `func New(rows []Row) Model` builds a `bubbles/table` with columns:
  Repo, Branch, ↑↓ (e.g. `↑2 ↓1`, blank if both 0), Changes (e.g. `S2 U1 ?3`, or `✓` if clean), Last commit (e.g. `3d ago`).
- Write `func ago(t time.Time) string` returning `now`, `5m`, `3h`, `2d`, `6w` style strings, `-` for zero time. Add a small test.
- Keys: up/down/j/k move (the table handles this), `q` and `ctrl+c` quit.
- Handle `tea.WindowSizeMsg` by setting the table height to window height minus 3.
- In `main.go`: load all rows synchronously as in Task 5, then run `tea.NewProgram(ui.New(rows), tea.WithAltScreen())`.

**Done when:** `go run . ~/some-folder` shows the table, arrows move, `q` quits.

---

## [ ] Task 7: Load statuses in the background

Files: `internal/ui/model.go`, `internal/ui/load.go`, `main.go`.

- `main.go` only calls FindRepos and passes rows with `Loading: true` to `ui.New`. It no longer calls Get.
- Add `type statusMsg struct { Index int; Status gitstatus.Status; LastCommit time.Time; Err error }`.
- In `load.go`, `func loadCmd(index int, path string, sem chan struct{}) tea.Cmd` that acquires `sem`,
  calls Get with a 10 s timeout, releases `sem`, and returns a statusMsg.
- `Init()` returns `tea.Batch` of one loadCmd per row. `sem` is a buffered channel of size 8 created in New.
- On statusMsg, update that row and rebuild the table rows. Loading rows show `…` in Changes.

**Done when:** the table appears instantly and rows fill in as they finish.

---

## [ ] Task 8: Refresh, filter, sort

Files: `internal/ui/model.go`, `internal/ui/view.go`.

- `r`: set all rows to Loading and start loading again (same as Init).
- `d`: toggle "dirty only" filter. Keep the full row list; build the visible table rows from it.
  Note: statusMsg.Index refers to the full list, not the visible one.
- `s`: cycle sort order name → dirty first → last commit newest first → name.
- Footer line under the table: `r refresh · d dirty only [on/off] · s sort: <mode> · enter details · q quit`.

**Done when:** all three keys work and the footer reflects the state.

---

## [ ] Task 9: Detail view

Files: `internal/ui/model.go`, `internal/ui/view.go`.

- `enter` on a row switches to a detail view for that repo: full path, branch, upstream, ahead/behind,
  then `Status.Files` one per line (or `working tree clean`).
- `esc` or `enter` returns to the table. `q` still quits.
- If the row has an error, show the error text instead of files.

**Done when:** enter/esc toggles between table and detail view.

---

## [ ] Task 10: Render the table with lipgloss/table

Files: `internal/ui/model.go`, `internal/ui/view.go`, test in `internal/ui/view_test.go`.

`bubbles/table` truncates cells by counting bytes, so styled (ANSI) strings get cut in the
middle of escape codes. Replace it with `github.com/charmbracelet/lipgloss/table`, which is ANSI-aware.

- Remove `bubbles/table`. The model keeps its own `cursor int` and `offset int` (first visible row).
- up/down/j/k move the cursor; adjust `offset` so the cursor stays visible.
- View renders only the rows from `offset` that fit in the window height minus 3.
- Use `StyleFunc(row, col)` to highlight the selected row (reverse or a background color).
- No other colors yet. All existing keys (r, d, s, enter, esc, q) must keep working.
- Test: build a model with 3 fixed rows (one clean, one with S2 U1 ?3, one loading), call `View()`,
  strip ANSI with `ansi.Strip` from `github.com/charmbracelet/x/ansi` (already a lipgloss dependency),
  and check that the output contains `✓`, `S2 U1 ?3` and `…` unchanged.

**Done when:** tests pass, and the app looks and behaves as before.

---

## [ ] Task 11: Colors

File: `internal/ui/view.go` only.

Color cells in the `StyleFunc`, never by putting styled strings into the row data.
Use adaptive colors (light and dark terminals):
- Clean `✓` green; changes yellow; conflicts red; rows with Err red.
- `↑n` cyan, `↓n` magenta. Footer faint.
- Extend the test from Task 10: after `ansi.Strip`, the output must still contain `✓` and `S2 U1 ?3`.

**Done when:** tests pass. Do not change behavior.
