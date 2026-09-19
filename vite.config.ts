import { defineConfig } from 'vitest/config';

// The optional SUPABASE_* variables let a deployment point at a different
// project than the shared one in src/state/supabase.ts. Empty means "use the
// shared project"; only a full pair overrides it.
export default defineConfig({
  build: { outDir: 'dist', target: 'es2022' },
  define: {
    __SUPABASE_URL__: JSON.stringify(process.env.SUPABASE_URL ?? ''),
    __SUPABASE_PUBLISHABLE_KEY__: JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY ?? ''),
  },
  test: { environment: 'node' },
});
