import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './src/server/config/env.js';
import { dataStore } from './src/server/data/dataStore.js';
import apiRouter from './src/server/routes/api.js';
import { errorHandler } from './src/server/middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Basic security and parsing
  app.set('trust proxy', 1);
  app.use(cors({
    origin: (origin, callback) => {
      // Allow local development and same-origin requests
      callback(null, true);
    },
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Database / In-Memory Store
  await dataStore.init();

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Vite development integration or static production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Server] Vite middleware mounted for hot-reloading SPA.');
    } catch (viteErr: any) {
      console.error('[Server] Failed to mount Vite middleware:', viteErr.message);
    }
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling
  app.use(errorHandler);

  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 StaffSync HRMS Server running at http://0.0.0.0:${PORT}`);
    console.log(`📡 API Endpoints active at http://0.0.0.0:${PORT}/api`);
    console.log(`💼 Database engine: ${dataStore.isConnectedToAtlas ? 'MongoDB Atlas' : 'Resilient In-Memory'}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot failure:', err);
  process.exit(1);
});
