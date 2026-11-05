#!/usr/bin/env bash
# Run the unchecked tasks in TASKS.md one by one.
#   - The LOCAL model implements each task in a fresh headless Claude Code session.
#   - The script verifies build/vet/tests itself.
#   - OPUS (cloud) reviews the diff of each passing task against the task spec (REVIEW=1),
#     and takes over a task the local model could not finish (ESCALATE=1).
#   - Each finished task is committed, tagged with who did it: "(local)" or "(opus)".
#
# Usage:
#   ./run-tasks.sh            # run all remaining tasks
#   ./run-tasks.sh 5          # stop after task 5
#   REVIEW=0 ESCALATE=0 ./run-tasks.sh    # local only, nothing leaves your machine
#
# Env:
#   CLAUDE_LAUNCHER  starts claude against the local model (default: ./claude-lmstudio.sh)
#   CLOUD_MODEL      model for review/escalation (default: opus)
#   REVIEW           1 = Opus reviews each task before commit (default: 1)
#   ESCALATE         1 = Opus finishes tasks the local model failed (default: 1)
#   TASK_TIMEOUT     max wall time per local attempt (default: 45m; needs timeout/gtimeout)
#   MAX_TURNS        max agent steps per attempt (default: 40)
#   MAX_ATTEMPTS     local attempts per task, review rejections included (default: 3)

set -uo pipefail

UNTIL="${1:-999}"
LOCAL="${CLAUDE_LAUNCHER:-./claude-lmstudio.sh}"
CLOUD_MODEL="${CLOUD_MODEL:-opus}"
REVIEW="${REVIEW:-1}"
ESCALATE="${ESCALATE:-1}"
TASK_TIMEOUT="${TASK_TIMEOUT:-45m}"
MAX_TURNS="${MAX_TURNS:-40}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-3}"
LOG_DIR="logs"

# Tools the implementer may use without asking. No git, no arbitrary shell.
ALLOWED_TOOLS="Read,Edit,Write,Glob,Grep,Bash(go:*),Bash(gofmt:*),Bash(mkdir:*),Bash(ls:*)"
# The reviewer may only look.
REVIEW_TOOLS="Read,Glob,Grep"
# Keep headless runs isolated: no cross-session messaging in or out.
ISOLATE=(--strict-mcp-config --disallowedTools "ListAgents,SendMessage" --settings '{"crossSessionInbound":"refuse"}')

