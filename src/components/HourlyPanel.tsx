import { useState, useRef, useCallback, useEffect, useMemo, memo, type ReactNode } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useHourlyForecast } from '../hooks/useHourlyForecast'
import { dirLabel, convertSpeed, convertHeight, convertTemp, speedLabel, heightLabel, sunTimes } from '../types'
import { tidePeaks as getTidePeaks } from '../api/tide'
import type { Spot, WindModel, HourForecast, AppSettings } from '../types'

import iconWind from '../assets/icons/wind_direction-24.png'
import iconTide from '../assets/icons/tide-24.png'
import iconTemp from '../assets/icons/temperature-24.png'
import iconPrecip from '../assets/icons/precipitation-24.png'
import iconSunrise from '../assets/icons/sunrise-16.png'
import iconSunset from '../assets/icons/sunset-16.png'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Sunrise / Sunset bar ─────────────────────────────────────────────────────
const SunBar = memo(function SunBar({ lat, lng, dayOffset }: { lat: number; lng: number; dayOffset: number }) {
  const { rise, set } = useMemo(() => sunTimes(lat, lng, dayOffset), [lat, lng, dayOffset])
  return (
    <>
      <span className="sun-bar-item">
        <img src={iconSunrise} alt="sunrise" className="sun-bar-icon" />{rise}
      </span>
      <span className="sun-bar-item">
        <img src={iconSunset} alt="sunset" className="sun-bar-icon" />{set}
      </span>
    </>
  )
})

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTooltip = memo(function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}:{' '}
          <strong>
            {p.value}
            {p.name === 'Rain' ? ' mm' : p.name === 'Temp' ? '' : p.name === 'Tide' ? '' : p.name === 'Dir' ? '°' : ''}
          </strong>
        </div>
      ))}
    </div>
  )
})

