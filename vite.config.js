import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/kma-api': {
        target: 'https://apihub.kma.go.kr',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/kma-api/, '/api'),
      },
      '/khoa-api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/khoa-api/, '/1192136/fcstSkinScubav2'),
      },
      '/khoa-tide-api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/khoa-tide-api/, '/1192136/tideFcstHghLw'),
      },
    },
  },
})
