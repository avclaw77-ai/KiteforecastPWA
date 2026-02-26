import { memo, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useMultiModelForecast }             from '../hooks/useMultiModelForecast'
import { BASE_MODELS, convertSpeed, speedLabel, chartColors } from '../types'
import type { Spot, WindModel, AppSettings } from '../types'

// ── Distinct color per model ─────────────────────────────────────────────────
const MODEL_COLORS: Record<string, string> = {
  GFS:   '#2563EB',  // blue
  ECMWF: '#10B981',  // emerald
  ICON:  '#F59E0B',  // amber
  MF:    '#8B5CF6',  // violet
  GEM:   '#EF4444',  // red
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  spot:          Spot
  activeModel:   WindModel
  onModelChange: (m: WindModel) => void
  settings:      AppSettings
}

// ── Chart tooltip (defined outside component for stable reference) ───────────
const ChartTooltip = memo(function ChartTooltip({ active, payload, label, su, dark }: any) {
  if (!active || !payload?.length) return null
  const cc = chartColors(!!dark)
  return (
    <div style={{
      background: cc.tooltipBg, border: `1px solid ${cc.tooltipBorder}`, borderRadius: 8,
      padding: '8px 12px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,.08)',
      color: cc.tooltipText,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 1 }}>
          {p.dataKey}: <strong>{p.value} {speedLabel(su)}</strong>
        </div>
      ))}
    </div>
  )
})

export const ModelComparison = memo(function ModelComparison({ spot, settings }: Props) {
  const su = settings.speedUnit
  const cc = chartColors(settings.darkMode)
  const visibleModels = useMemo(
    () => BASE_MODELS.filter(m => settings.enabledModels.includes(m)),
    [settings.enabledModels]
  )

  // Single batched hook replaces 5 × useForecast — one state update instead of 5
  const allData = useMultiModelForecast(spot.lat, spot.lng, BASE_MODELS)

  // Build chart data: one entry per day with wind per model (memoized)
  const chartData = useMemo(() => {
    // Find first model with data to determine day count
    const firstWithData = BASE_MODELS.find(m => allData[m]?.length > 0)
    if (!firstWithData) return []
    const ref = allData[firstWithData]
    const days = ref.length

    return Array.from({ length: days }, (_, i) => {
      const entry: Record<string, any> = { day: ref[i]?.day || '' }
      for (const m of visibleModels) {
        const raw = allData[m]?.[i]?.wind
        entry[m] = raw != null ? convertSpeed(raw, su) : null
      }
      return entry
    })
  }, [allData, visibleModels, su])

  if (chartData.length === 0) return null

  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Model Overlay</span>
        <span className="section-sub">wind speed · {speedLabel(su)}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: cc.label }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: cc.label }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip su={su} dark={settings.darkMode} />} />
          <Legend
            iconType="line"
            iconSize={14}
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          />
          {visibleModels.map(m => (
            <Line
              key={m}
              type="monotone"
              dataKey={m}
              stroke={MODEL_COLORS[m]}
              strokeWidth={2}
              dot={{ r: 3, fill: MODEL_COLORS[m], strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
