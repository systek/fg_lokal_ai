import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to Spring Boot so the browser sees one origin (no CORS setup needed).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
