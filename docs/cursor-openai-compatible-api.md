# Use an OpenAI-compatible API with Cursor

Cursor can use an OpenAI-compatible provider when the installed version offers
an OpenAI API key field and a custom or overridden OpenAI base URL.

[Create an account and get $0.50 in API credit](https://llmhub.vip/sign-up?utm_source=github&utm_medium=guide&utm_campaign=github-cursor-guide) | [pricing](https://llmhub.vip/pricing) | [model catalog](https://llmhub.vip/models)

## 1. Verify access before changing Cursor

Create an API key in the [LLMHub dashboard](https://llmhub.vip/keys), then run:

```bash
curl https://llmhub.vip/v1/models \
  -H "Authorization: Bearer $LLMHUB_API_KEY"
```

Copy an exact model ID from the response. Do not guess the ID from a marketing
name.

## 2. Configure Cursor

In Cursor settings, search for the OpenAI API key and OpenAI base URL settings.
Use these values:

| Setting | Value |
| --- | --- |
| OpenAI API key | Your LLMHub API key |
| OpenAI base URL | `https://llmhub.vip/v1` |
| Model | An exact ID returned by `GET /v1/models` |

The wording and location of these controls can change between Cursor releases.
If your version does not expose a custom OpenAI base URL, it cannot be pointed
at LLMHub through that settings screen. Do not enter the LLMHub key into a
provider field that always sends requests to another domain.

## 3. Test the same request outside Cursor

Use the same key and model to isolate editor configuration from API routing:

```bash
curl https://llmhub.vip/v1/chat/completions \
  -H "Authorization: Bearer $LLMHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"<model-id-from-v1-models>","messages":[{"role":"user","content":"Reply with: connected"}],"stream":false}'
```

If this succeeds and Cursor fails, recheck the base URL, model ID, and whether
Cursor is using its built-in model instead of the custom OpenAI provider.

## Common failures

| Result | What to check |
| --- | --- |
| `401` | Re-enter the key and make sure no spaces or quotes were saved with it. |
| `404` | The base URL must end at `/v1`, not `/chat/completions`. |
| `429` | Check balance and rate limits; avoid immediate repeated retries. |
| Model unavailable | Select another exact model returned for the same key. |

Never paste an API key into a public issue or screenshot.
