import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/Music-Recommendation-System/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
            '/api/yt': {
                target: 'https://pipedapi.drgns.space',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api\/yt/, '')
            },
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false
            }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
