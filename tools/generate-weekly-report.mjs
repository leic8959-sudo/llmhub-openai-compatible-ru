import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_API_BASE = 'https://llmhub.vip'
const SITE_BASE = 'https://llmhub.vip'

function roundPrice(value) {
  if (!Number.isFinite(value)) return null
  return Number(value.toFixed(6))
}

function minimumEnabledGroupRatio(model, groupRatios) {
  const candidates = (model.enable_groups || [])
    .map((group) => ({ group, ratio: Number(groupRatios[group]) }))
    .filter((entry) => Number.isFinite(entry.ratio) && entry.ratio > 0)
    .sort((left, right) => left.ratio - right.ratio)
  return candidates[0] || { group: 'base', ratio: 1 }
}

export function calculateModelPrices(model, groupRatios) {
  const minimumGroup = minimumEnabledGroupRatio(model, groupRatios)
  if (Number(model.quota_type) === 1) {
    return {
      billing_unit: 'request',
      price_group: minimumGroup.group,
      request_usd: roundPrice(Number(model.model_price || 0) * minimumGroup.ratio),
      input_per_million_usd: null,
      output_per_million_usd: null,
      cached_input_per_million_usd: null,
    }
  }
  if (model.billing_mode === 'tiered_expr' || model.billing_expr) {
    return {
      billing_unit: 'dynamic',
      price_group: minimumGroup.group,
      request_usd: null,
      input_per_million_usd: null,
      output_per_million_usd: null,
      cached_input_per_million_usd: null,
    }
  }

  const input = Number(model.model_ratio || 0) * 2 * minimumGroup.ratio
  const completionRatio = Number(model.completion_ratio || 0)
  const cacheRatio = Number(model.cache_ratio)
  return {
    billing_unit: 'tokens',
    price_group: minimumGroup.group,
    request_usd: null,
    input_per_million_usd: roundPrice(input),
    output_per_million_usd: roundPrice(input * completionRatio),
    cached_input_per_million_usd: Number.isFinite(cacheRatio)
      ? roundPrice(input * cacheRatio)
      : null,
  }
}

function modelURL(modelName) {
  const query = new URLSearchParams({
    utm_source: 'github',
    utm_medium: 'weekly_report',
    utm_campaign: 'model-radar',
  })
  return `${SITE_BASE}/pricing/${encodeURIComponent(modelName)}?${query}`
}

function inferVendor(model, vendorMap) {
  const configured = vendorMap.get(model.vendor_id)
  if (configured) {
    const aliases = { 智谱: 'Zhipu', 讯飞: 'iFlytek' }
    return aliases[configured] || configured
  }
  const value = `${model.icon || ''} ${model.model_name || ''}`.toLowerCase()
  if (value.includes('claude')) return 'Anthropic'
  if (value.includes('gpt') || value.includes('openai')) return 'OpenAI'
  if (value.includes('gemini')) return 'Google'
  if (value.includes('glm') || value.includes('zhipu')) return 'Zhipu'
  if (value.includes('kimi') || value.includes('moonshot')) return 'Moonshot'
  if (value.includes('minimax')) return 'MiniMax'
  if (value.includes('deepseek')) return 'DeepSeek'
  return 'Other'
}

export function buildRadar(pricingResponse, perfResponse, generatedAt) {
  if (!pricingResponse?.success || !Array.isArray(pricingResponse.data)) {
    throw new Error('Pricing endpoint did not return a usable catalog')
  }
  const vendorMap = new Map(
    (pricingResponse.vendors || []).map((vendor) => [vendor.id, vendor.name])
  )
  const perfMap = new Map(
    (perfResponse?.data?.models || []).map((metric) => [
      metric.model_name,
      metric,
    ])
  )
  const groupRatios = pricingResponse.group_ratio || {}
  const models = pricingResponse.data
    .map((model) => {
      const metric = perfMap.get(model.model_name)
      return {
        model_name: model.model_name,
        vendor: inferVendor(model, vendorMap),
        protocols: [...(model.supported_endpoint_types || [])].sort(),
        groups: [...(model.enable_groups || [])].sort(),
        ...calculateModelPrices(model, groupRatios),
        success_rate_7d: Number.isFinite(Number(metric?.success_rate))
          ? Number(metric.success_rate)
          : null,
        average_latency_ms_7d: Number.isFinite(Number(metric?.avg_latency_ms))
          ? Number(metric.avg_latency_ms)
          : null,
        details_url: modelURL(model.model_name),
      }
    })
    .sort(
      (left, right) =>
        left.vendor.localeCompare(right.vendor) ||
        left.model_name.localeCompare(right.model_name)
    )

  return {
    generated_at: generatedAt.toISOString(),
    source: `${SITE_BASE}/api/pricing`,
    pricing_version: pricingResponse.pricing_version || null,
    model_count: models.length,
    vendor_count: new Set(models.map((model) => model.vendor)).size,
    models,
  }
}

