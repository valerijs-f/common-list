import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const enableVueDevtools = env.ENABLE_VUE_DEVTOOLS === 'true'

  return {
    /** Expose server-only .env keys the app reads via `import.meta.env` (Vite only ships `VITE_*` by default). */
    define: {
      "import.meta.env.JAZZ_PEER_URL": JSON.stringify(env.JAZZ_PEER_URL ?? ""),
      "import.meta.env.ENABLE_JAZZ_INSPECTOR": JSON.stringify(env.ENABLE_JAZZ_INSPECTOR ?? ""),
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'jazz-inspector',
          },
        },
      }),
      ...(enableVueDevtools ? [vueDevTools()] : []),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
