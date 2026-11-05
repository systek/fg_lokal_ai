# gitstat

A terminal UI that scans a directory for git repositories and shows the status of each one
in a table: branch, staged/unstaged/untracked counts, ahead/behind upstream, and last commit age.

## Stack (do not change)

- Go 1.22+
- github.com/charmbracelet/bubbletea (v1 API: `tea.Model` with `Init`, `Update`, `View`)
- github.com/charmbracelet/bubbles/table (until Task 10 replaces it with lipgloss/table)
- github.com/charmbracelet/lipgloss
- Git is called through `os/exec` (`git -C <path> ...`). Do NOT use go-git or any other git library.
- No other dependencies.

## Layout

```
main.go                      flags, wiring, starts the program
internal/gitstatus/          Status type, Parse (pure), Get (runs git)
internal/scan/               FindRepos (walks the filesystem)
internal/ui/                 bubbletea model, update, view
```

## Rules for working on this project

1. Work on exactly ONE task from TASKS.md: the one you were asked to do. Do not start the next task.
2. Read only the files the task mentions, plus files you must call into.
3. Do not refactor, rename, or reformat code outside the task.
4. Keep each file under about 200 lines. Prefer small functions.
5. After every change run:
   `go build ./... && go vet ./... && go test ./...`
   Fix any failure before continuing. Never finish with a failing build or tests.
6. When the task's acceptance check passes, change its `[ ]` to `[x]` in TASKS.md and stop.
   Reply with a short summary (max 5 lines) of what you changed.
7. If something in the task is unclear or impossible, stop and say so. Do not guess.