function compareRadar(previous, current) {
  if (!previous?.models) {
    return { initial: true, added: [], removed: [], priceChanges: [] }
  }
  const before = new Map(previous.models.map((model) => [model.model_name, model]))
  const after = new Map(current.models.map((model) => [model.model_name, model]))
  const added = [...after.keys()].filter((name) => !before.has(name)).sort()
  const removed = [...before.keys()].filter((name) => !after.has(name)).sort()
  const priceChanges = []
  for (const [name, model] of after) {
    const oldModel = before.get(name)
    if (!oldModel) continue
    const fields = [
      'input_per_million_usd',
      'output_per_million_usd',
      'request_usd',
    ]
    if (fields.some((field) => oldModel[field] !== model[field])) {
      priceChanges.push(name)
    }
  }
  return { initial: false, added, removed, priceChanges: priceChanges.sort() }
}

function formatUSD(value) {
  if (value == null) return '-'
  if (value === 0) return '$0'
  const digits = value < 0.01 ? 6 : value < 1 ? 4 : 2
  return `$${Number(value).toFixed(digits).replace(/\.?0+$/, '')}`
}

function formatPriceCell(model, type) {
  if (model.billing_unit === 'dynamic') return 'dynamic'
  if (model.billing_unit === 'request') {
    return type === 'input' ? `${formatUSD(model.request_usd)}/request` : '-'
  }
  return formatUSD(
    type === 'input'
      ? model.input_per_million_usd
      : model.output_per_million_usd
  )
}

function formatTelemetry(model) {
  if (model.success_rate_7d == null) return 'no samples'
  const latency =
    model.average_latency_ms_7d == null
      ? ''
      : `, ${Math.round(model.average_latency_ms_7d)} ms`
  return `${model.success_rate_7d.toFixed(0)}%${latency}`
}

function markdownModelLink(model) {
  return `[\`${model.model_name}\`](${model.details_url})`
}

