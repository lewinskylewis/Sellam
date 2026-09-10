/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected by vite.config.ts's `define` from Vercel's build-time env vars —
// see SystemSection.tsx.
declare const __SELLAM_BUILD_SHA__: string | null;
declare const __SELLAM_BUILD_ENV__: string | null;
declare const __SELLAM_BUILD_TIME__: string;