function fmtH(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

// ── Wind direction strip ──────────────────────────────────────────────────────
const WindDirStrip = memo(function WindDirStrip({ data, interval }: { data: HourForecast[]; interval?: number }) {
  const step = interval ?? 3
  return (
    <div className="wind-dir-strip">
      {data.filter((_, i) => i % step === 0).map((d, i) => (
        <div key={i} className="wind-dir-item">
          <svg width={14} height={14} viewBox="0 0 24 24"
            style={{ transform: `rotate(${d.dirDeg}deg)` }}>
            <path d="M12 2 L8 18 L12 14 L16 18 Z" fill="#2563EB" opacity={0.7} />
          </svg>
          <span className="wind-dir-label">{dirLabel(d.dirDeg)}</span>
        </div>
      ))}
    </div>
  )
})

// ── Section ───────────────────────────────────────────────────────────────────
const Section = memo(function Section({ title, sub, icon, right, children }: {
  title: string; sub?: string; icon?: string; right?: ReactNode; children: ReactNode
}) {
  return (
    <div className="section">
      <div className="section-header">
        {icon && <img src={icon} alt="" className="section-icon" />}
        <span className="section-title">{title}</span>
        {sub && <span className="section-sub">{sub}</span>}
        {right && <span className="section-header-right">{right}</span>}
      </div>
      {children}
    </div>
  )
})

// ── Hourly tide chart ─────────────────────────────────────────────────────────
const HourlyTideChart = memo(function HourlyTideChart({ data, dayOnly, dayOffset, lat, hu = 'm' }: {
  data: HourForecast[]; dayOnly?: boolean; dayOffset: number; lat: number; hu?: 'm' | 'ft'
}) {
  if (!data || data.length === 0) return null

  const chartData = useMemo(
    () => dayOnly ? data.slice(6, 20) : data,
    [data, dayOnly]
  )

  const allPeaks = useMemo(() => getTidePeaks(dayOffset, lat), [dayOffset, lat])

  const { minL, maxL } = useMemo(() => {
    const allLevels = data.map(d => convertHeight(d.tide, hu))
    return {
      minL: Math.floor(Math.min(...allLevels) * 2) / 2,
      maxL: Math.ceil(Math.max(...allLevels) * 2) / 2,
    }
  }, [data, hu])

  const tideChartData = useMemo(
    () => chartData.map(d => ({ ...d, tide: convertHeight(d.tide, hu) })),
    [chartData, hu]
  )

  return (
    <Section title="Tide" icon={iconTide} sub={dayOnly ? `${heightLabel(hu)} · 06:00–19:00` : `${heightLabel(hu)} · hourly`}>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={tideChartData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
          <defs>
            <linearGradient id="hTideGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8A96A8' }}
            axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#8A96A8' }} axisLine={false} tickLine={false}
            domain={[minL, maxL]} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="tide" stroke="#10B981" strokeWidth={2}
            fill="url(#hTideGrad)" name="Tide" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      {allPeaks.length > 0 && (
        <div className="tide-peak-bar">
          {allPeaks.map((p, i) => (
            <span key={i} className={`tide-peak tide-peak--${p.type}`}>
              {p.type === 'high' ? '↑' : '↓'} {p.type === 'high' ? 'High' : 'Low'} {p.time} · {convertHeight(p.level, hu)}{hu}
            </span>
          ))}
        </div>
      )}
    </Section>
  )
})

// ── Combined chart view ───────────────────────────────────────────────────────
const DAY_START = 6
const DAY_END   = 19

// Pure cubic Bézier path builder (cardinal spline, tension ~0.3)
function buildSmoothPath(
  values: number[],
  xAt: (i: number) => number,
  yAt: (v: number) => number,
): string {
  if (values.length < 2) return ''
  const tension = 0.3
  const pts = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }))
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    d += ` C${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

const CombinedChart = memo(function CombinedChart({ data: fullData, windColor, dayOffset, lat, lng, su, hu }: {
  data: HourForecast[]; windColor: string; dayOffset: number; lat: number; lng: number
  su: 'kts' | 'mph' | 'km/h'; hu: 'm' | 'ft'
}) {
  const data = useMemo(() => fullData.slice(DAY_START, DAY_END + 1), [fullData])

  const allTidePeaks = useMemo(() => getTidePeaks(dayOffset, lat), [dayOffset, lat])
  const peakHourMap = useMemo(() => {
    const map = new Map<number, { type: 'high' | 'low'; time: string }>()
    allTidePeaks.forEach(p => map.set(Math.round(p.hour), { type: p.type, time: p.time }))
    return map
  }, [allTidePeaks])

  const N       = data.length
  const maxWind = useMemo(
    () => Math.max(...data.map(d => Math.max(d.wind, d.gust)), 1),
    [data]
  )

  // Hover state
  const [hover, setHover] = useState<{ x: number; pct: number } | null>(null)
  const chartRef = useRef<HTMLTableCellElement>(null)

  // SVG chart dimensions
  const CHART_H = 160
  const SVG_W   = 1000

  const xAt = useCallback((i: number) => ((i + 0.5) / N) * SVG_W, [N])
  const yAt = useCallback((v: number) => CHART_H - (v / maxWind) * (CHART_H - 20) - 10, [maxWind])

  const { windPath, gustPath, windFill } = useMemo(() => {
    const wp = buildSmoothPath(data.map(d => d.wind), xAt, yAt)
    const gp = buildSmoothPath(data.map(d => d.gust), xAt, yAt)
    const wf = wp + ` L${xAt(N - 1).toFixed(1)} ${CHART_H} L${xAt(0).toFixed(1)} ${CHART_H} Z`
    return { windPath: wp, gustPath: gp, windFill: wf }
  }, [data, xAt, yAt, N])

  const yTicks = useMemo(
    () => [0, Math.round(maxWind / 3), Math.round(maxWind * 2 / 3), Math.round(maxWind)],
    [maxWind]
  )

  // Hover calculations
  const getPosition = useCallback((clientX: number) => {
    const td = chartRef.current
    if (!td) return null
    const rect = td.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    return { x, pct }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getPosition(e.clientX)
    if (pos) setHover(pos)
  }, [getPosition])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const pos = getPosition(e.touches[0].clientX)
    if (pos) setHover(pos)
  }, [getPosition])

  // Interpolate value at a fractional position
  const lerp = (key: 'wind' | 'gust' | 'tide', pct: number): number => {
    const pos = pct * (N - 1)
    const i0 = Math.max(0, Math.min(N - 2, Math.floor(pos)))
    const i1 = i0 + 1
    const t = pos - i0
    return data[i0][key] * (1 - t) + data[i1][key] * t
  }

  const hoverTime = hover ? (() => {
    const totalMinutes = Math.round((DAY_START + hover.pct * (DAY_END - DAY_START)) * 60)
    const snapped = Math.round(totalMinutes / 15) * 15
    const h = Math.floor(snapped / 60)
    const m = snapped % 60
    return `${String(Math.min(h, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })() : ''

  const hoverWind = hover ? convertSpeed(Math.round(lerp('wind', hover.pct)), su) : 0
  const hoverGust = hover ? convertSpeed(Math.round(lerp('gust', hover.pct)), su) : 0
  const hoverSvgX = hover ? ((hover.pct * (N - 1) + 0.5) / N) * SVG_W : 0

  return (
    <Section title="Wind Speed" icon={iconWind} sub={`${speedLabel(su)} · ${fmtH(DAY_START)}–${fmtH(DAY_END)}`}
      right={<SunBar lat={lat} lng={lng} dayOffset={dayOffset} />}>
      <div className="combined-table-wrap">
        {/* Y-axis */}
        <div className="combined-yaxis">
          {[...yTicks].reverse().map((v, i) => (
            <span key={i} className="combined-yaxis-label" style={{ top: `${yAt(v)}px` }}>{v}</span>
          ))}
        </div>

        <table className="combined-table" cellPadding={0} cellSpacing={0}>
          <colgroup>
            {data.map((_, i) => <col key={i} style={{ width: `${100 / N}%` }} />)}
          </colgroup>

          <tbody>
            {/* Chart row */}
            <tr>
              <td ref={chartRef} colSpan={N}
                style={{ padding: 0, height: CHART_H, position: 'relative', cursor: 'crosshair' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHover(null)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setHover(null)}>
                <svg width="100%" height={CHART_H} style={{ display: 'block' }}
                  preserveAspectRatio="none" viewBox={`0 0 ${SVG_W} ${CHART_H}`}>
                  {yTicks.map((v, i) => (
                    <line key={i} x1="0" x2={SVG_W} y1={yAt(v)} y2={yAt(v)}
                      stroke="#E8EDF3" strokeWidth={1} strokeDasharray="4 4" />
                  ))}
                  <path d={windFill} fill={windColor} opacity={0.1} />
                  <path d={gustPath} fill="none" stroke="#93C5FD" strokeWidth={2}
                    strokeDasharray="6 4" />
                  <path d={windPath} fill="none" stroke={windColor} strokeWidth={3} />
                  {data.map((d, i) => (
                    <circle key={i} cx={xAt(i)} cy={yAt(d.wind)} r={4} fill={windColor} />
                  ))}
                  {hover && (
                    <line x1={hoverSvgX} x2={hoverSvgX} y1={0} y2={CHART_H}
                      stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
                  )}
                </svg>
                {hover && (
                  <div className="combined-tooltip"
                    style={{ left: Math.min(hover.x, (chartRef.current?.clientWidth ?? 300) - 110) }}>
                    <div className="combined-tooltip-time">{hoverTime}</div>
                    <div style={{ color: '#93C5FD' }}>Gust: <strong>{hoverGust} {speedLabel(su)}</strong></div>
                    <div style={{ color: windColor }}>Wind: <strong>{hoverWind} {speedLabel(su)}</strong></div>
                  </div>
                )}
              </td>
            </tr>

            {/* Hour labels */}
            <tr className="combined-tr combined-tr--hours">
              {data.map((d, i) => (
                <td key={i} className="combined-td">
                  <span className="combined-hour">{d.hour.slice(0, 5)}</span>
                </td>
              ))}
            </tr>

            {/* Wind direction */}
            <tr className="combined-tr">
              {data.map((d, i) => (
                <td key={i} className="combined-td">
                  {i === 0 && <span className="combined-tr-icon"><img src={iconWind} alt="" className="combined-tr-img" /></span>}
                  <svg width={13} height={13} viewBox="0 0 24 24"
                    style={{ transform: `rotate(${d.dirDeg}deg)` }}>
                    <path d="M12 2 L8 18 L12 14 L16 18 Z" fill="#2563EB" opacity={0.7} />
                  </svg>
                  <span className="combined-dir">{dirLabel(d.dirDeg)}</span>
                </td>
              ))}
            </tr>

            {/* Tide */}
            <tr className="combined-tr">
              {data.map((d, i) => {
                const absH = DAY_START + i
                const prev = absH > 0 ? fullData[absH - 1]?.tide ?? d.tide : d.tide
                const rising = d.tide >= prev
                const peak = peakHourMap.get(absH)
                return (
                  <td key={i} className="combined-td">
                    {i === 0 && <span className="combined-tr-icon"><img src={iconTide} alt="" className="combined-tr-img" /></span>}
                    {peak ? (
                      <span style={{ fontSize: 8, fontWeight: 700, lineHeight: 1.1,
                        color: peak.type === 'high' ? '#166534' : '#92400E' }}>
                        {peak.type === 'high' ? '↑' : '↓'}{peak.time}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.45,
                        color: rising ? '#10B981' : '#F59E0B' }}>
                        {rising ? '↑' : '↓'}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>

            {/* Precipitation */}
            <tr className="combined-tr">
              {data.map((d, i) => (
                <td key={i} className="combined-td">
                  {i === 0 && <span className="combined-tr-icon"><img src={iconPrecip} alt="" className="combined-tr-img" /></span>}
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#0EA5E9' }}>
                    {d.rain > 0 ? `${Math.round(d.rain * 10) / 10}` : ''}
                  </span>
                </td>
              ))}
            </tr>

            {/* Temperature */}
            <tr className="combined-tr">
              {data.map((d, i) => (
                <td key={i} className="combined-td">
                  {i === 0 && <span className="combined-tr-icon"><img src={iconTemp} alt="" className="combined-tr-img" /></span>}
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#F97316' }}>
                    {Math.round(d.temp)}°
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  )
})

// ── Split view ────────────────────────────────────────────────────────────────
const SplitView = memo(function SplitView({ data, windColor, isBlend, dayOffset, lat, lng, su, hu, tu }: {
  data: HourForecast[]; windColor: string; isBlend: boolean; dayOffset: number; lat: number; lng: number
  su: 'kts' | 'mph' | 'km/h'; hu: 'm' | 'ft'; tu: '°C' | '°F'
}) {
  const dayData = useMemo(() => data.slice(6, 20).map(d => ({
    ...d,
    wind: convertSpeed(d.wind, su),
    gust: convertSpeed(d.gust, su),
  })), [data, su])

  const tempChartData = useMemo(
    () => data.map(d => ({ ...d, temp: convertTemp(d.temp, tu) })),
    [data, tu]
  )

  return (
    <>
      {/* Wind — 06:00 to 19:00 */}
      <Section title="Wind Speed" icon={iconWind} sub={`${speedLabel(su)} · 06:00–19:00`}
        right={<SunBar lat={lat} lng={lng} dayOffset={dayOffset} />}>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dayData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="hWindGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={windColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={windColor} stopOpacity={0}    />
              </linearGradient>
              {isBlend && (
                <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366F1" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8A96A8' }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {isBlend && data[0]?.spread != null && (
              <Area type="monotone" dataKey="spread" stroke="none"
                fill="url(#spreadGrad)" legendType="none" dot={false} />
            )}
            <Area type="monotone" dataKey="gust" stroke="#93C5FD" strokeWidth={1.5}
              fill="none" name="Gust" dot={false} strokeDasharray="4 3" />
            <Area type="monotone" dataKey="wind" stroke={windColor} strokeWidth={2.5}
              fill="url(#hWindGrad)" name="Wind" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <WindDirStrip data={dayData} interval={1} />
      </Section>

      {/* Tide — 06:00 to 19:00 */}
      <HourlyTideChart data={data} dayOnly dayOffset={dayOffset} lat={lat} hu={hu} />

      {/* Temp + Rain — full 24h */}
      <div className="two-col">
        <Section title="Temperature" icon={iconTemp} sub={`${tu} · hourly`}>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={tempChartData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8A96A8' }}
                axisLine={false} tickLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="temp" stroke="#F97316"
                strokeWidth={2.5} dot={false} name="Temp" />
            </LineChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Precipitation" icon={iconPrecip} sub="mm · hourly">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8A96A8' }}
                axisLine={false} tickLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="rain" fill="#38BDF8" radius={[3, 3, 0, 0]} name="Rain" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </>
  )
})

// ── HourlyPanel ───────────────────────────────────────────────────────────────
interface Props {
  spot:      Spot
  model:     WindModel
  dayOffset: number
  onClose:   () => void
  onDayChange?: (offset: number) => void
  settings:  AppSettings
}

export function HourlyPanel({ spot, model, dayOffset, onClose, onDayChange, settings }: Props) {
  const { data, loading, error } = useHourlyForecast(
    spot.lat, spot.lng, model, dayOffset
  )
  const isBlend   = model === 'BLEND'
  const windColor = isBlend ? '#6366F1' : '#2563EB'

  const { day, dateLabel } = useMemo(() => {
    const dt = new Date()
    dt.setDate(dt.getDate() + dayOffset)
    return {
      day:       DAY_NAMES[dt.getDay()],
      dateLabel: `${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}`,
    }
  }, [dayOffset])

  const su = settings.speedUnit
  const hu = settings.heightUnit
  const tu = settings.tempUnit

  const [viewMode, setViewMode] = useState<'split' | 'combined'>('split')

  // ── Swipe navigation for mobile ──────────────────────────────
  const touchRef = useRef<{ startX: number; startY: number; startTime: number } | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startTime: Date.now(),
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.startX
    const dy = e.changedTouches[0].clientY - touchRef.current.startY
    const dt = Date.now() - touchRef.current.startTime
    touchRef.current = null

    if (dt < 400 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx > 0 && dayOffset > 0) {
        onDayChange?.(dayOffset - 1)
      } else if (dx < 0 && dayOffset < 6) {
        onDayChange?.(dayOffset + 1)
      }
    }
  }, [dayOffset, onDayChange])

  // ── Keyboard navigation ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && dayOffset > 0) {
        onDayChange?.(dayOffset - 1)
      } else if (e.key === 'ArrowRight' && dayOffset < 6) {
        onDayChange?.(dayOffset + 1)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dayOffset, onDayChange, onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}
        ref={modalRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        {/* Header */}
        <div className="modal-header">
          <button className="modal-back" onClick={onClose}>←</button>

          {/* Day navigation */}
          <div className="day-nav">
            <button
              className="day-nav-btn"
              disabled={dayOffset <= 0}
              onClick={() => onDayChange?.(dayOffset - 1)}
            >
              ‹
            </button>
            <div>
              <div className="modal-title">{day} {dateLabel} · Hourly forecast</div>
              <div className="modal-subtitle">
                {spot.name}&nbsp;·&nbsp;
                <span style={{ color: windColor, fontWeight: 600 }}>
                  {isBlend ? '⊕ BLEND' : model}
                </span>
              </div>
            </div>
            <button
              className="day-nav-btn"
              disabled={dayOffset >= 6}
              onClick={() => onDayChange?.(dayOffset + 1)}
            >
              ›
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
            <div className="view-toggle">
              <button
                className={['view-toggle-btn', viewMode === 'split' ? 'view-toggle-btn--active' : ''].join(' ')}
                onClick={() => setViewMode('split')}
              >
                Split
              </button>
              <button
                className={['view-toggle-btn', viewMode === 'combined' ? 'view-toggle-btn--active' : ''].join(' ')}
                onClick={() => setViewMode('combined')}
              >
                Combo
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="modal-loading">Loading hourly data…</div>
        ) : (
          <>
            {viewMode === 'combined' ? (
              <CombinedChart data={data} windColor={windColor} dayOffset={dayOffset} lat={spot.lat} lng={spot.lng} su={su} hu={hu} />
            ) : (
              <SplitView data={data} windColor={windColor} isBlend={isBlend} dayOffset={dayOffset} lat={spot.lat} lng={spot.lng} su={su} hu={hu} tu={tu} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
