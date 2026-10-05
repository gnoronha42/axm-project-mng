import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_TARGET ?? 'http://76.13.234.226:8085'

export default defineConfig({
  base: '/app/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
