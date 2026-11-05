# Claude Code with local models

An experiment from the local AI faggruppe: can a model running on our own hardware drive Claude Code
well enough to build a small app from scratch, and what does it take to get there?

The app itself, **gitstat**, is deliberately small: a terminal UI (Go + Bubble Tea) that scans a folder
for git repositories and shows branch, changes, ahead/behind and last commit age for each one.
The interesting part is not the app but the setup around it: the task breakdown, the scripts,
and everything we learned along the way.

## What's in the repo

| File | What it is |
|---|---|
| `CLAUDE.md` | Project rules. Claude Code reads this automatically every session: fixed stack, one task at a time, run build/vet/test, tick the task, stop. |
| `TASKS.md` | The app split into 11 small tasks, each with exact signatures and a check the model can run itself. |
| `run-tasks.sh` | Runs the tasks one by one, each in a fresh headless Claude Code session. Verifies, gets an Opus review, escalates to Opus on failure, commits. |
| `claude-lmstudio.sh` | Launcher for a model in LM Studio on your own machine (or another host). |
| `claude-ollama.sh` | Launcher for Ollama on another machine, e.g. the DGX Spark. |
| `claude-strata.sh` | Launcher for a local Strata server. |

## Quick start

Requirements: Claude Code, Go 1.22+, git, and one of the backends below with a model loaded.
On macOS, also `brew install coreutils` so `run-tasks.sh` can put a time limit on each task.

```bash
git clone <this repo> gitstat && cd gitstat
chmod +x *.sh

# 1. Check that the launcher works and that Claude Code sees the right context window
LMS_MODEL=<model-id> LMS_CTX=131072 ./claude-lmstudio.sh
#    in Claude Code: /context  → total should match LMS_CTX, not 200k. Then /exit

# 2. Run the tasks that have good tests unattended
./run-tasks.sh 5

# 3. Look at the result, then do the TUI tasks one at a time and check each by eye
go run . ~/dev
./run-tasks.sh 6
```

Pick the backend with `CLAUDE_LAUNCHER`:

```bash
CLAUDE_LAUNCHER=./claude-ollama.sh SPARK_HOST=<spark> ./run-tasks.sh 5
CLAUDE_LAUNCHER=./claude-strata.sh STRATA_CTX=<ctx> ./run-tasks.sh 5
```

Afterwards, `git log --oneline` shows each task tagged `(local)` or `(opus)`, which is the simplest way
to compare models and settings.

## How the pieces fit together

### Claude Code against a local model

Claude Code talks to anything that speaks the Anthropic Messages API (`/v1/messages`).
LM Studio (0.4.1+), Ollama (0.14+) and Strata all do, so no proxy is needed. The launchers set:

- `ANTHROPIC_BASE_URL`: the server, **without** `/v1` (Claude Code adds `/v1/messages` itself).
- `ANTHROPIC_AUTH_TOKEN`: a placeholder; local servers ignore it.
- `ANTHROPIC_MODEL` and `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL`: all set to the local model.
  Claude Code asks for different tiers internally, and without these mappings the local server
  gets requests for Claude model names it doesn't have.
