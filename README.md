# KiteForecast

Multi-model kite wind & tide forecast app — runs as both an **Electron desktop app** and a **PWA** (Progressive Web App) for mobile.

## Features

- 🌊 **5 weather models** (GFS, ECMWF, ICON, MF, GEM) + BLEND algorithm
- 📊 Weekly & hourly wind/gust/tide/temp charts
- 🗺 Google Maps spot picker with geolocation
- 🌊 Real tide data via Storm Glass API (with simulation fallback)
- ⚙ Settings: toggle models, units (kts/mph/km·h, m/ft, °C/°F)
- 📱 Responsive mobile layout for PWA

## Quick Start — PWA (Web)

```bash
npm install
npm run dev:web        # local dev server at localhost:5173
npm run build:web      # production build → dist/
npm run preview:web    # preview production build
```

## Quick Start — Electron (Desktop)

```bash
npm install
npm run dev            # electron dev mode
npm run build:mac      # macOS build
npm run build:win      # Windows build
```

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Settings:
   - **Build Command:** `npx vite build --config vite.config.ts`
   - **Output Directory:** `dist`
   - **Environment Variable:** `VITE_STORMGLASS_KEY` = your key
   - **Environment Variable:** `VITE_GMAP_KEY` = your key
4. Deploy → open on iPhone → Share → "Add to Home Screen"

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_STORMGLASS_KEY` | Storm Glass API key (free at [stormglass.io](https://stormglass.io), 10 req/day) |
| `VITE_GMAP_KEY` | Google Maps API key |

Create a `.env` file in the project root:
```
VITE_STORMGLASS_KEY=your-key-here
VITE_GMAP_KEY=your-key-here
```

## Tech Stack

- React 19 + TypeScript
- Recharts (charts)
- Google Maps JavaScript API
- Storm Glass Tide API
- Vite (web build) / electron-vite (desktop build)
