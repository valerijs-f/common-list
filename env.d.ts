/// <reference types="vite/client" />

import "vue-router"

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

interface ImportMetaEnv {
  readonly VITE_JAZZ_PEER_URL?: string
  readonly VITE_SHOW_JAZZ_INSPECTOR?: string
  readonly VITE_JAZZ_PASSKEY_HOSTNAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
