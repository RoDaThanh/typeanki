import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Allows using 'describe', 'test', 'expect' without importing
    environment: 'jsdom', // Use the browser-like environment
  },
})
