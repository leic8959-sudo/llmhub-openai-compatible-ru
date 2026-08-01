# LLMHub: OpenAI-compatible API starter for Codex, Cursor, Python, and Node.js

Use an OpenAI-compatible API endpoint with your existing client. This starter
gets you from signup to a first request in about 60 seconds using `curl`,
PowerShell, Python, Node.js, or Codex.

Russian version: [README.md](README.md)

## Integration guides

- [Codex CLI with an OpenAI-compatible API](docs/codex-openai-compatible-api.md)
- [Cursor with an OpenAI-compatible API](docs/cursor-openai-compatible-api.md)
- [OpenAI-compatible API in Python](docs/python-openai-compatible-api.md)
- [Troubleshoot 400, 401, 404, 429, and 5xx errors](docs/openai-compatible-api-troubleshooting.md)

## Weekly model radar

The [latest automated report](reports/latest.md) is rebuilt from LLMHub's
public catalog every Monday. It lists available models, minimum prices across
enabled groups, supported API protocols, and clearly qualified recent request
signals. A machine-readable snapshot is available at
[`data/model-radar.json`](data/model-radar.json).

## First request in 60 seconds

[Create an account and get $0.50 in free API credit](https://llmhub.vip/sign-up?utm_source=github&utm_medium=readme&utm_campaign=integration-kit-en) · [model catalog](https://llmhub.vip/pricing) · [documentation](https://llmhub.vip/docs)

After signup, create an API key in the [dashboard](https://llmhub.vip/keys),
list available models with `GET /v1/models`, and run one of the examples below.
No client replacement is required: the endpoint uses the familiar
OpenAI-compatible format.

## Quick start

1. [Create an account](https://llmhub.vip/sign-up?utm_source=github&utm_medium=readme&utm_campaign=integration-kit-en) and open [API Keys](https://llmhub.vip/keys).
2. Create an API key and choose a model returned by `GET /v1/models`.
3. Copy `.env.example` to `.env` and fill it locally.
4. Run an example.

PowerShell:

```powershell
$env:LLMHUB_BASE_URL = "https://llmhub.vip/v1"
$env:LLMHUB_API_KEY = "<api-key>"
$env:LLMHUB_MODEL = "<model-id-from-dashboard>"
.\examples\request.ps1
```

Linux/macOS:

```bash
export LLMHUB_BASE_URL="https://llmhub.vip/v1"
export LLMHUB_API_KEY="<api-key>"
export LLMHUB_MODEL="<model-id-from-dashboard>"
bash examples/request.sh
```

Python 3.10+:

```bash
python examples/chat_completion.py
```

Node.js 18+:

```bash
node examples/chat_completion.mjs
```

## Compatible request

List models before the first request:

```bash
curl https://llmhub.vip/v1/models \
  -H "Authorization: Bearer $LLMHUB_API_KEY"
```

```json
{
  "model": "<model-id-from-dashboard>",
  "messages": [
    {"role": "user", "content": "Check the API connection."}
  ],
  "temperature": 0.2
}
```

OpenAI compatibility does not mean that every model supports the same
parameters. Check streaming, tool calls, JSON responses, context limits,
`usage`, and transient errors before production use.

## Links

- [Documentation](https://llmhub.vip/docs)
- [Model catalog](https://llmhub.vip/models)
- [Pricing](https://llmhub.vip/pricing)
- [LLMHub](https://llmhub.vip/)

LLMHub operates the API endpoint used in these examples. This starter is not
an official SDK for OpenAI, Anthropic, or Google and does not claim affiliation
with those companies.

## License

Example code is available under the MIT license. See [LICENSE](LICENSE).
