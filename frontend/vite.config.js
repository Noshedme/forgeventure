import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@mediapipe/pose", "@mediapipe/camera_utils"],
  },
  server: {
    headers: {
      // Permite que el popup de Google Auth comunique de vuelta al padre
      // "same-origin" (default del browser) bloquea window.closed del popup
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
