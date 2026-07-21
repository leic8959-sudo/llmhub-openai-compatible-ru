const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Set ${name} before running this example.`);
  }
  return value;
};

const baseUrl = required("LLMHUB_BASE_URL").replace(/\/$/, "");
const apiKey = required("LLMHUB_API_KEY");
const model = required("LLMHUB_MODEL");

const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: "user", content: "Объясни в одном абзаце, зачем API нужен таймаут." },
    ],
    temperature: 0.2,
  }),
});

const body = await response.json();
if (!response.ok) {
  throw new Error(`API returned HTTP ${response.status}: ${JSON.stringify(body)}`);
}

console.log(body.choices?.[0]?.message?.content ?? "");
console.log(JSON.stringify({ usage: body.usage }));
