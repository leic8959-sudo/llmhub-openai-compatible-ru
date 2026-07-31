# Use an OpenAI-compatible API with Codex CLI

This guide connects Codex CLI to the LLMHub OpenAI-compatible endpoint. It
uses the Responses API, so choose a model that supports `/v1/responses`.

[Create an account and get $0.50 in API credit](https://llmhub.vip/sign-up?utm_source=github&utm_medium=guide&utm_campaign=github-codex-guide) | [pricing](https://llmhub.vip/pricing) | [model catalog](https://llmhub.vip/models)

## 1. Verify the key and model

Create an API key in the [LLMHub dashboard](https://llmhub.vip/keys), then list
the models available to that key:

```bash
curl https://llmhub.vip/v1/models \
  -H "Authorization: Bearer $LLMHUB_API_KEY"
```

Use an exact model ID returned by this request. A model appearing on a public
catalog page does not guarantee that it is enabled for every account or API
protocol.

## 2. Add an LLMHub provider

Open the Codex configuration file (`~/.codex/config.toml` on Linux and macOS,
or `%USERPROFILE%\.codex\config.toml` on Windows) and add:

```toml
model = "<model-id-from-v1-models>"
model_provider = "llmhub"

[model_providers.llmhub]
name = "LLMHub"
base_url = "https://llmhub.vip/v1"
env_key = "LLMHUB_API_KEY"
wire_api = "responses"
requires_openai_auth = false
```

Keep the API key outside the file. In PowerShell:

```powershell
$env:LLMHUB_API_KEY = "<api-key>"
codex --strict-config
```

On Linux or macOS:

```bash
export LLMHUB_API_KEY="<api-key>"
codex --strict-config
```

`--strict-config` makes Codex report unrecognized configuration fields instead
of silently ignoring them.

## 3. Check the Responses endpoint directly

If `/v1/models` succeeds but Codex fails, test the protocol Codex uses:

```bash
curl https://llmhub.vip/v1/responses \
  -H "Authorization: Bearer $LLMHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"<model-id-from-v1-models>","input":"Reply with: connected","stream":false}'
```

An HTTP 200 here separates provider or model routing problems from Codex
configuration problems. If only `/v1/chat/completions` works for the selected
model, choose a Responses-compatible model for Codex.

## Common failures

| Result | What to check |
| --- | --- |
| `401` | The key is missing, malformed, expired, or from another service. |
| `404` | Keep `base_url` at `https://llmhub.vip/v1`; do not append `/responses`. |
| `429` | Check balance and rate limits before retrying. |
| `5xx` or no available channel | Test another model returned by `/v1/models` and report the request time and model ID. |

Do not publish API keys in issues, screenshots, terminal recordings, or shell
history.
