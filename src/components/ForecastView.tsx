import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useForecast }                       from '../hooks/useForecast'
import { ModelComparison }                   from './ModelComparison'
import { windRating, ratingColor, dirLabel,
         convertSpeed, convertTemp,
         speedLabel }            from '../types'
import type { Spot, WindModel, DayForecast, AppSettings } from '../types'

import iconWind from '../assets/icons/wind_direction-24.png'
import iconTemp from '../assets/icons/temperature-24.png'
import iconPrecip from '../assets/icons/precipitation-24.png'

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}:{' '}
          <strong>
            {typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value}
            {p.name === 'Rain' ? ' mm' : p.name === 'Dir' ? '°' : ''}
          </strong>
        </div>
      ))}
    </div>
  )
}

// ── Weekly wind chart tooltip (shows interpolated time within the day) ──────
function WeeklyWindTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value} kts</strong>
        </div>
      ))}
    </div>
  )
}

// ── Wind direction strip below charts ────────────────────────────────────────
function WindDirStrip({ data, labelKey, interval }: {
  data: { dirDeg: number; [k: string]: any }[]
  labelKey: string
  interval?: number
}) {
  const step = interval ?? 1
  return (
    <div className="wind-dir-strip">
      {data.filter((_, i) => i % step === 0).map((d, i) => (
        <div key={i} className="wind-dir-item">
          <svg width={16} height={16} viewBox="0 0 24 24"
            style={{ transform: `rotate(${d.dirDeg}deg)` }}>
            <path d="M12 2 L8 18 L12 14 L16 18 Z" fill="#2563EB" opacity={0.7} />
          </svg>
          <span className="wind-dir-label">{dirLabel(d.dirDeg)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Wind arrow ────────────────────────────────────────────────────────────────
function WindArrow({ deg, size = 18 }: { deg: number; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      style={{ transform: `rotate(${deg}deg)`, display: 'inline-block' }}
    >
      <path d="M12 2 L8 18 L12 14 L16 18 Z" fill="#2563EB" />
    </svg>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, sub, icon, children }: {
  title: string; sub?: string; icon?: string; children: React.ReactNode
}) {
  return (
    <div className="section">
      <div className="section-header">
        {icon && <img src={icon} alt="" className="section-icon" />}
        <span className="section-title">{title}</span>
        {sub && <span className="section-sub">{sub}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Tide tooltip ─────────────────────────────────────────────────────────────

// ── Day card ──────────────────────────────────────────────────────────────────
function DayCard({ d, isBlend, onClick, speedUnit = 'kts' }: {
  d: DayForecast; isBlend: boolean; onClick: () => void; speedUnit?: 'kts' | 'mph' | 'km/h'
}) {
  const wind = convertSpeed(d.wind, speedUnit)
  const gust = convertSpeed(d.gust, speedUnit)
  const color = ratingColor(windRating(d.wind))
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dt = d.date ? new Date(d.date + 'T00:00:00') : null
  const dateLabel = dt ? `${MONTHS[dt.getMonth()]} ${dt.getDate()}` : ''
  return (
    <div
      className="day-card"
      onClick={onClick}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = isBlend ? '#6366F1' : '#2563EB'
        el.style.transform   = 'translateY(-2px)'
        el.style.boxShadow   = '0 4px 12px rgba(0,0,0,.10)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#E8EDF3'
        el.style.transform   = 'translateY(0)'
        el.style.boxShadow   = '0 1px 4px rgba(0,0,0,.04)'
      }}
    >
      <div className="day-card-label">{d.day}</div>
      {dateLabel && <div className="day-card-date">{dateLabel}</div>}
      <WindArrow deg={d.dirDeg} size={20} />
      <div className="day-card-wind" style={{ color }}>{wind}</div>
      <div className="day-card-unit">{speedUnit}</div>
      <div className="day-card-gust">↑{gust}</div>
      {isBlend && d.spread != null && (
        <div className="day-card-spread">±{Math.round(d.spread / 2)}</div>
      )}
      {isBlend && d.modelAgreement && (
        <div className={`day-card-agreement day-card-agreement--${d.modelAgreement}`}>
          {d.modelAgreement === 'high' ? '●' : d.modelAgreement === 'moderate' ? '◐' : '○'}
        </div>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonBar({ h = 180 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h, borderRadius: 8 }} />
}

// ── My spots map view ─────────────────────────────────────────────────────────
function MyMapView({ spots, selectedId, onSpotClick }: {
  spots:       Spot[]
  selectedId:  string
  onSpotClick: (id: string) => void
}) {
  return (
    <div className="map-placeholder">
      {spots.map(spot => {
        const xPct  = ((spot.lng + 180) / 360) * 100
        const yPct  = ((90 - spot.lat)  / 180) * 100
        const isSel = spot.id === selectedId
        return (
          <div
            key={spot.id}
            className={['map-pin', isSel ? 'map-pin--selected' : ''].join(' ')}
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
            onClick={() => onSpotClick(spot.id)}
            title={spot.name}
          >
            <span className="map-pin-name">{spot.name}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── ForecastView ──────────────────────────────────────────────────────────────
interface Props {
  spot:        Spot
  model:       WindModel
  mapView:     boolean
  allSpots:    Spot[]
  selectedId:  string
  onSpotClick: (id: string) => void
  onDayClick:  (dayOffset: number) => void
  settings:    AppSettings
}

export function ForecastView({
  spot, model, mapView, allSpots, selectedId, onSpotClick, onDayClick, settings,
}: Props) {
  const { data, loading, error } = useForecast(spot.lat, spot.lng, model)
  const isBlend   = model === 'BLEND'
  const windColor = isBlend ? '#6366F1' : '#2563EB'
  const su = settings.speedUnit
  const hu = settings.heightUnit
  const tu = settings.tempUnit

  if (mapView) {
    return (
      <MyMapView
        spots={allSpots}
        selectedId={selectedId}
        onSpotClick={onSpotClick}
      />
    )
  }

  return (
    <div className="forecast-container">
      {/* Header */}
      <div className="forecast-header">
        <h1 className="forecast-title">{spot.name}</h1>
        <span className={['model-tag', isBlend ? 'model-tag--blend' : ''].join(' ')}>
          {isBlend ? '⊕ BLEND' : model}
        </span>
        <span className="forecast-hint">Click for daily view</span>
      </div>

      {error && <div className="error-banner">Could not load forecast: {error}</div>}

      {/* Day strip */}
      {loading ? (
        <div className="day-strip-skeleton">
          {Array.from({ length: 7 }, (_, i) => <SkeletonBar key={i} h={120} />)}
        </div>
      ) : (
        <>
          <div className="day-strip">
            {data.map((d, i) => (
              <DayCard key={i} d={d} isBlend={isBlend} onClick={() => onDayClick(i)} speedUnit={su} />
            ))}
          </div>
        </>
      )}

      {/* Wind chart */}
      <Section title="Wind Speed" icon={iconWind} sub={`${speedLabel(su)} · avg vs gust`}>
        {loading ? <SkeletonBar h={180} /> : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.map(d => ({ ...d, wind: convertSpeed(d.wind, su), gust: convertSpeed(d.gust, su) }))} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={windColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={windColor} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<WeeklyWindTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="gust" stroke="#93C5FD" strokeWidth={1.5}
                  fill="none" name="Gust" dot={false} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="wind" stroke={windColor} strokeWidth={2.5}
                  fill="url(#windGrad)" name="Wind"
                  dot={{ r: 3, fill: windColor, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            <WindDirStrip data={data} labelKey="day" />
          </>
        )}
      </Section>

      {/* Model overlay */}
      <ModelComparison spot={spot} activeModel={model} onModelChange={() => {}} settings={settings} />

      {/* Temp + Rain */}
      <div className="two-col">
        <Section title="Temperature" icon={iconTemp} sub={tu}>
          {loading ? <SkeletonBar h={140} /> : (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={data.map(d => ({ ...d, temp: convertTemp(d.temp, tu) }))} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#F97316', strokeWidth: 0 }} name="Temp" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Precipitation" icon={iconPrecip} sub="mm">
          {loading ? <SkeletonBar h={140} /> : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8A96A8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="rain" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Rain" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>
    </div>
  )
}
