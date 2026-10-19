import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { apiRouter } from './src/api/router.ts';
import { realtimeHub } from './src/realtime/events.ts';
import { ensureDatabaseSchema } from './src/db/init.ts';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Ensure database tables and initial content exist
  try {
    await ensureDatabaseSchema();
  } catch (err) {
    console.warn('Database auto-initialization check:', err);
  }

  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Real-time WebSocket server
  const wss = new WebSocketServer({ server, path: '/api/ws' });
  realtimeHub.attachWebSocketServer(wss);

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads folder
  const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Mount API Router
  app.use('/api', apiRouter);

  // Vite Dev Server Middleware or Production Static
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Lord Zicco Portfolio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
