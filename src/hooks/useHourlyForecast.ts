import { useState, useEffect } from 'react'
import { fetchHourlyForecast, getCachedHourly } from '../api/openmeteo'
import type { HourForecast, WindModel } from '../types'

export function useHourlyForecast(
  lat: number,
  lng: number,
  model: WindModel,
  dayOffset: number | null,
) {
  // Initialize from cache synchronously — skip loading if cached
  const [data,    setData]    = useState<HourForecast[]>(() => {
    if (dayOffset === null) return []
    return getCachedHourly(lat, lng, model, dayOffset) ?? []
  })
  const [loading, setLoading] = useState(() => {
    if (dayOffset === null) return false
    return getCachedHourly(lat, lng, model, dayOffset) === null
  })
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (dayOffset === null) return
    let cancelled = false

    // Check cache synchronously — skip loading flash if cached
    const cached = getCachedHourly(lat, lng, model, dayOffset)
    if (cached) {
      setData(cached)
      setLoading(false)
      setError(null)
      // Silent background refresh
      fetchHourlyForecast(lat, lng, model, dayOffset)
        .then(d  => { if (!cancelled) setData(d) })
        .catch(() => {})
      return () => { cancelled = true }
    }

    // No cache — show loading
    setLoading(true)
    setError(null)

    fetchHourlyForecast(lat, lng, model, dayOffset)
      .then(d  => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(()  => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [lat, lng, model, dayOffset])

  return { data, loading, error }
}
