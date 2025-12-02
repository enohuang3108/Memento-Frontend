import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig(({ mode }: { mode: string }): UserConfig => {
  return {
    server: {
      port: 3000,
    },
    plugins: [
      devtools(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      cloudflare({
        viteEnvironment: { name: 'ssr' },
        // Configure worker name based on mode
        configPath: mode === 'beta' ? 'wrangler.beta.jsonc' : 'wrangler.jsonc'
      }), // must be before tanstackStart()
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
