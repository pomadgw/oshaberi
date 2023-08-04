// eslint-disable-next-line @typescript-eslint/triple-slash-reference

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
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
