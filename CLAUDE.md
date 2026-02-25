# myWind — Project Brief for Claude Code

## Overview
myWind is a wind/weather forecast PWA built with React + TypeScript + Vite. It targets kitesurfers and water sports enthusiasts, showing multi-model wind forecasts for user-saved spots. Deployed on Vercel as a PWA, also packaged as Electron for desktop.

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite
- **Charts:** Recharts
- **Maps:** Google Maps (inline iframe + AddSpotMap component)
- **API:** Open-Meteo (free, no key) — GFS, ECMWF, ICON, MF, GEM endpoints
- **Tide:** Simulated tidal model (src/api/tide.ts)
- **Styling:** Global CSS with CSS variables (src/styles/global.css), minimal Tailwind utilities
- **PWA:** Service worker (public/sw.js), manifest (public/manifest.json)
- **Electron:** electron/main.ts (optional desktop build)

## Architecture
```
src/
  App.tsx              — Main app shell, state management, spot CRUD
  api/
    openmeteo.ts       — All weather API calls, BLEND algorithm, caching, retry logic
    tide.ts            — Tidal simulation
  components/
    TitleBar.tsx        — Header: logo, model selector, settings/refresh buttons
    Sidebar.tsx         — Spot list with live wind preview, drag-reorder
    ForecastView.tsx    — Weekly view: day cards, wind/temp/precip charts
    HourlyPanel.tsx     — Daily detail modal: hourly wind, tide, sunrise/sunset
    ModelComparison.tsx — Multi-model overlay chart
    ComboTable.tsx      — Tabular hourly data
    AddSpotMap.tsx      — Google Maps spot picker
    SettingsPanel.tsx   — User preferences (units, models, dark mode)
  hooks/
    useForecast.ts      — Daily forecast fetcher
    useHourlyForecast.ts— Hourly forecast fetcher
    useLiveWind.ts      — Simulated live wind jitter for sidebar
  types.ts             — Shared types, model definitions, unit conversion
  styles/
    global.css          — All styling (variables, dark mode, responsive, animations)
```

## Key Patterns
- **Multi-model BLEND:** Weighted average of 5 weather models with circular mean for wind direction (src/api/openmeteo.ts)
- **Caching:** 15-min TTL in-memory cache + in-flight request dedup to avoid duplicate API calls
- **Retry:** `fetchWithRetry()` handles 429 rate limits with exponential backoff
- **Dark mode:** CSS variables toggled via `[data-theme="dark"]`
- **Responsive:** Mobile-first, sidebar collapses to bottom sheet on <769px
- **Spots:** Stored in localStorage (`mywind-spots`, `mywind-settings`)

## Build & Run
```bash
npm install
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build (dist/)
npm run electron:dev # Electron dev mode
```

## Known Performance Issues to Address
1. **ModelComparison re-renders:** Fetches all 5 models via separate `useForecast` hooks — triggers on any model/spot change even when data is cached
2. **Tide recalculation:** `tideAt()` called per-hour per-render, could be memoized
3. **Chart re-renders:** Recharts components re-render on parent state changes even when data hasn't changed — needs React.memo or useMemo wrappers
4. **ForecastView sections:** All sections render even when scrolled off-screen
5. **CSS bundle:** Single large global.css file — could benefit from code-splitting or CSS modules

## Optimization Goals
- Reduce unnecessary re-renders (React DevTools Profiler)
- Memoize expensive computations (BLEND, tide, chart data transforms)
- Lazy-load below-fold sections
- Minimize API calls on spot/model switch (leverage cache better)
- Consider React.memo for chart wrapper components
- Clean up unused CSS and consolidate duplicate rules
