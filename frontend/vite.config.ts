import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: le repo s'appelle "bdf_news"
export default defineConfig({
  base: '/bdf_news/',
  plugins: [react()],
})