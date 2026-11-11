import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

// Next's rules, which take in TypeScript's recommended ones, for both workspaces
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: 'web/' } } },
  globalIgnores(['**/.next/**', 'web/next-env.d.ts', '**/sorlo-types.d.ts', 'cms/content/**', 'cms/storage/**']),
])
