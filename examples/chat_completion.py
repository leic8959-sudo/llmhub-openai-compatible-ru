import json
import os
import sys
import urllib.error
import urllib.request


def required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Set {name} before running this example.")
    return value


base_url = required("LLMHUB_BASE_URL").rstrip("/")
api_key = required("LLMHUB_API_KEY")
model = required("LLMHUB_MODEL")

payload = {
    "model": model,
    "messages": [
        {
            "role": "user",
            "content": "Объясни в одном абзаце, зачем API нужен таймаут.",
        }
    ],
    "temperature": 0.2,
}

request = urllib.request.Request(
    f"{base_url}/chat/completions",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(request, timeout=60) as response:
        result = json.load(response)
except urllib.error.HTTPError as error:
    details = error.read().decode("utf-8", errors="replace")
    print(f"API returned HTTP {error.code}: {details}", file=sys.stderr)
    raise SystemExit(1) from error
except urllib.error.URLError as error:
    print(f"Connection failed: {error.reason}", file=sys.stderr)
    raise SystemExit(1) from error

message = result.get("choices", [{}])[0].get("message", {})
print(message.get("content", ""))
print(json.dumps({"usage": result.get("usage")}, ensure_ascii=False))
