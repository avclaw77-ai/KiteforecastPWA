// ── Models ────────────────────────────────────────────────────────────────────
export type WindModel = 'GFS' | 'ECMWF' | 'ICON' | 'MF' | 'GEM' | 'BLEND'

export const ALL_MODELS: WindModel[] = ['GFS', 'ECMWF', 'ICON', 'MF', 'GEM', 'BLEND']
export const BASE_MODELS: WindModel[] = ['GFS', 'ECMWF', 'ICON', 'MF', 'GEM']

// ── Settings ──────────────────────────────────────────────────────────────────
export type SpeedUnit = 'kts' | 'mph' | 'km/h'
export type HeightUnit = 'm' | 'ft'
export type TempUnit   = '°C' | '°F'

export interface AppSettings {
  enabledModels:  WindModel[]
  speedUnit:      SpeedUnit
  heightUnit:     HeightUnit
  tempUnit:       TempUnit
  stormGlassKey:  string       // Storm Glass API key for real tide data
  darkMode:       boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  enabledModels: ['GFS', 'ECMWF', 'ICON', 'MF', 'GEM', 'BLEND'],
  speedUnit:     'kts',
  heightUnit:    'm',
  tempUnit:      '°C',
  stormGlassKey: (import.meta.env && import.meta.env.VITE_STORMGLASS_KEY) || '',
  darkMode:      false,
}

// ── Unit conversion helpers ──────────────────────────────────────────────────
export function convertSpeed(kts: number, unit: SpeedUnit): number {
  if (unit === 'mph')  return Math.round(kts * 1.15078)
  if (unit === 'km/h') return Math.round(kts * 1.852)
  return kts  // kts
}

export function convertHeight(metres: number, unit: HeightUnit): number {
  if (unit === 'ft') return +(metres * 3.28084).toFixed(1)
  return +metres.toFixed(1)
}

export function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === '°F') return Math.round(celsius * 9 / 5 + 32)
  return Math.round(celsius)
}

export function speedLabel(unit: SpeedUnit): string {
  return unit
}

export function heightLabel(unit: HeightUnit): string {
  return unit
}

// ── Spots ─────────────────────────────────────────────────────────────────────
export interface Spot {
  id: string
  name: string
  country: string
  region: string
  lat: number
  lng: number
  isKnown: boolean
  wind: number
  gust: number
  dir: number
}

// ── Forecast ──────────────────────────────────────────────────────────────────
export interface DayForecast {
  day: string
  date: string
  wind: number
  gust: number
  temp: number
  rain: number
  cloud: number
  tideHigh: number
  tideLow: number
  tideRange: number
  dirDeg: number
  spread?: number
  confidence?: number        // 0–1 model agreement score
  modelAgreement?: string    // 'high' | 'moderate' | 'low'
}

export interface HourForecast {
  hour: string
  wind: number
  gust: number
  temp: number
  rain: number
  dirDeg: number
  tide: number
  spread?: number
  confidence?: number
}

// ── API response shapes (Open-Meteo) ──────────────────────────────────────────
export interface OpenMeteoDailyResponse {
  daily: {
    time:                            string[]
    windspeed_10m_max:               number[]
    windgusts_10m_max:               number[]
    winddirection_10m_dominant:      number[]
    temperature_2m_max:              number[]
    precipitation_sum:               number[]
    cloudcover_mean:                 number[]
  }
}

export interface OpenMeteoHourlyResponse {
  hourly: {
    time:                string[]
    windspeed_10m:       number[]
    windgusts_10m:       number[]
    winddirection_10m:   number[]
    temperature_2m:      number[]
    precipitation:       number[]
  }
}

// ── Wind rating ───────────────────────────────────────────────────────────────
export type WindRating = 'good' | 'ok' | 'poor'

export function windRating(knots: number): WindRating {
  if (knots >= 15 && knots <= 30) return 'good'
  if ((knots >= 10 && knots < 15) || (knots > 30 && knots <= 35)) return 'ok'
  return 'poor'
}

export function ratingColor(r: WindRating): string {
  return r === 'good' ? '#10B981' : r === 'ok' ? '#F59E0B' : '#EF4444'
}

export function dirLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

// ── Shared date constants ────────────────────────────────────────────────────
export const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const

// ── Window type augmentation (Electron — optional in web builds) ─────────────
declare global {
  interface Window {
    electronAPI?: {
      spots: {
        get: () => Promise<Spot[]>
        add: (s: Spot) => Promise<Spot[]>
        remove: (id: string) => Promise<Spot[]>
        reorder: (ids: string[]) => Promise<Spot[]>
      }
    }
  }
}

// ── Sunrise / sunset calculation ─────────────────────────────────────────────
export function sunTimes(lat: number, lng: number, dayOffset = 0): { rise: string; set: string } {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)

  const zenith = 90.833
  const D2R = Math.PI / 180
  const R2D = 180 / Math.PI

  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1)
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.04089 * Math.sin(2 * gamma))
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)

  const cosHA = (Math.cos(zenith * D2R) / (Math.cos(lat * D2R) * Math.cos(decl)) - Math.tan(lat * D2R) * Math.tan(decl))

  if (cosHA > 1) return { rise: '--:--', set: '--:--' }
  if (cosHA < -1) return { rise: '00:00', set: '23:59' }

  const ha = R2D * Math.acos(cosHA)
  const sunrise = 720 - 4 * (lng + ha) - eqTime
  const sunset  = 720 - 4 * (lng - ha) - eqTime

  const tzOffset = Math.round(lng / 15) * 60
  const localRise = sunrise + tzOffset
  const localSet  = sunset + tzOffset

  const fmt = (mins: number) => {
    const m = ((mins % 1440) + 1440) % 1440
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`
  }

  return { rise: fmt(localRise), set: fmt(localSet) }
}
