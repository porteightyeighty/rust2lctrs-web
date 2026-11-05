import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Served under mattport.com/rust2lctrs/demo/ in production; dev uses the same prefix so paths match.
export default defineConfig({
  base: '/rust2lctrs/demo/',
  plugins: [vue()],
  server: {
    proxy: {
      '/rust2lctrs/demo/v1': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/rust2lctrs\/demo/, ''),
      },
    },
  },
})
