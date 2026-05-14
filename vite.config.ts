import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    port: 5173,
    // Fail loudly if 5173 is busy instead of silently moving to 5174. The
    // Supabase Site URL is pinned to :5173, so a port drift would point users
    // at the wrong app and break the OAuth/magic-link flow.
    strictPort: true,
  },
})