- `CLAUDE_CODE_MAX_CONTEXT_TOKENS`: the context the model is actually served with (see below).
- `API_TIMEOUT_MS`: raised to 60 minutes (default is 10).
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` and `CLAUDE_CODE_ATTRIBUTION_HEADER=0`.

### Small tasks, fresh sessions

Local models do much better with small, precise tasks than with "build the whole app".
Each task in `TASKS.md` touches a few files, gives exact function signatures, spells out
anything the model could misread (for example sample `git status --porcelain=v2` output with the
expected result), and ends with a check the model can run itself.

`run-tasks.sh` runs every task in a **new** headless session (`claude -p`), so the context starts
small every time. The model may only read/edit files and run `go`, `gofmt`, `mkdir` and `ls`;
the script does all the git work.

### Local model implements, Opus reviews

| Step | Who |
|---|---|
| Implement the task | Local model |
| Build, vet, test, check the task is ticked | The script |
| Review the diff against the task spec (`APPROVE` / `REJECT: …`) | Opus (read-only) |
| Fix review comments | Local model, new session (up to 3 attempts in total) |
| Finish a task the local model couldn't | Opus (escalation) |
| Commit, tagged `(local)` or `(opus)` | The script |

Opus is only called once the tests pass, so we don't pay for reviewing broken code.
`REVIEW=0` and `ESCALATE=0` turn the cloud parts off. With either on, the task spec and the code
are sent to Anthropic, so the run is no longer fully local.

## Lessons learned

These are the things that actually cost us time, roughly in the order we hit them.

**Timeouts.** Claude Code's default request timeout is 10 minutes. A local model processing a large
prompt and writing a whole file can take longer, and Claude Code then retries, sending the whole
request again, while LM Studio is still working on the first one. Symptom: `API error · Retrying in 0s ·
attempt 3/9` while the model is clearly busy. Fix: `API_TIMEOUT_MS`.

**Reasoning settings.** This was the biggest single cause of slowness. With reasoning effort on
*Extra High*, the model thinks at length before every step, and an agent loop has dozens of steps per
task. In LM Studio's model settings, *Preserve Thinking* is even worse: it keeps all earlier reasoning
in the context. Task 2 took over two hours with a dense 27B model on extra high. Use **low or medium
effort and Preserve Thinking off**, set in the model's defaults (My Models → gear), not just the chat
sidebar. The planning is already in `TASKS.md`; the local model's job is to follow it quickly.
Lower effort is faster, but reviews fail more often; that's the trade-off.

**Context window.** Claude Code doesn't recognize local model IDs and assumes 200k context.
It then never compacts, the server silently truncates the conversation, and the model loses its
instructions and starts going in circles. Set `CLAUDE_CODE_MAX_CONTEXT_TOKENS` to the real
context, and check with `/context`. Claude Code's system prompt and tool definitions use a large part
of a 65k window on their own, so 128k is more comfortable. Compaction on a local model is slow too
(an extra model call plus reprocessing the prompt), which is another reason to keep tasks small.
`--strict-mcp-config` keeps globally configured MCP servers out of the headless runs.

**Memory on a 64 GB Mac.** By default the GPU can use about 75% of RAM (~48 GB), shared by the weights
and the KV cache. A Q8 KV cache plus flash attention roughly halves the cache, but MLX
vision-language models (run through mlx-vlm) don't support KV cache quantization yet
(`The mlx-vlm batched vision path does not support KV cache quantization yet`). Use the GGUF build
or a text-only MLX build instead. More context than ~128k isn't worth it for this kind of work: prompts
get slower, and local models follow instructions less well in very long contexts.

**Speed.** Generation is limited by memory bandwidth, not compute, which is why the CPU is idle while
the model works on the GPU. What helps: MoE models with few active parameters (e.g. an A3B model),
MLX builds on Apple Silicon, smaller quantizations, and speculative decoding with a small draft model.

**Cross-session messaging.** Recent Claude Code versions let sessions find and message each other.
A retry prompt that mentioned "a previous attempt" made the local model spend its time looking for
that session. `run-tasks.sh` now disables `ListAgents`/`SendMessage` and refuses inbound messages
for headless runs, and the prompts no longer hint at other sessions.

**Tests decide, not the model.** Passing tests caught most problems, but not visual ones.
Opus, during escalation on the colors task, put lipgloss-styled strings into `bubbles/table` cells.
The table truncates by counting bytes, including the invisible ANSI codes, so the Changes column
ended up as `…d` and `…1h`. Nobody reviews Opus's escalation work, and nothing tested the rendered
output. The task is now split in two, uses `lipgloss/table` (ANSI-aware), and has a test that renders
`View()`, strips ANSI and checks what would actually be on screen. Tasks 6–11 still deserve a human look.

**Spec bugs become model loops.** Two small ambiguities in the first version of Task 2 (parsing
`-1` with `strconv.Atoi`, and an example string that didn't match the rule) were enough to send a model
in circles. If a task fails repeatedly, read the failure before blaming the model.

**Commit the scaffolding first.** `git clean -fd` deletes every untracked file, including
`CLAUDE.md`, `TASKS.md` and the scripts if they were never committed. `run-tasks.sh` refuses to start on
a dirty tree for the same reason.

## Backends

| | LM Studio | Ollama on the DGX Spark | Strata |
|---|---|---|---|
| Launcher | `claude-lmstudio.sh` | `claude-ollama.sh` | `claude-strata.sh` |
| Where | Your machine (or `LMS_HOST`) | Over the network | Your machine |
| Context set by | `LMS_CTX` when loading | `OLLAMA_CONTEXT_LENGTH` on the server | Strata's config; set `STRATA_CTX` to match |
| Notes | Easiest. Script starts the server and loads the model. | Needs `OLLAMA_HOST=0.0.0.0` and `OLLAMA_KEEP_ALIVE=-1` on the Spark, otherwise the model unloads while Opus reviews. | Runs much bigger MoE models than fit in memory by streaming experts from SSD. New and experimental. |

Ollama settings on the Spark (`sudo systemctl edit ollama`, then restart):

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_CONTEXT_LENGTH=131072"
Environment="OLLAMA_KEEP_ALIVE=-1"
Environment="OLLAMA_FLASH_ATTENTION=1"
```

