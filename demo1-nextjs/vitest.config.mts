import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resolves the "@/..." imports from tsconfig.json.
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node', // the tests call route handlers directly, no browser needed
  },
})
