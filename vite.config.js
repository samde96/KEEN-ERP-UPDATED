import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['gsap']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://keen-erp-portal-backend.onrender.com/',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://keen-erp-portal-backend.onrender.com/uploads',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
});
