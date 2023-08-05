// eslint-disable-next-line @typescript-eslint/triple-slash-reference

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), wasm(), topLevelAwait()],
  build: {
    manifest: true,
    outDir: '../dist',
    rollupOptions: {
      input: './src/main.ts'
    }
  },
  test: {
    environment: 'happy-dom'
  }
})
