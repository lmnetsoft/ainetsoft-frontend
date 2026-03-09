import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Fixes "global is not defined"
    global: 'window',
    // Some versions of sockjs-client look for process.env
    'process.env': {},
  },
  optimizeDeps: {
    // Force Vite to pre-bundle these to avoid 504 "Outdated Optimize Dep"
    include: ['sockjs-client', 'stompjs'],
  },
  server: {
    watch: {
      usePolling: true, 
      interval: 100,    
    },
    host: true,         
    hmr: {
      overlay: true,    
    }
  }
})