import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: '/hafez/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // three.js and React change rarely: keep them in their own long-lived chunks so app updates don't re-download them
        manualChunks: id => (id.includes('node_modules/three/') ? 'three' : id.includes('node_modules/react-dom/') || id.includes('node_modules/react/') ? 'react' : undefined),
      },
    },
  },
})
