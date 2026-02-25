import type { WindModel } from '../types'
import { ALL_MODELS } from '../types'
import logoImg from '../assets/icons/logo-64.png'

interface Props {
  spotName?:       string
  country?:        string
  model:           WindModel
  onModelChange:   (m: WindModel) => void
  mapActive:       boolean
  onToggleMap:     () => void
  enabledModels:   WindModel[]
  onSettingsClick: () => void
  onRefresh?:      () => void
  refreshing?:     boolean
}

export function TitleBar({
  model, onModelChange, enabledModels, onSettingsClick, onRefresh, refreshing,
}: Props & { darkMode?: boolean }) {
  const visibleModels = ALL_MODELS.filter(m => enabledModels.includes(m))

  return (
    <header className="titlebar">
      <div className="titlebar-traffic-light-spacer" />

      {/* Row 1: Brand + actions */}
      <div className="titlebar-top">
        <div className="titlebar-brand">
          <img src={logoImg} alt="myWind" className="titlebar-logo-img" />
          <span className="titlebar-title">myWind</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {onRefresh && (
            <button
              className="settings-btn no-drag"
              onClick={onRefresh}
              title="Refresh forecast data"
              style={refreshing ? { animation: 'spin .8s linear infinite' } : undefined}
            >
              ↻
            </button>
          )}
          <button className="settings-btn no-drag" onClick={onSettingsClick}>
            ⚙︎
          </button>
        </div>
      </div>

      {/* Row 2: Model selector */}
      <nav className="titlebar-models no-drag">
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
      </nav>
    </header>
  )
}
