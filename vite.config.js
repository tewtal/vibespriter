import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/vibespriter/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // Ensure default folder is copied to dist
        copyPublicDir: true
    },
    publicDir: 'default'
})
