import path, {join} from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@render': join(__dirname, '.'),
    },
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/render'),
    emptyOutDir: true,
  },
})
