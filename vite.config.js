import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({
    include: '**/*.{jsx,js,ts,tsx}',
    jsxRuntime: 'automatic',
    babel: {
      plugins: [
        ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
      ]
    }
  })],
  
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx'
      },
      jsx: 'automatic'
    },
    // Forzar la inclusión de dependencias para evitar problemas de compatibilidad
    include: [
      'react',
      'react-dom',
      '@chakra-ui/react',
      'framer-motion',
      '@emotion/react',
      '@emotion/styled'
    ],
    // Excluir dependencias problemáticas
    exclude: ['@supabase/supabase-js', 'react-router-dom']
  },
  
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // Mejorar la compatibilidad con diferentes versiones de React
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chakra-vendor': ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion']
        }
      }
    }
  },
  // Configuración del servidor
  server: {
    port: 5173,
    hmr: {
      timeout: 10000 // Aumentado para dar más tiempo durante el desarrollo
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        timeout: 120000
      }
    }
  },
  resolve: {
    alias: {
      // Alias para los componentes de Horizon UI
      'components': path.resolve(__dirname, './horizon-ui-chakra/src/components'),
      '@': path.resolve(__dirname, './horizon-ui-chakra/src'),
      'variables': path.resolve(__dirname, './horizon-ui-chakra/src/variables'),
      'assets': path.resolve(__dirname, './horizon-ui-chakra/src/assets'),
      'views': path.resolve(__dirname, './horizon-ui-chakra/src/views'),
      // Alias para asegurar que se use una sola instancia de React
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      '@chakra-ui/react': path.resolve(__dirname, './node_modules/@chakra-ui/react'),
      'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
      'framer-motion': path.resolve(__dirname, './node_modules/framer-motion')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    mainFields: ['browser', 'module', 'main']
  },
  define: {
    global: 'globalThis',
    'window.global': 'globalThis',
    'process.browser': true,
    'process.env': {}
  },
  
  // Configuración para mejorar la carga de recursos
  css: {
    devSourcemap: true
  }
})