function changeList(label, values) {
  if (values.length === 0) return `- ${label}: none`
  return `- ${label}: ${values.map((value) => `\`${value}\``).join(', ')}`
}

function selectHighlights(models) {
  const patterns = [
    /^claude-opus-5$/i,
    /^claude-sonnet-5$/i,
    /^gpt-5\.6-(luna|sol|terra)$/i,
    /^glm-5$/i,
    /^kimi-k2\.7-code$/i,
  ]
  return models.filter((model) =>
    patterns.some((pattern) => pattern.test(model.model_name))
  )
}

export function buildReport(radar, previousRadar) {
  const changes = compareRadar(previousRadar, radar)
  const generatedDate = radar.generated_at.slice(0, 10)
  const highlights = selectHighlights(radar.models)
  const signupURL =
    `${SITE_BASE}/sign-up?utm_source=github&utm_medium=weekly_report` +
    '&utm_campaign=model-radar'
  const lines = [
    `# Еженедельный радар моделей LLMHub — ${generatedDate}`,
    '',
    `Автоматический снимок публичного каталога: **${radar.model_count} моделей** от **${radar.vendor_count} провайдеров**.`,
    '',
    `[Открыть каталог и цены](${SITE_BASE}/pricing?utm_source=github&utm_medium=weekly_report&utm_campaign=model-radar) · [Создать API key](${signupURL}) · [Документация](${SITE_BASE}/docs)`,
    '',
    '## Изменения за неделю',
    '',
  ]

  if (changes.initial) {
    lines.push('- Первый автоматический снимок; сравнение появится после следующего запуска.')
  } else {
    lines.push(changeList('Добавлены', changes.added))
    lines.push(changeList('Удалены', changes.removed))
    lines.push(changeList('Изменились цены', changes.priceChanges))
  }

  lines.push('', '## Модели с высоким поисковым спросом', '')
  lines.push('| Модель | Провайдер | От $/1M input | От $/1M output | API | Сигнал за 7 дней |')
  lines.push('| --- | --- | ---: | ---: | --- | --- |')
  for (const model of highlights) {
    lines.push(
      `| ${markdownModelLink(model)} | ${model.vendor} | ${formatPriceCell(model, 'input')} | ${formatPriceCell(model, 'output')} | ${model.protocols.join(', ') || '-'} | ${formatTelemetry(model)} |`
    )
  }

  lines.push('', '## Полный каталог', '')
  lines.push('| Модель | Провайдер | Группа цены | От $/1M input | От $/1M output | API |')
  lines.push('| --- | --- | --- | ---: | ---: | --- |')
  for (const model of radar.models) {
    lines.push(
      `| ${markdownModelLink(model)} | ${model.vendor} | ${model.price_group} | ${formatPriceCell(model, 'input')} | ${formatPriceCell(model, 'output')} | ${model.protocols.join(', ') || '-'} |`
    )
  }

  lines.push(
    '',
    '## Методика',
    '',
    `Источник цен: [публичный API каталога](${radar.source}). Цены показаны для самой дешёвой доступной группы модели и не заменяют проверку перед запросом. Метрики за 7 дней являются направляющим сигналом: публичный endpoint не раскрывает размер выборки, а отсутствие сигнала означает отсутствие недавних измерений, а не недоступность модели.`,
    '',
    `Версия прайс-листа: \`${radar.pricing_version || 'unknown'}\`. Сформировано: \`${radar.generated_at}\`.`,
    ''
  )
  return lines.join('\n')
}

function isoWeek(date) {
  const current = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const day = current.getUTCDay() || 7
  current.setUTCDate(current.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((current - yearStart) / 86400000 + 1) / 7)
  return `${current.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

async function fetchJSON(url, required = true) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'llmhub-model-radar/1.0' },
        signal: AbortSignal.timeout(30000),
      })
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
      }
    }
  }
  if (required) throw lastError
  console.warn(`Optional endpoint failed: ${url}: ${lastError.message}`)
  return null
}

async function readPreviousRadar(outputRoot) {
  try {
    return JSON.parse(
      await readFile(path.join(outputRoot, 'data', 'model-radar.json'), 'utf8')
    )
  } catch {
    return null
  }
}

export async function generateReport(options = {}) {
  const apiBase = (options.apiBase || DEFAULT_API_BASE).replace(/\/$/, '')
  const outputRoot = path.resolve(options.outputRoot || process.cwd())
  const generatedAt = options.generatedAt || new Date()
  const previousRadar = await readPreviousRadar(outputRoot)
  const [pricing, performance] = await Promise.all([
    fetchJSON(`${apiBase}/api/pricing`),
    fetchJSON(`${apiBase}/api/perf-metrics/summary?hours=168`, false),
  ])
  const radar = buildRadar(pricing, performance, generatedAt)
  const report = buildReport(radar, previousRadar)
  const reportsDir = path.join(outputRoot, 'reports')
  const dataDir = path.join(outputRoot, 'data')
  await mkdir(reportsDir, { recursive: true })
  await mkdir(dataDir, { recursive: true })
  await writeFile(path.join(reportsDir, 'latest.md'), report, 'utf8')
  await writeFile(
    path.join(reportsDir, `${isoWeek(generatedAt)}.md`),
    report,
    'utf8'
  )
  await writeFile(
    path.join(dataDir, 'model-radar.json'),
    `${JSON.stringify(radar, null, 2)}\n`,
    'utf8'
  )
  return radar
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const radar = await generateReport()
  console.log(`Generated weekly report for ${radar.model_count} models.`)
}
