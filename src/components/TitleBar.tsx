import { memo, useMemo } from 'react'
import type { WindModel } from '../types'
import { ALL_MODELS } from '../types'
import logoImg from '../assets/icons/logo-128.png'

interface Props {
  spotName?:       string
  country?:        string
  model:           WindModel
  onModelChange:   (m: WindModel) => void
  mapActive:       boolean
  onToggleMap:     () => void
  enabledModels:   WindModel[]
  onSettingsClick: () => void
  onAddSpot?:      () => void
  onRefresh?:      () => void
  refreshing?:     boolean
}

export const TitleBar = memo(function TitleBar({
  model, onModelChange, enabledModels, onSettingsClick, onAddSpot, onRefresh, refreshing,
}: Props & { darkMode?: boolean }) {
  const visibleModels = useMemo(
    () => ALL_MODELS.filter(m => enabledModels.includes(m)),
    [enabledModels]
  )

  return (
    <header className="titlebar">
      <div className="titlebar-traffic-light-spacer" />

      {/* Single row: Brand | Models | Actions */}
      <div className="titlebar-row">
        <div className="titlebar-brand">
          <img src={logoImg} alt="myWind" className="titlebar-logo-img" />
          <span className="titlebar-title">myWind</span>
        </div>

        <nav className="titlebar-models no-drag">
          <div className="titlebar-models-wrap">
            {visibleModels.map(m => {
              const isBlend  = m === 'BLEND'
              const isActive = model === m
              return (
                <button
                  key={m}
                  onClick={() => onModelChange(m)}
                  className={[
                    'model-btn',
                    isBlend  ? 'model-btn--blend'  : '',
                    isActive ? 'model-btn--active'  : '',
                    isActive && isBlend ? 'model-btn--blend-active' : '',
                  ].join(' ')}
                >
                  {isBlend ? '⊕ BLEND' : m}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="titlebar-actions">
          {onAddSpot && (
            <button
              className="add-spot-btn-header no-drag"
              onClick={onAddSpot}
            >
              + Add spot
            </button>
          )}
          {onRefresh && (
            <button
              className="settings-btn no-drag"
              onClick={onRefresh}
              title="Refresh forecast data"
              aria-label="Refresh forecast"
              style={refreshing ? { animation: 'spin .8s linear infinite' } : undefined}
            >
              ↻
            </button>
          )}
          <button className="settings-btn no-drag" onClick={onSettingsClick} aria-label="Settings">
            ⚙︎
          </button>
        </div>
      </div>
    </header>
  )
})