log() { printf '\033[1;34m[run-tasks]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[run-tasks]\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f TASKS.md ]] || die "Run this from the project root (TASKS.md not found)"
git rev-parse --git-dir >/dev/null 2>&1 || die "Not a git repo. Run: git init && git add -A && git commit -m init"
[[ -z "$(git status --porcelain)" ]] || die "Working tree not clean. Commit or stash first."

TIMEOUT_CMD=""
if command -v timeout >/dev/null; then TIMEOUT_CMD="timeout $TASK_TIMEOUT"
elif command -v gtimeout >/dev/null; then TIMEOUT_CMD="gtimeout $TASK_TIMEOUT"
else log "No timeout/gtimeout found (macOS: brew install coreutils). Relying on --max-turns only."
fi

mkdir -p "$LOG_DIR"
grep -qxF "$LOG_DIR/" .gitignore 2>/dev/null || echo "$LOG_DIR/" >> .gitignore

# --- runners -----------------------------------------------------------------

run_local() {  # prompt logfile
  $TIMEOUT_CMD "$LOCAL" -p "$1" "${ISOLATE[@]}" \
    --permission-mode acceptEdits --allowedTools "$ALLOWED_TOOLS" --max-turns "$MAX_TURNS" \
    >"$2" 2>&1
}

# Normal Claude Code login, with every local-model override removed.
cloud_claude() {
  env -u ANTHROPIC_BASE_URL -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_MODEL \
      -u ANTHROPIC_DEFAULT_OPUS_MODEL -u ANTHROPIC_DEFAULT_SONNET_MODEL \
      -u ANTHROPIC_DEFAULT_HAIKU_MODEL -u CLAUDE_CODE_ATTRIBUTION_HEADER \
    claude --model "$CLOUD_MODEL" "$@"
}

run_cloud() {  # prompt logfile
  cloud_claude -p "$1" "${ISOLATE[@]}" \
    --permission-mode acceptEdits --allowedTools "$ALLOWED_TOOLS" --max-turns "$MAX_TURNS" \
    >"$2" 2>&1
}

# --- checks ------------------------------------------------------------------

verify() {
  [[ -f go.mod ]] || { echo "go.mod missing"; return 1; }
  go build ./... && go vet ./... && go test ./...
}

ticked() { grep -qE "^## \[x\] Task $1:" TASKS.md; }

task_spec() {  # the task's section from TASKS.md
  awk -v n="$1" '$0 ~ "^## \\[.\\] Task " n ":" {p=1} p && /^---/ {exit} p' TASKS.md
}

# Prints the reviewer's verdict line: "APPROVE" or "REJECT: ...".
review() {  # n logfile
  git add -A -N .                       # make new files show up in the diff
  local diff; diff="$(git diff HEAD -- . ':!TASKS.md' | head -n 1500)"
  local prompt="You are reviewing work done by a junior developer on one task.

TASK SPEC:
$(task_spec "$1")

DIFF:
$diff

The build, vet and tests already pass. Check that the diff fulfills the task spec exactly,
follows CLAUDE.md, has no obvious bugs, and does not change things outside the task.
You may read files in the repo for context. Do not edit anything.
Be pragmatic: reject only for real problems, not style preferences.

The LAST line of your answer must be exactly one of:
APPROVE
REJECT: <short, concrete list of what to fix>"
  cloud_claude -p "$prompt" "${ISOLATE[@]}" --allowedTools "$REVIEW_TOOLS" --max-turns 15 >"$2" 2>&1
  grep -E '^(APPROVE|REJECT:)' "$2" | tail -n 1
}

# --- main loop ---------------------------------------------------------------

while true; do
  line="$(grep -m1 -E '^## \[ \] Task [0-9]+' TASKS.md || true)"
  [[ -n "$line" ]] || { log "All tasks done."; exit 0; }

  n="$(sed -E 's/^## \[ \] Task ([0-9]+).*/\1/' <<<"$line")"
  title="$(sed -E 's/^## \[ \] Task [0-9]+: *//' <<<"$line")"
  (( n <= UNTIL )) || { log "Reached task limit ($UNTIL). Next is Task $n: $title"; exit 0; }

  prompt="Do Task $n in TASKS.md, following the rules in CLAUDE.md. Only Task $n."
  done_by=""

  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    logfile="$LOG_DIR/task-$n-local-$attempt.log"
    log "Task $n ($title) | local attempt $attempt/$MAX_ATTEMPTS"
    start=$(date +%s)
    run_local "$prompt" "$logfile"
    log "  local session ended (exit $?) after $(( ($(date +%s) - start) / 60 )) min"

    check_out="$(verify 2>&1)"; check_rc=$?
    if (( check_rc != 0 )) || ! ticked "$n"; then
      log "  not done (build/tests rc=$check_rc, ticked=$(ticked "$n" && echo yes || echo no))"
      prompt="Continue Task $n in TASKS.md, following the rules in CLAUDE.md. Only Task $n.
The code for Task $n is partly written but not finished. You are the only one working on it;
do not look for or contact other sessions. Current output of go build/vet/test:
$(tail -n 40 <<<"$check_out")
Fix the problems, make sure everything passes, then tick Task $n in TASKS.md."
      continue
    fi

    if [[ "$REVIEW" != "1" ]]; then done_by="local"; break; fi

    log "  checks pass, asking $CLOUD_MODEL to review"
    verdict="$(review "$n" "$LOG_DIR/task-$n-review-$attempt.log")"
    log "  review: ${verdict:-<no verdict line, see log>}"
    if [[ "$verdict" == APPROVE ]]; then done_by="local"; break; fi

    prompt="Continue Task $n in TASKS.md, following the rules in CLAUDE.md. Only Task $n.
The build and tests pass, but a code review asked for these changes:
${verdict#REJECT: }
Make exactly these changes, keep everything passing, and keep Task $n ticked in TASKS.md."
  done

  if [[ -z "$done_by" && "$ESCALATE" == "1" ]]; then
    log "Task $n | local model gave up, escalating to $CLOUD_MODEL"
    run_cloud "$prompt" "$LOG_DIR/task-$n-cloud.log"
    if verify >/dev/null 2>&1 && ticked "$n"; then done_by="$CLOUD_MODEL"; fi
  fi

  if [[ -z "$done_by" ]]; then
    log "Task $n failed. Changes left uncommitted for you to inspect:"
    git status --short >&2
    exit 1
  fi

  git add -A
  git commit -q -m "Task $n: $title ($done_by)"
  log "Committed Task $n ($done_by)."
done
