import logoImg from "./assets/icons/logo-32.png"
import { useState, useEffect, useCallback } from 'react'
import { Sidebar }        from './components/Sidebar'
import { TitleBar }       from './components/TitleBar'
import { ForecastView }   from './components/ForecastView'
import { HourlyPanel }    from './components/HourlyPanel'
import { AddSpotMap }     from './components/AddSpotMap'
import { SettingsPanel }  from './components/SettingsPanel'
import { useSpots }       from './hooks/useSpots'
import { useSettings }    from './hooks/useSettings'
import { setStormGlassKey, fetchTideData } from './api/tide'
import { clearForecastCache } from './api/openmeteo'
import type { WindModel, Spot } from './types'
import './styles/global.css'

export default function App() {
  const { spots, loading, addSpot, removeSpot, reorderSpots } = useSpots()
  const { settings, update: updateSettings } = useSettings()

  const [selId,        setSelId]        = useState<string | null>(null)
  const [model,        setModel]        = useState<WindModel>('GFS')
  const [selDay,       setSelDay]       = useState<number | null>(null)
  const [showAdd,      setShowAdd]      = useState(false)
  const [showMapView,  setShowMapView]  = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [refreshing,   setRefreshing]   = useState(false)
  const [lastRefresh,  setLastRefresh]  = useState<Date>(new Date())

  // Auto-select first spot when spots load
  useEffect(() => {
    if (!selId && spots.length > 0) {
      setSelId(spots[0].id)
    }
  }, [spots, selId])

  // Sync Storm Glass API key
  useEffect(() => {
    setStormGlassKey(settings.stormGlassKey)
  }, [settings.stormGlassKey])

  // Sync dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings.darkMode])

  const selSpot: Spot | undefined =
    spots.find(s => s.id === selId) ?? spots[0]

  // Fetch tide data when spot changes (uses cache, max 1 API call/day/spot)
  useEffect(() => {
    if (selSpot) fetchTideData(selSpot.lat, selSpot.lng)
  }, [selSpot?.id, settings.stormGlassKey])

  // ── Pull-to-refresh ──────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    clearForecastCache()
    setLastRefresh(new Date())
    // Also re-fetch tide
    if (selSpot) fetchTideData(selSpot.lat, selSpot.lng)
    setTimeout(() => setRefreshing(false), 800)
  }, [selSpot])

  // Keyboard shortcut: Cmd/Ctrl + R to refresh data
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        handleRefresh()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleRefresh])

  async function handleAddSpot(spot: Spot) {
    await addSpot(spot)
    setSelId(spot.id)
    // Don't close modal — let user add multiple spots
  }

  async function handleRemoveSpot(id: string) {
    await removeSpot(id)
    if (selId === id) {
      const remaining = spots.filter(s => s.id !== id)
      setSelId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <img src={logoImg} alt="myWind" className="loading-icon-img" />
        <div className="loading-text">Loading myWind…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">
      <TitleBar
        spotName={selSpot?.name}
        country={selSpot?.country}
        model={model}
        onModelChange={setModel}
        mapActive={showMapView}
        onToggleMap={() => setShowMapView(v => !v)}
        enabledModels={settings.enabledModels}
        onSettingsClick={() => setShowSettings(true)}
        darkMode={settings.darkMode}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          spots={spots}
          selectedId={selId ?? ''}
          activeModel={model}
          onSelect={setSelId}
          onRemove={handleRemoveSpot}
          onReorder={reorderSpots}
          onAddClick={() => setShowAdd(true)}
        />

        <main className="flex-1 overflow-auto">
          {refreshing && (
            <div className="ptr-indicator">↻ Refreshing forecast…</div>
          )}
          {selSpot ? (
            <ForecastView
              key={lastRefresh.getTime()}
              spot={selSpot}
              model={model}
              mapView={showMapView}
              allSpots={spots}
              selectedId={selId ?? ''}
              onSpotClick={id => { setSelId(id); setShowMapView(false) }}
              onDayClick={setSelDay}
              settings={settings}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🪁</div>
              <div className="empty-state-title">No spots yet</div>
              <div className="empty-state-sub">Add your first kitespot to see the forecast</div>
              <button className="empty-state-btn" onClick={() => setShowAdd(true)}>
                + Add a spot
              </button>
            </div>
          )}
        </main>
      </div>

      {selSpot && selDay !== null && (
        <HourlyPanel
          spot={selSpot}
          model={model}
          dayOffset={selDay}
          onClose={() => setSelDay(null)}
          onDayChange={setSelDay}
          settings={settings}
        />
      )}

      {showAdd && (
        <AddSpotMap
          mySpotIds={spots.map(s => s.id)}
          onAdd={handleAddSpot}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
