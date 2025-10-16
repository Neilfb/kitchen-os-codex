import { defineConfig, mergeConfig } from 'vitest/config'
import { resolve } from 'node:path'

import baseConfig from '../../vitest.config'

const config = mergeConfig(
  baseConfig,
  defineConfig({
    root: __dirname,
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
        '@components': resolve(__dirname, '../../packages/ui/components'),
      },
    },
  })
)

if (!config.test) {
  config.test = {}
}

config.test.include = ['tests/**/*.test.ts']

export default config
