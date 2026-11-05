#!/usr/bin/env bash
# Run Claude Code against a local LM Studio model.
#
# Usage:
#   ./claude-lmstudio.sh [claude args...]
#   LMS_MODEL=qwen/qwen3-coder-30b LMS_CTX=65536 ./claude-lmstudio.sh
#   LMS_HOST=spark.local ./claude-lmstudio.sh      # remote LM Studio, no local lms management
#
# Env overrides:
#   LMS_MODEL  model identifier as shown by `lms ls`   (default: qwen/qwen3-coder-30b)
#   LMS_CTX    context length to load with, and the window Claude Code assumes (default: 65536)
#              With LMS_HOST set, make this match the context the remote model was loaded with.
#   LMS_HOST   LM Studio host                          (default: localhost)
#   LMS_PORT   LM Studio port                          (default: 1234)
#   LMS_TOKEN  API token if "Require Authentication" is on (default: lmstudio)

set -euo pipefail

MODEL="${LMS_MODEL:-qwen/qwen3-coder-30b}"
CTX="${LMS_CTX:-65536}"
HOST="${LMS_HOST:-localhost}"
PORT="${LMS_PORT:-1234}"
TOKEN="${LMS_TOKEN:-lmstudio}"
BASE_URL="http://${HOST}:${PORT}"

log() { printf '\033[1;34m[claude-lmstudio]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[claude-lmstudio]\033[0m %s\n' "$*" >&2; exit 1; }

command -v claude >/dev/null || die "claude CLI not found in PATH"
command -v curl   >/dev/null || die "curl not found in PATH"

server_up() {
  curl -fsS -m 3 -H "x-api-key: ${TOKEN}" "${BASE_URL}/v1/models" >/dev/null 2>&1
}

is_local() { [[ "$HOST" == "localhost" || "$HOST" == "127.0.0.1" ]]; }

if is_local; then
  command -v lms >/dev/null || die "lms CLI not found (LM Studio -> Settings -> install CLI, or ~/.lmstudio/bin)"

  if ! server_up; then
    log "Starting LM Studio server on port ${PORT}..."
    lms server start --port "$PORT" >/dev/null
    for _ in {1..20}; do server_up && break; sleep 0.5; done
    server_up || die "Server did not come up on ${BASE_URL}"
  fi

  if lms ps 2>/dev/null | grep -qF "$MODEL"; then
    log "Model already loaded: ${MODEL} (context length not changed; 'lms unload --all' to reload)"
  else
    log "Loading ${MODEL} with context length ${CTX}..."
    lms load "$MODEL" --context-length "$CTX" -y \
      || die "Failed to load ${MODEL}. Check the identifier with 'lms ls'."
  fi
else
  server_up || die "No LM Studio server reachable at ${BASE_URL}"
  log "Using remote LM Studio at ${BASE_URL} (model must already be loaded there)"
fi

export ANTHROPIC_BASE_URL="$BASE_URL"
export ANTHROPIC_AUTH_TOKEN="$TOKEN"
export CLAUDE_CODE_ATTRIBUTION_HEADER=0
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
# Claude Code doesn't know local model IDs and assumes 200k context; tell it the real window
# so auto-compaction happens before LM Studio's loaded context overflows.
export CLAUDE_CODE_MAX_CONTEXT_TOKENS="${CLAUDE_CODE_MAX_CONTEXT_TOKENS:-$CTX}"
export API_TIMEOUT_MS="${API_TIMEOUT_MS:-3600000}"   # 60 min per request; local models are slow
export ANTHROPIC_MODEL="$MODEL"
export ANTHROPIC_DEFAULT_OPUS_MODEL="$MODEL"
export ANTHROPIC_DEFAULT_SONNET_MODEL="$MODEL"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="$MODEL"
unset ANTHROPIC_API_KEY   # avoid conflicts with a real key in your shell

log "Launching Claude Code -> ${BASE_URL} (${MODEL})"
exec claude "$@"
