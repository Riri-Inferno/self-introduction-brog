import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vite の設定
// 開発中は、ブラウザからの /api をバックエンドに流す(ADR 0019)
// ブラウザから見ると同じオリジンになるので、CORS の設定は要らない

// 流す先。コンテナでは docker-compose.yml で http://backend:3000 を指定する
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // コンテナの外(ホストのブラウザ)から届くようにする
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': apiTarget,
    },
    watch: {
      // /mnt/c ではファイルの変更が通知されないので、ポーリングで検知する(ADR 0019)
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
      interval: 1000,
    },
  },
})
