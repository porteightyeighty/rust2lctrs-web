import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Served under mattport.com/r2l/ in production; dev uses the same prefix so paths match.
export default defineConfig({
  base: '/r2l/',
  plugins: [vue()],
  server: {
    proxy: {
      '/r2l/v1': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/r2l/, ''),
      },
    },
  },
})
