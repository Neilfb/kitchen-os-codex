import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(rootDir, 'apps/allerq'),
      '@components': resolve(rootDir, 'packages/ui/components'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['**/tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
})
