/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JAZZ_PEER_URL?: string
  readonly VITE_SHOW_JAZZ_INSPECTOR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
