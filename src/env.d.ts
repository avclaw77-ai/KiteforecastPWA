/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORMGLASS_KEY?: string
  readonly VITE_GMAP_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
