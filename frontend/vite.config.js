import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/setupTests.js',
    css: false,           // skip CSS processing in tests (speeds up runs)
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/assets/**'],
    },
  },
})
