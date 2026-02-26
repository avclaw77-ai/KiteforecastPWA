import { useState, useEffect, useRef } from 'react'
import { fetchDailyForecast, getCachedDaily } from '../api/openmeteo'
import type { DayForecast, WindModel } from '../types'

/**
 * Fetches all base models in a single hook with one batched state update.
 * Replaces 5 × useForecast() calls in ModelComparison, reducing re-renders
 * from up to 5 (one per model resolve) to 1 (single batched update).
 */
export function useMultiModelForecast(
  lat: number,
  lng: number,
  models: readonly WindModel[],
) {
  // Try to initialize from cache synchronously (avoids loading flicker)
  const [allData, setAllData] = useState<Record<string, DayForecast[]>>(() => {
    const init: Record<string, DayForecast[]> = {}
    for (const m of models) {
      init[m] = getCachedDaily(lat, lng, m) ?? []
    }
    return init
  })

  // Track the request params to detect staleness
  const reqRef = useRef(0)
  const modelsKey = models.join(',')

  useEffect(() => {
    const reqId = ++reqRef.current

    Promise.allSettled(
      models.map(m =>
        fetchDailyForecast(lat, lng, m).then(data => ({ model: m, data }))
      )
    ).then(results => {
      if (reqId !== reqRef.current) return // stale request

      const next: Record<string, DayForecast[]> = {}
      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        next[models[i]] = r.status === 'fulfilled' ? r.value.data : []
      }
      setAllData(next) // single batched state update
    })
  }, [lat, lng, modelsKey])

  return allData
}
