import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/web/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React
            'vendor-react': ['react', 'react-dom'],
            // Supabase
            'vendor-supabase': ['@supabase/supabase-js'],
            // UI / Radix
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-slot',
              'class-variance-authority',
              'clsx',
              'tailwind-merge',
            ],
            // State
            'vendor-state': ['zustand'],
            // Forms
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Export tools (large, rarely used - load separately)
            'vendor-export': ['jspdf', 'jspdf-autotable', 'papaparse'],
            // Table virtualization
            'vendor-virtual': ['@tanstack/react-virtual'],
            // Misc
            'vendor-misc': ['sonner', 'date-fns', 'lucide-react'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
