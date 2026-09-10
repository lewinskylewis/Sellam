import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Vercel exposes these as plain process.env vars during the build (they are
// NOT prefixed VITE_, so Vite doesn't pick them up automatically) — inject
// them as build-time globals so Settings' System section can show real
// commit/environment/build-time info instead of a hardcoded version string.
// Undefined locally (`npm run dev`), which SystemSection.tsx treats as "not
// running on Vercel" rather than faking a value.
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA
const vercelEnv = process.env.VERCEL_ENV

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5183,
  },
  define: {
    __SELLAM_BUILD_SHA__: JSON.stringify(commitSha ? commitSha.slice(0, 7) : null),
    __SELLAM_BUILD_ENV__: JSON.stringify(vercelEnv ?? null),
    __SELLAM_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
