#!/usr/bin/env bash
set -euo pipefail

: "${LLMHUB_BASE_URL:?Set LLMHUB_BASE_URL first}"
: "${LLMHUB_API_KEY:?Set LLMHUB_API_KEY first}"
: "${LLMHUB_MODEL:?Set LLMHUB_MODEL first}"

curl --fail-with-body --silent --show-error \
  "${LLMHUB_BASE_URL%/}/chat/completions" \
  -H "Authorization: Bearer ${LLMHUB_API_KEY}" \
  -H "Content-Type: application/json" \
  --data @- <<JSON
{
  "model": "${LLMHUB_MODEL}",
  "messages": [
    {"role": "user", "content": "Объясни в одном абзаце, зачем API нужен таймаут."}
  ],
  "temperature": 0.2
}
JSON
