#!/usr/bin/env bash
# Run Claude Code against a local Strata server (Anthropic-compatible API).
# Start Strata yourself first; this script only checks that it answers.
#
# Usage:
#   ./claude-strata.sh [claude args...]
#   CLAUDE_LAUNCHER=./claude-strata.sh ./run-tasks.sh 5
#
# Env overrides:
#   STRATA_URL    Strata's API URL, with or without /v1  (default: http://127.0.0.1:47831/v1)
#   STRATA_MODEL  model id                               (default: iq3_s)
#   STRATA_CTX    context window Strata serves; Claude Code compacts before this (default: 65536)

set -euo pipefail

URL="${STRATA_URL:-http://127.0.0.1:47831/v1}"
MODEL="${STRATA_MODEL:-iq3_s}"
CTX="${STRATA_CTX:-65536}"

# Claude Code appends /v1/messages itself, so the base URL must not end in /v1.
BASE_URL="${URL%/}"
BASE_URL="${BASE_URL%/v1}"

log() { printf '\033[1;34m[claude-strata]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[claude-strata]\033[0m %s\n' "$*" >&2; exit 1; }

command -v claude >/dev/null || die "claude CLI not found in PATH"
command -v curl   >/dev/null || die "curl not found in PATH"

models="$(curl -fsS -m 5 "${BASE_URL}/v1/models" 2>/dev/null)" \
  || die "No Strata server at ${BASE_URL}. Is it running?"

if ! grep -qF "\"${MODEL}\"" <<<"$models"; then
  log "WARNING: '${MODEL}' not listed by ${BASE_URL}/v1/models. Server reports:"
  printf '%s\n' "$models" >&2
fi

# Quick check that the Anthropic endpoint exists (Claude Code needs /v1/messages, not just the OpenAI API).
code="$(curl -s -o /dev/null -w '%{http_code}' -m 10 "${BASE_URL}/v1/messages" \
  -H 'content-type: application/json' -H 'anthropic-version: 2023-06-01' -H 'x-api-key: strata' \
  -d "{\"model\":\"${MODEL}\",\"max_tokens\":1,\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}" || true)"
[[ "$code" == "404" ]] && die "${BASE_URL}/v1/messages returned 404: Anthropic API not enabled in Strata?"
[[ "$code" == "200" ]] || log "WARNING: test request to /v1/messages returned HTTP ${code}"

export ANTHROPIC_BASE_URL="$BASE_URL"
export ANTHROPIC_AUTH_TOKEN="strata"
export CLAUDE_CODE_ATTRIBUTION_HEADER=0
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export CLAUDE_CODE_MAX_CONTEXT_TOKENS="$CTX"
export API_TIMEOUT_MS="${API_TIMEOUT_MS:-3600000}"
export ANTHROPIC_MODEL="$MODEL"
export ANTHROPIC_DEFAULT_OPUS_MODEL="$MODEL"
export ANTHROPIC_DEFAULT_SONNET_MODEL="$MODEL"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="$MODEL"
unset ANTHROPIC_API_KEY

log "Launching Claude Code -> ${BASE_URL} (${MODEL}, assuming ${CTX} context)"
exec claude "$@"
