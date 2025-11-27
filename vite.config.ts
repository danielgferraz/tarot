import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // A Vercel procura essa pasta 'dist' por padrão
  },
  server: {
    port: 3000
  }
})