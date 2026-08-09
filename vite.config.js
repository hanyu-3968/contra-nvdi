import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对路径, 兼容 GitHub Pages 子路径部署 (/<repo-name>/)
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  }
})
