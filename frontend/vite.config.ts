import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: ton repo s'appelle "veille" → base '/veille/'
export default defineConfig({
  base: '/veille/',
  plugins: [react()],
})