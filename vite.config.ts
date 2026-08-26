import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/admin': {
        target: 'http://100.122.220.40:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://100.122.220.40:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
