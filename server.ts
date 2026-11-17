import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_DB } from './src/data/defaultDb';
import type { AlmahyraDatabase } from './src/types/almahyra';
import {
  authenticateUser,
  extractSpreadsheetId,
  hydrateDatabaseWithDefaults,
} from './src/utils/almahyra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'almahyra-db.json');

async function ensureDb(): Promise<AlmahyraDatabase> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AlmahyraDatabase>;
    return hydrateDatabaseWithDefaults(parsed, DEFAULT_DB);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    return structuredClone(DEFAULT_DB);
  }
}

async function saveDb(db: AlmahyraDatabase): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'ALMAHYRA App' });
  });

  app.get('/api/db', async (_req, res) => {
    try {
      const db = await ensureDb();
      res.json(db);
    } catch (error) {
      console.error('GET /api/db error:', error);
      res.status(500).json({ error: 'Gagal memuat database lokal.' });
    }
  });

  app.put('/api/db', async (req, res) => {
    try {
      const payload = req.body as AlmahyraDatabase;
      if (!payload || !payload.config || !Array.isArray(payload.members)) {
        res.status(400).json({ error: 'Format data database tidak valid.' });
        return;
      }
      await saveDb(payload);
      res.json({ ok: true, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('PUT /api/db error:', error);
      res.status(500).json({ error: 'Gagal menyimpan database.' });
    }
  });

  app.post('/api/db/reset', async (_req, res) => {
    try {
      const fresh = structuredClone(DEFAULT_DB);
      await saveDb(fresh);
      res.json(fresh);
    } catch (error) {
      console.error('POST /api/db/reset error:', error);
      res.status(500).json({ error: 'Gagal mereset database.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body ?? {};
      const db = await ensureDb();
      const session = authenticateUser(String(username ?? ''), String(password ?? ''), db);
      if (!session) {
        res.status(401).json({
          error: 'Username / Nomor Induk Anggota atau kata sandi tidak cocok.',
        });
        return;
      }
      res.json({ session });
    } catch (error) {
      console.error('POST /api/auth/login error:', error);
      res.status(500).json({ error: 'Terjadi kesalahan saat memverifikasi akun.' });
    }
  });

  // Server-side proxy to read publicly shared Google Sheets without CORS errors
  app.get('/api/sheets/public-fetch', async (req, res) => {
    try {
      const rawId = String(req.query.spreadsheetId ?? '');
      const sheet = String(req.query.sheet ?? '');
      const spreadsheetId = extractSpreadsheetId(rawId);
      if (!spreadsheetId || !sheet) {
        res.status(400).json({ error: 'spreadsheetId dan nama sheet wajib diisi.' });
        return;
      }

      const gvizUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
        spreadsheetId,
      )}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;

      const response = await fetch(gvizUrl);
      if (!response.ok) {
        res.status(response.status).json({ error: 'Gagal mengambil data sheet publik.' });
        return;
      }

      const text = await response.text();
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
      if (!jsonMatch) {
        res.status(404).json({ error: 'Format sheet tidak dikenali atau sheet belum dibuka untuk publik.' });
        return;
      }

      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.status === 'error') {
        res.status(404).json({ error: parsed.errors?.[0]?.detailed_message || 'Tab sheet tidak ditemukan.' });
        return;
      }

      const cols: string[] = (parsed.table?.cols ?? []).map(
        (c: { label?: string; id?: string }) => c.label || c.id || '',
      );
      const dataRows: string[][] = (parsed.table?.rows ?? []).map(
        (row: { c?: Array<{ v?: unknown; f?: string } | null> }) =>
          (row.c ?? []).map((cell) => {
            if (!cell) return '';
            if (cell.f !== undefined && cell.f !== null) return String(cell.f);
            if (cell.v !== undefined && cell.v !== null) return String(cell.v);
            return '';
          }),
      );

      res.json({ rows: [cols, ...dataRows] });
    } catch (error) {
      console.error('GET /api/sheets/public-fetch error:', error);
      res.status(500).json({ error: 'Gagal membaca Google Sheet publik.' });
    }
  });

  // Serve /images, /assets, and legacy /src/assets/images directly in all modes
  app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: '1d' }));
  app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '1d' }));
  app.use('/src/assets/images', express.static(path.join(__dirname, 'public', 'images'), { maxAge: '1d' }));

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
