$ErrorActionPreference = "Stop"

$required = @("LLMHUB_BASE_URL", "LLMHUB_API_KEY", "LLMHUB_MODEL")
foreach ($name in $required) {
    $value = (Get-Item "Env:$name" -ErrorAction SilentlyContinue).Value
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Set $name before running this example."
    }
}

$body = @{
    model = $env:LLMHUB_MODEL
    messages = @(
        @{ role = "user"; content = "Объясни в одном абзаце, зачем API нужен таймаут." }
    )
    temperature = 0.2
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
    -Uri ("{0}/chat/completions" -f $env:LLMHUB_BASE_URL.TrimEnd("/")) `
    -Method Post `
    -Headers @{ Authorization = "Bearer $env:LLMHUB_API_KEY" } `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json -Depth 10
