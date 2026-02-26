import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // This forces Vite to check for file updates
      interval: 100,    // Checks every 100ms
    },
    host: true,         // Allows network access
    hmr: {
      overlay: true,    // Shows errors directly in the browser
    }
  }
})