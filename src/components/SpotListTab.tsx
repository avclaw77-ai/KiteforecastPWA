import { useState, useCallback, memo } from 'react'
import { KNOWN_SPOTS } from '../data/knownSpots'
import { windRating, ratingColor } from '../types'
import type { Spot } from '../types'

// ISO country code → full name for search
const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brazil', CA: 'Canada', CV: 'Cape Verde', DO: 'Dominican Republic',
  EG: 'Egypt', ES: 'Spain', FR: 'France', KE: 'Kenya', LK: 'Sri Lanka',
  LV: 'Latvia', MA: 'Morocco', PE: 'Peru', PH: 'Philippines', TZ: 'Tanzania',
  US: 'United States', VN: 'Vietnam', ZA: 'South Africa',
}

export { COUNTRY_NAMES }

// Normalize: lowercase + strip accents for search matching
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

interface Props {
  addedIds:  Set<string>
  liveWinds: Record<string, { wind: number; gust: number }>
  onAddKnown: (spot: Spot) => void
}

export const SpotListTab = memo(function SpotListTab({ addedIds, liveWinds, onAddKnown }: Props) {
  const [search, setSearch] = useState('')

  const handleAdd = useCallback((spot: typeof KNOWN_SPOTS[0]) => {
    if (addedIds.has(spot.id)) return
    onAddKnown(spot)
  }, [addedIds, onAddKnown])

  const q = norm(search)
  const filtered = !q ? KNOWN_SPOTS : KNOWN_SPOTS.filter(s => {
    const countryFull = COUNTRY_NAMES[s.country.toUpperCase()] || ''
    return (
      norm(s.name).includes(q)      ||
      norm(s.country).includes(q)   ||
      norm(countryFull).includes(q) ||
      norm(s.region).includes(q)
    )
  })

  return (
    <div className="spot-list-wrap">
      <div className="spot-list-search">
        <span className="spot-list-search-icon">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, country or region…"
          className="spot-list-input"
        />
      </div>
      <div className="spot-list">
        {filtered.map(spot => {
          const lw      = liveWinds[spot.id] ?? { wind: spot.wind, gust: spot.gust }
          const color   = ratingColor(windRating(lw.wind))
          const isAdded = addedIds.has(spot.id)
          return (
            <div
              key={spot.id}
              className={['spot-list-row', isAdded ? 'spot-list-row--added' : ''].join(' ')}
              onClick={() => !isAdded && handleAdd(spot)}
            >
              <div className="spot-list-dot" style={{ background: color }} />
              <div className="spot-list-info">
                <div className="spot-list-name">{spot.name}</div>
                <div className="spot-list-meta">{COUNTRY_NAMES[spot.country.toUpperCase()] || spot.country} · {spot.region}</div>
              </div>
              <div className="spot-list-wind">
                <div style={{ color, fontWeight: 700 }}>{lw.wind}</div>
                <div className="spot-list-gust">↑{lw.gust} kts</div>
              </div>
              {isAdded
                ? <span className="spot-list-check">✓</span>
                : <span className="spot-list-plus">+</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
})
