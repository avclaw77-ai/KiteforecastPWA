import { memo, useCallback } from 'react'
import { ALL_MODELS } from '../types'
import type { AppSettings, WindModel, SpeedUnit, HeightUnit, TempUnit } from '../types'

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
  onClose:  () => void
}

const ToggleChip = memo(function ToggleChip({ label, active, color, onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={['toggle-chip', active ? 'toggle-chip--active' : ''].join(' ')}
      style={active && color ? { borderColor: color, color, background: color + '18' } : undefined}
    >
      {label}
    </button>
  )
})

function RadioGroup<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={['radio-btn', value === o.value ? 'radio-btn--active' : ''].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const MODEL_COLORS: Record<string, string> = {
  GFS: '#2563EB', ECMWF: '#10B981', ICON: '#F59E0B',
  MF: '#8B5CF6', GEM: '#EF4444', BLEND: '#6366F1',
}

export const SettingsPanel = memo(function SettingsPanel({ settings, onUpdate, onClose }: Props) {
  const toggleModel = useCallback((m: WindModel) => {
    const cur = settings.enabledModels
    const isEnabled = cur.includes(m)
    if (isEnabled && cur.length <= 1) return
    const next = isEnabled ? cur.filter(x => x !== m) : [...cur, m]
    onUpdate({ enabledModels: next })
  }, [settings.enabledModels, onUpdate])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>

        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="modal-back" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Dark mode */}
          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="settings-label">Appearance</div>
                <div className="settings-hint">{settings.darkMode ? 'Dark mode' : 'Light mode'}</div>
              </div>
              <button
                className={`theme-toggle ${settings.darkMode ? 'theme-toggle--dark' : ''}`}
                onClick={() => onUpdate({ darkMode: !settings.darkMode })}
              >
                <span className="theme-toggle-knob">{settings.darkMode ? '🌙' : '☀️'}</span>
              </button>
            </div>
          </div>

          {/* Models */}
          <div className="settings-section">
            <div className="settings-label">Weather Models</div>
            <div className="settings-hint">Toggle which models appear in the app</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {ALL_MODELS.map(m => (
                <ToggleChip
                  key={m}
                  label={m === 'BLEND' ? '⊕ BLEND' : m}
                  active={settings.enabledModels.includes(m)}
                  color={MODEL_COLORS[m]}
                  onClick={() => toggleModel(m)}
                />
              ))}
            </div>
          </div>

          {/* Speed unit */}
          <div className="settings-section">
            <div className="settings-label">Wind Speed</div>
            <RadioGroup<SpeedUnit>
              options={[
                { value: 'kts',  label: 'Knots' },
                { value: 'mph',  label: 'MPH' },
                { value: 'km/h', label: 'km/h' },
              ]}
              value={settings.speedUnit}
              onChange={v => onUpdate({ speedUnit: v })}
            />
          </div>

          {/* Tide height */}
          <div className="settings-section">
            <div className="settings-label">Tide Height</div>
            <RadioGroup<HeightUnit>
              options={[
                { value: 'm',  label: 'Metres' },
                { value: 'ft', label: 'Feet' },
              ]}
              value={settings.heightUnit}
              onChange={v => onUpdate({ heightUnit: v })}
            />
          </div>

          {/* Temperature */}
          <div className="settings-section">
            <div className="settings-label">Temperature</div>
            <RadioGroup<TempUnit>
              options={[
                { value: '°C', label: '°C' },
                { value: '°F', label: '°F' },
              ]}
              value={settings.tempUnit}
              onChange={v => onUpdate({ tempUnit: v })}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
