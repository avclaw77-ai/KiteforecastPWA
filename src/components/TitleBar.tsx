import type { WindModel } from '../types'
import { ALL_MODELS } from '../types'

interface Props {
  spotName?:       string
  country?:        string
  model:           WindModel
  onModelChange:   (m: WindModel) => void
  mapActive:       boolean
  onToggleMap:     () => void
  enabledModels:   WindModel[]
  onSettingsClick: () => void
}

export function TitleBar({
  model, onModelChange, enabledModels, onSettingsClick,
}: Props) {
  const visibleModels = ALL_MODELS.filter(m => enabledModels.includes(m))

  return (
    <header className="titlebar">
      <div className="titlebar-traffic-light-spacer" />

      {/* Row 1: Brand + settings */}
      <div className="titlebar-top">
        <div className="titlebar-brand">
          <span className="titlebar-logo">🪁</span>
          <span className="titlebar-title">KiteForecast</span>
        </div>
        <button className="settings-btn no-drag" onClick={onSettingsClick}>
          ⚙
        </button>
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
