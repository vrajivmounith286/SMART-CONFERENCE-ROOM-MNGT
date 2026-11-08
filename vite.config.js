import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        kiosk: resolve(__dirname, 'kiosk.html')
      }
    }
  },
  plugins: [
    {
      name: 'copy-all-assets',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        const filesToCopy = [
          'data.js',
          'views.js',
          'views2.js',
          'views3.js',
          'app.js',
          'app.css',
          'kiosk.css',
          'kiosk.js',
          'firebase-sync.js',
          'google-auth.js'
        ];
        filesToCopy.forEach(file => {
          const srcPath = resolve(__dirname, file);
          const destPath = resolve(distDir, file);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        });
        console.log('[Vite Build] Successfully copied standalone files to dist/');
      }
    }
  ]
});
