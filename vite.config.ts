import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const filesToExclude = ["src/backend"]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        ...filesToExclude
      ]
    }
  }
})
