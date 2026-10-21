import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb } from './server/db.js';
import { seedDemoData } from './server/seedData.js';
import { apiRouter } from './server/routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON Body parser with generous limit for prescription image uploads (base64)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize SQLite database and seed initial demo data
  await getDb();
  seedDemoData();

  // API Router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', name: 'UyirThunai', timestamp: new Date().toISOString() });
  });

  const distPath = path.resolve(__dirname, 'dist');
  const distIndexHtml = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexHtml);

  // Auto-detect production mode (Render environment, explicit production NODE_ENV, or prebuilt dist)
  const isRender = process.env.RENDER === 'true';
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    isRender ||
    (hasDist && process.env.NODE_ENV !== 'development');

  if (isProduction) {
    // If running in production but dist wasn't built beforehand (e.g. Render build command omitted),
    // build Vite assets automatically so the site never serves unstyled or missing files.
    if (!fs.existsSync(distIndexHtml)) {
      console.log('Production detected but dist/index.html not found. Executing automatic vite build...');
      try {
        const { execSync } = await import('child_process');
        execSync('npx vite build', { stdio: 'inherit' });
        console.log('Vite build completed successfully.');
      } catch (err) {
        console.error('Automatic vite build error:', err);
      }
    }

    if (fs.existsSync(distIndexHtml)) {
      // 1. Explicitly serve compiled static assets with proper MIME types & caching.
      // fallthrough: false ensures missing assets respond with 404 rather than index.html,
      // which prevents browser strict MIME type errors on CSS/JS files!
      app.use('/assets', express.static(path.resolve(distPath, 'assets'), {
        immutable: true,
        maxAge: '1y',
        fallthrough: false,
      }));

      // 2. Serve static root files (favicon, manifest, _redirects, etc.)
      app.use(express.static(distPath));

      // 3. Catch-all route for SPA navigation (only serve index.html for page routes, not API or assets)
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
          return res.status(404).json({ error: 'Asset or endpoint not found' });
        }
        res.sendFile(distIndexHtml);
      });
    } else {
      console.warn('Warning: dist/index.html still missing in production mode.');
    }
  } else {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UyirThunai server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
