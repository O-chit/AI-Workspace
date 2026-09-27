import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { execSync } from 'child_process';

function expressBackendPlugin(): Plugin {
  return {
    name: 'express-backend-plugin',
    async configureServer(server) {
      try {
        const backendDir = path.resolve(__dirname, '../backend');
        const appPath = path.resolve(backendDir, 'dist/app.js');
        const dbPath = path.resolve(backendDir, 'dist/config/db.js');

        // Ensure backend is compiled
        if (!fs.existsSync(appPath) || !fs.existsSync(dbPath)) {
          console.log('📦 [Lumina AI] Compiling backend TypeScript to dist...');
          execSync('npm run build', { cwd: backendDir, stdio: 'inherit' });
        }

        // Import compiled backend modules via native Node ESM
        const { connectDB } = await import(pathToFileURL(dbPath).href);
        const { createApp } = await import(pathToFileURL(appPath).href);

        await connectDB();
        const app = createApp();

        // Mount Express application on Vite Connect middleware
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          if (url.startsWith('/api') || url.startsWith('/uploads')) {
            (app as any)(req, res, next);
          } else {
            next();
          }
        });

        console.log('🚀 [Lumina AI] Backend logic embedded directly into Vite server on port 5173!');
      } catch (error) {
        console.error('❌ [Lumina AI] Failed to mount backend app into Vite:', error);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), expressBackendPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
