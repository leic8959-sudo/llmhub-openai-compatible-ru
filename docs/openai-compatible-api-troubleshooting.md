# OpenAI-compatible API troubleshooting: 400, 401, 404, 429, and 5xx

Use this checklist when an OpenAI-compatible client fails against LLMHub. Test
authentication, model access, and the actual request protocol separately.

[Create an account and get $0.50 in API credit](https://llmhub.vip/sign-up?utm_source=github&utm_medium=guide&utm_campaign=github-troubleshooting-guide) | [API keys](https://llmhub.vip/keys) | [pricing](https://llmhub.vip/pricing)

## 1. Confirm the endpoint and authentication

```bash
curl --fail-with-body https://llmhub.vip/v1/models \
  -H "Authorization: Bearer $LLMHUB_API_KEY"
```

Expected result: HTTP 200 and a JSON model list. Choose an exact ID from that
response. This check does not prove that every listed model supports every API
protocol.

PowerShell:

```powershell
Invoke-RestMethod `
  -Uri "https://llmhub.vip/v1/models" `
  -Headers @{ Authorization = "Bearer $env:LLMHUB_API_KEY" }
```

## 2. Test the protocol your client uses

Chat Completions:

```bash
curl --fail-with-body https://llmhub.vip/v1/chat/completions \
  -H "Authorization: Bearer $LLMHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"<model-id>","messages":[{"role":"user","content":"Reply with: connected"}],"stream":false}'
```

Responses API, used by Codex-style integrations:

```bash
curl --fail-with-body https://llmhub.vip/v1/responses \
  -H "Authorization: Bearer $LLMHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"<model-id>","input":"Reply with: connected","stream":false}'
```

A model may work on one protocol and fail on another. Match the direct test to
the endpoint used by the application.

## 3. Interpret the HTTP status

| Status | Likely cause | Next check |
| --- | --- | --- |
| `400` | Invalid JSON or unsupported parameter | Start with the minimal bodies above; remove tools, response formats, and optional parameters. |
| `401` | Missing or invalid bearer token | Verify the `Authorization: Bearer ...` header and create a new key if needed. |
| `403` | Account, model, or policy restriction | Check account status and test another model available to the same key. |
| `404` | Wrong host or path | Use `https://llmhub.vip/v1` as the SDK base URL; append only the endpoint path once. |
| `429` | Rate limit or insufficient balance | Check balance and limits, then retry with bounded exponential backoff. |
| `500`-`599` | Upstream or routing failure | Record the time, model, endpoint, status, and response body; test one fallback model. |

## 4. Check common configuration mistakes

- Base URL contains `/v1/v1` or includes the final endpoint twice.
- The model is a display name instead of an exact API model ID.
- A Chat Completions-only model is sent to `/v1/responses`, or the reverse.
- The application still targets `https://api.openai.com/v1` instead of LLMHub.
- A proxy strips the `Authorization` header or blocks Server-Sent Events.
- Automatic retries create duplicate paid requests.

Do not include the API key when sharing a failure report. Include a redacted
response body, UTC timestamp, endpoint, model ID, status code, and whether
`GET /v1/models` succeeded.
