# OpenAI-compatible API in Python

You can keep the official OpenAI Python client and change the API key, base URL,
and model ID. This example sends one non-streaming chat completion to LLMHub.

[Create an account and get $0.50 in API credit](https://llmhub.vip/sign-up?utm_source=github&utm_medium=guide&utm_campaign=github-python-guide) | [pricing](https://llmhub.vip/pricing) | [model catalog](https://llmhub.vip/models)

## Install and configure

```bash
python -m pip install --upgrade openai
```

Set credentials in the shell rather than in source code:

```bash
export LLMHUB_API_KEY="<api-key>"
export LLMHUB_MODEL="<model-id-from-v1-models>"
```

PowerShell equivalents:

```powershell
$env:LLMHUB_API_KEY = "<api-key>"
$env:LLMHUB_MODEL = "<model-id-from-v1-models>"
```

List the models available to this key before the first paid request:

```bash
curl https://llmhub.vip/v1/models \
  -H "Authorization: Bearer $LLMHUB_API_KEY"
```

## Send one request

```python
import os

from openai import OpenAI


client = OpenAI(
    api_key=os.environ["LLMHUB_API_KEY"],
    base_url="https://llmhub.vip/v1",
)

response = client.chat.completions.create(
    model=os.environ["LLMHUB_MODEL"],
    messages=[
        {"role": "user", "content": "Reply with: connected"},
    ],
    stream=False,
)

print(response.choices[0].message.content)
print(response.usage)
```

The base URL ends at `/v1`; the SDK appends `/chat/completions`. Keep
`stream=False` for the first test so HTTP and JSON errors are easy to inspect.

For a dependency-free Python example based on the standard library, see
[`examples/chat_completion.py`](../examples/chat_completion.py).

## Production checks

- Set a request timeout appropriate for your application.
- Retry only transient failures and use a bounded backoff.
- Record the model ID, HTTP status, request time, and returned `usage`.
- Verify streaming, tool calls, JSON output, and context limits separately for
  every model used in production.
- Never log or commit the API key.

See the [HTTP troubleshooting guide](openai-compatible-api-troubleshooting.md)
for `400`, `401`, `404`, `429`, and `5xx` errors.
