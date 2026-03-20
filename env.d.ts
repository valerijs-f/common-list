/// <reference types="vite/client" />

import "vue-router"

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

interface ImportMetaEnv {
  readonly JAZZ_PEER_URL?: string
  readonly ENABLE_JAZZ_INSPECTOR?: string
  readonly JAZZ_PASSKEY_HOSTNAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
