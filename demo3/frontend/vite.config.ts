import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Everything under /api goes to Spring Boot, including the SSE stream.
      // Same origin for the browser means no CORS config is needed on the backend.
      // SSE needs no special setup: the proxy streams the response as it arrives.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