## Results so far

Runs from autumn 2026, with the 10-task version of `TASKS.md` (Task 10 was then a single colors task)
and the scripts as they were at the time. The tasks and scripts were made with Opus 5.5 in Claude.
Mac = 64 GB MacBook Pro; Spark = DGX Spark. Times are minutes per task, in task order.

| # | Backend | Model | Context (k) | Reasoning | Minutes per task | Outcome |
|---|---|---|---|---|---|---|
| 1 | Mac, LM Studio | qwen/qwen3.8-27b | 65 (Claude Code assumed 200) | Extra high | 28 / 120+ / 18 / 18 / 14 / 50 / 27 / 43 / 180 / 600 | Finished, no bugs. 2 attempts on task 6, 3 on task 9, local model gave up on task 10. |
| 2 | Mac, LM Studio | qwen/qwen3.8-27b | 65 | Extra high | 19 / 900 | Stopped after task 2 had run for 15 hours. |
| 3 | Mac, LM Studio | qwen/qwen3.8-27b | 130 | Extra high | 2 / 221 / 97 / 87 / 110 / 216 / 24 | Stopped after task 7. 3 attempts on task 6, 2 on task 7. |
| 4 | Mac, LM Studio | qwen/qwen3.8-27b | 196 | Medium | 2 / 26 / 3 / 4 / 12 / 39 / 206 / 7 / ? / 9 | Finished, with a bug in the Changes column (see Lessons learned). 2 attempts on task 4 after Opus review, 3 on task 7, local model gave up on task 9. |
| 5 | Spark, Ollama | gpt-oss-120b | 131 | ? | 5 / 10 / 29 / ? / ? | Stopped after task 5. Local model gave up on tasks 4 and 5; the first handover to Opus failed and needed a restart. btop showed little activity. |
| 6 | Mac, Strata | Qwen3.8-Flash-Next (IQ3_S) | 128 | ? | 2 / 10 / 6 / 2 / 9 / 64 / 18+4 / – | Tasks 1–5 without problems (one review rejection on task 4). In progress. |

The first five tasks (no TUI, good tests) are the fairest comparison across runs:

| Run | Tasks 1–5, total minutes |
|---|---|
| 1: Qwen 27B, extra high, 65k | 198 |
| 3: Qwen 27B, extra high, 130k | 517 |
| 4: Qwen 27B, medium, 196k | 47 |
| 5: gpt-oss-120b on the Spark (tasks 1–3 only) | 44 |
| 6: Qwen3.8-Flash-Next via Strata | 29 |

What we take from this so far:

- **Reasoning effort matters most.** Every extra-high run was slow or stalled, and the run times
  vary wildly between identical setups (runs 1 and 2). Medium made tasks 1–5 four times faster
  than the best extra-high run.
- **The TUI tasks are the real limit,** not context size. Even run 4 with 196k context needed several
  attempts or Opus on tasks 7–10, while tasks 1–5 went smoothly. This is why Task 10 is now split
  in two and has a rendering test.
- **Strata's 125B MoE is the most promising so far:** the fastest on tasks 1–5, on the same laptop.
- **The Spark run is probably not a verdict on gpt-oss-120b.** Little GPU activity and a failed
  handover suggest a setup problem (model unloading, context, or the script). Check `ollama ps`
  and `journalctl -u ollama -f` during a task before the next attempt.
- Single runs on a shared, changing setup: treat the numbers as indications, not benchmarks.

## Models we've tried or want to try

- **Qwen3.8-27B (dense)** on a 64 GB Mac via LM Studio. Runs 1–4 above.
- **Swift 1.5 (Qwen3.8-27B fine-tune)**: trained to think less; claimed to be faster with little
  quality loss. Note its custom license (free under $1M revenue). Worth comparing against the base model
  *on low or medium effort*, not just against extra high. Not tested yet.
- **gpt-oss-120b** on the DGX Spark via Ollama. Run 5; worth another try once the setup is checked.
- **Qwen3.8-Flash-Next (125B MoE)** via Strata. Run 6, with the IQ3_S pack. On 64 GB, the Q2_0 pack
  fits in memory; IQ3 packs stream from SSD and are slower but higher quality. Q2_0 is still to be tested.

## How to compare runs

Start each run from the same commit with all tasks unticked, change one thing at a time
(model, quantization, effort, context), and note the backend settings in the commit message or a
small table. For each run, record:

- Total time and time per task (the commit timestamps in `git log`)
- How many tasks were `(local)` vs `(opus)`, and how many review rejections
  (`logs/task-*-review-*.log`; `logs/` is gitignored)
- Whether the finished app actually works: `go run . ~/dev`
