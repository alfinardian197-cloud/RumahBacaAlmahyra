import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './src/server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Serve /images, /assets, and legacy /src/assets/images directly in all modes
  app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: '1d' }));
  app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '1d' }));
  app.use(
    '/src/assets/images',
    express.static(path.join(__dirname, 'public', 'images'), { maxAge: '1d' }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist'), { maxAge: '1d' }));
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ALMAHYRA server listening on http://localhost:${PORT}`);
  });
}

startServer();
