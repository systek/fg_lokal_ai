#!/usr/bin/env bash
# Run Claude Code against a model served by Ollama on another machine (e.g. the DGX Spark).
#
# Usage:
#   SPARK_HOST=spark.local ./claude-ollama.sh [claude args...]
#   CLAUDE_LAUNCHER=./claude-ollama.sh ./run-tasks.sh 5
#
# Env overrides:
#   SPARK_HOST     host running Ollama                 (default: spark.local)
#   OLLAMA_PORT    Ollama port                         (default: 11434)
#   OLLAMA_MODEL   model name as shown by `ollama ls`  (default: gpt-oss-120b:latest)
#   OLLAMA_CTX     context window the model is SERVED with on the Spark (default: 131072).
#                  This does not change the server; it tells Claude Code what to assume.

set -euo pipefail

HOST="${SPARK_HOST:-spark.local}"
PORT="${OLLAMA_PORT:-11434}"
MODEL="${OLLAMA_MODEL:-gpt-oss-120b:latest}"
CTX="${OLLAMA_CTX:-131072}"
BASE_URL="http://${HOST}:${PORT}"

log() { printf '\033[1;34m[claude-ollama]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[claude-ollama]\033[0m %s\n' "$*" >&2; exit 1; }

command -v claude >/dev/null || die "claude CLI not found in PATH"
command -v curl   >/dev/null || die "curl not found in PATH"

version_json="$(curl -fsS -m 5 "${BASE_URL}/api/version" 2>/dev/null)" \
  || die "No Ollama at ${BASE_URL}. Is OLLAMA_HOST=0.0.0.0 set on the Spark, and the port open?"
log "Ollama ${version_json} at ${BASE_URL}"

curl -fsS -m 5 "${BASE_URL}/api/tags" | grep -qF "\"${MODEL}\"" \
  || die "Model '${MODEL}' not found on ${HOST}. Check with: curl ${BASE_URL}/api/tags"

# Show the context the model is configured with, if it was set in its Modelfile.
num_ctx="$(curl -fsS -m 10 "${BASE_URL}/api/show" -d "{\"model\":\"${MODEL}\"}" 2>/dev/null \
  | grep -oE 'num_ctx +[0-9]+' | grep -oE '[0-9]+' || true)"
if [[ -n "$num_ctx" && "$num_ctx" != "$CTX" ]]; then
  log "WARNING: ${MODEL} has num_ctx ${num_ctx} in its Modelfile, but OLLAMA_CTX is ${CTX}. Make them match."
elif [[ -z "$num_ctx" ]]; then
  log "No num_ctx in the Modelfile; the server default (OLLAMA_CONTEXT_LENGTH) applies. Make sure it is ${CTX}."
fi

export ANTHROPIC_BASE_URL="$BASE_URL"
export ANTHROPIC_AUTH_TOKEN="ollama"
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
