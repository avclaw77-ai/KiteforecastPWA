import { useState, useEffect } from 'react'
import { fetchDailyForecast, getCachedDaily } from '../api/openmeteo'
import type { DayForecast, WindModel } from '../types'

export function useForecast(lat: number, lng: number, model: WindModel) {
  // Initialize from cache synchronously — if data is cached, skip loading entirely
  const [data,    setData]    = useState<DayForecast[]>(() => getCachedDaily(lat, lng, model) ?? [])
  const [loading, setLoading] = useState(() => getCachedDaily(lat, lng, model) === null)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Check cache synchronously — if hit, render immediately without loading flash
    const cached = getCachedDaily(lat, lng, model)
    if (cached) {
      setData(cached)
      setLoading(false)
      setError(null)
      // Still fetch in background to refresh stale data silently
      fetchDailyForecast(lat, lng, model)
        .then(d  => { if (!cancelled) setData(d) })
        .catch(() => { /* silent background refresh failure */ })
      return () => { cancelled = true }
    }

    // No cache — show loading
    setLoading(true)
    setError(null)

    fetchDailyForecast(lat, lng, model)
      .then(d  => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(()  => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [lat, lng, model])

  return { data, loading, error }
}
