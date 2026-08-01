import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRadar,
  buildReport,
  calculateModelPrices,
} from './generate-weekly-report.mjs'

const pricing = {
  success: true,
  pricing_version: 'test-version',
  group_ratio: { '1X': 1, '1.9X': 1.9 },
  vendors: [{ id: 2, name: 'OpenAI' }],
  data: [
    {
      model_name: 'provider/model alpha',
      vendor_id: 2,
      quota_type: 0,
      model_ratio: 0.2,
      completion_ratio: 6,
      cache_ratio: 0.1,
      enable_groups: ['1.9X', '1X'],
      supported_endpoint_types: ['openai'],
    },
  ],
}

test('calculates the cheapest enabled group token prices', () => {
  assert.deepEqual(calculateModelPrices(pricing.data[0], pricing.group_ratio), {
    billing_unit: 'tokens',
    price_group: '1X',
    request_usd: null,
    input_per_million_usd: 0.4,
    output_per_million_usd: 2.4,
    cached_input_per_million_usd: 0.04,
  })
})

test('builds encoded model links and a transparent report', () => {
  const radar = buildRadar(
    pricing,
    {
      data: {
        models: [
          {
            model_name: 'provider/model alpha',
            success_rate: 100,
            avg_latency_ms: 1250,
          },
        ],
      },
    },
    new Date('2026-08-01T00:00:00.000Z')
  )
  assert.equal(radar.model_count, 1)
  assert.match(radar.models[0].details_url, /provider%2Fmodel%20alpha/)
  const report = buildReport(radar, null)
  assert.match(report, /Первый автоматический снимок/)
  assert.match(report, /публичный endpoint не раскрывает размер выборки/)
})
