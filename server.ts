import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_DB } from './src/data/defaultDb';
import type {
  AlmahyraDatabase,
  AuthSession,
  CreationCategory,
  CreationWork,
} from './src/types/almahyra';
import {
  authenticateUser,
  clampValidatedReadingPoints,
  CREATION_CATEGORIES,
  extractSpreadsheetId,
  hydrateDatabaseWithDefaults,
  recordBookReadingAction,
  sanitizeDatabaseForClient,
} from './src/utils/almahyra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'almahyra-db.json');
const TOKEN_SECRET =
  process.env.ALMAHYRA_SESSION_SECRET ||
  crypto.randomBytes(32).toString('hex');

interface TokenPayload {
  role: AuthSession['role'];
  username: string;
  displayName: string;
  memberId?: string;
  nomorInduk?: string;
  exp: number;
}

function signSessionToken(session: AuthSession): string {
  const payload: TokenPayload = {
    role: session.role,
    username: session.username,
    displayName: session.displayName,
    memberId: session.memberId,
    nomorInduk: session.nomorInduk,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyBearerSession(authHeader: string | undefined): AuthSession | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const rawToken = authHeader.slice('Bearer '.length).trim();
  const [encoded, sig] = rawToken.split('.');
  if (!encoded || !sig) return null;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as TokenPayload;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return {
      role: parsed.role,
      username: parsed.username,
      displayName: parsed.displayName,
      memberId: parsed.memberId,
      nomorInduk: parsed.nomorInduk,
    };
  } catch {
    return null;
  }
}

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
    res.json({ status: 'ok', app: 'ALMAHYRA APP — Rumah Baca Almahyra' });
  });

  app.get('/api/db', async (req, res) => {
    try {
      const db = await ensureDb();
      const caller = verifyBearerSession(req.headers.authorization);
      res.json(sanitizeDatabaseForClient(db, caller));
    } catch (error) {
      console.error('GET /api/db error:', error);
      res.status(500).json({ error: 'Gagal memuat database lokal.' });
    }
  });

  app.put('/api/db', async (req, res) => {
    try {
      const caller = verifyBearerSession(req.headers.authorization);
      if (!caller) {
        res.status(401).json({ error: 'Autentikasi diperlukan untuk memperbarui database.' });
        return;
      }
      if (caller.role !== 'admin' && caller.role !== 'superadmin') {
        res.status(403).json({ error: 'Hanya Admin atau Superadmin yang berwenang mengubah database.' });
        return;
      }

      const payload = req.body as AlmahyraDatabase;
      if (!payload || !payload.config || !Array.isArray(payload.members) || !Array.isArray(payload.books)) {
        res.status(400).json({ error: 'Format data database tidak valid.' });
        return;
      }

      // Preserve stored passwords when incoming sanitized records carry empty strings
      const existing = await ensureDb();
      const existingAdminsById = new Map(existing.admins.map((a) => [a.id, a]));
      const existingMembersById = new Map(existing.members.map((m) => [m.id, m]));

      const mergedAdmins =
        Array.isArray(payload.admins) && payload.admins.length > 0
          ? payload.admins.map((a) => ({
              ...a,
              password: a.password?.trim() ? a.password : (existingAdminsById.get(a.id)?.password ?? 'admin123'),
            }))
          : existing.admins;

      const mergedMembers = payload.members.map((m) => ({
        ...m,
        password: m.password?.trim() ? m.password : (existingMembersById.get(m.id)?.password ?? '123'),
      }));

      await saveDb({
        ...payload,
        admins: mergedAdmins,
        members: mergedMembers,
      });
      res.json({ ok: true, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('PUT /api/db error:', error);
      res.status(500).json({ error: 'Gagal menyimpan database.' });
    }
  });

  app.post('/api/db/reset', async (req, res) => {
    try {
      const caller = verifyBearerSession(req.headers.authorization);
      if (!caller) {
        res.status(401).json({ error: 'Autentikasi diperlukan untuk mereset database.' });
        return;
      }
      if (caller.role !== 'superadmin' && caller.role !== 'admin') {
        res.status(403).json({ error: 'Hanya pengelola yang dapat mereset database.' });
        return;
      }
      const fresh = structuredClone(DEFAULT_DB);
      await saveDb(fresh);
      res.json(sanitizeDatabaseForClient(fresh, caller));
    } catch (error) {
      console.error('POST /api/db/reset error:', error);
      res.status(500).json({ error: 'Gagal mereset database.' });
    }
  });

  app.post('/api/reading/record', async (req, res) => {
    try {
      const caller = verifyBearerSession(req.headers.authorization);
      const body = req.body ?? {};
      const bookId = String(body.bookId ?? '').trim();
      if (!bookId) {
        res.status(400).json({ error: 'bookId wajib diisi.' });
        return;
      }

      const db = await ensureDb();
      if (!db.books.some((b) => b.id === bookId)) {
        res.status(404).json({ error: 'Buku tidak ditemukan di katalog.' });
        return;
      }

      const viewerKey = caller?.nomorInduk || 'guest';
      const safeAwardPoints = caller?.role === 'anggota'
        ? clampValidatedReadingPoints(body.awardPoints)
        : 0;
      const starNum = Number(body.starRating);
      const safeStar = Number.isFinite(starNum) ? Math.min(5, Math.max(1, Math.round(starNum))) : undefined;

      const updated = recordBookReadingAction(db, {
        viewerKey,
        bookId,
        lastPage: Math.max(0, Number(body.lastPage) || 0),
        totalPages: Math.max(1, Number(body.totalPages) || 1),
        completed: Boolean(body.completed),
        quizScore:
          typeof body.quizScore === 'number'
            ? Math.min(100, Math.max(0, Math.round(body.quizScore)))
            : undefined,
        journalNote:
          typeof body.journalNote === 'string'
            ? body.journalNote.trim().slice(0, 600)
            : undefined,
        starRating: safeStar,
        toggleFavorite: Boolean(body.toggleFavorite),
        awardPoints: safeAwardPoints,
      });

      await saveDb(updated);
      res.json({ ok: true, db: sanitizeDatabaseForClient(updated, caller) });
    } catch (error) {
      console.error('POST /api/reading/record error:', error);
      res.status(500).json({ error: 'Gagal mencatat aktivitas baca.' });
    }
  });

  app.post('/api/creations', async (req, res) => {
    try {
      const caller = verifyBearerSession(req.headers.authorization);
      const body = req.body ?? {};
      const judul = String(body.judul ?? '').trim().slice(0, 120);
      const kategori = String(body.kategori ?? '').trim() as CreationCategory;
      const namaSamaran = String(body.namaSamaran ?? '').trim().slice(0, 40);
      const jenjangUsia = String(body.jenjangUsia ?? 'SD').trim().slice(0, 20);
      const ringkasan = String(body.ringkasan ?? '').trim().slice(0, 240);
      const konten = String(body.konten ?? '').trim().slice(0, 2500);
      const imageUrl = typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : undefined;

      if (!judul || !namaSamaran || !konten) {
        res.status(400).json({ error: 'Judul, nama panggilan/samaran, dan isi karya wajib diisi.' });
        return;
      }
      if (!CREATION_CATEGORIES.includes(kategori)) {
        res.status(400).json({ error: 'Kategori karya tidak valid.' });
        return;
      }

      const db = await ensureDb();
      const isStaff = caller?.role === 'admin' || caller?.role === 'superadmin';
      const newWork: CreationWork = {
        id: `cr-${Date.now()}`,
        judul,
        kategori,
        namaSamaran,
        jenjangUsia,
        memberNomorInduk: caller?.nomorInduk,
        ringkasan: ringkasan || konten.slice(0, 120),
        konten,
        imageUrl,
        createdAt: new Date().toISOString().slice(0, 10),
        parentApproved: isStaff ? true : false,
        moderationStatus: isStaff ? 'approved' : 'pending',
        catatanModerator: isStaff ? 'Diterbitkan pengelola.' : 'Menunggu persetujuan orang tua & moderasi admin.',
      };

      const updated: AlmahyraDatabase = {
        ...db,
        creations: [newWork, ...(db.creations ?? [])],
      };
      await saveDb(updated);
      res.status(201).json({ ok: true, creation: newWork, db: sanitizeDatabaseForClient(updated, caller) });
    } catch (error) {
      console.error('POST /api/creations error:', error);
      res.status(500).json({ error: 'Gagal mengirim karya.' });
    }
  });

  app.patch('/api/creations/:id/moderate', async (req, res) => {
    try {
      const caller = verifyBearerSession(req.headers.authorization);
      if (!caller) {
        res.status(401).json({ error: 'Silakan masuk terlebih dahulu.' });
        return;
      }
      const { id } = req.params;
      const { action, catatan } = req.body ?? {};
      const db = await ensureDb();
      const target = (db.creations ?? []).find((c) => c.id === id);
      if (!target) {
        res.status(404).json({ error: 'Karya tidak ditemukan.' });
        return;
      }

      const isStaff = caller.role === 'admin' || caller.role === 'superadmin';
      const isOwnerFamily = Boolean(
        caller.nomorInduk &&
          target.memberNomorInduk?.toUpperCase() === caller.nomorInduk.toUpperCase(),
      );

      let nextWork: CreationWork = { ...target };
      if (action === 'parent-approve') {
        if (!isOwnerFamily && !isStaff) {
          res.status(403).json({ error: 'Hanya orang tua/wali atau admin yang berwenang menyetujui publikasi karya ini.' });
          return;
        }
        nextWork = {
          ...nextWork,
          parentApproved: !target.parentApproved,
          catatanModerator: !target.parentApproved
            ? 'Disetujui oleh Orang Tua/Wali.'
            : 'Persetujuan publikasi ditahan oleh Orang Tua/Wali.',
        };
      } else if (action === 'approve' || action === 'reject') {
        if (!isStaff) {
          res.status(403).json({ error: 'Hanya Admin yang dapat memoderasi galeri publik.' });
          return;
        }
        nextWork = {
          ...nextWork,
          moderationStatus: action === 'approve' ? 'approved' : 'rejected',
          parentApproved: action === 'approve' ? true : nextWork.parentApproved,
          catatanModerator:
            typeof catatan === 'string' && catatan.trim()
              ? catatan.trim().slice(0, 160)
              : action === 'approve'
                ? 'Disetujui Admin Rumah Baca.'
                : 'Perlu perbaikan sebelum tayang.',
        };
      } else {
        res.status(400).json({ error: 'Aksi moderasi tidak valid.' });
        return;
      }

      const updated: AlmahyraDatabase = {
        ...db,
        creations: (db.creations ?? []).map((c) => (c.id === id ? nextWork : c)),
      };
      await saveDb(updated);
      res.json({ ok: true, db: sanitizeDatabaseForClient(updated, caller) });
    } catch (error) {
      console.error('PATCH /api/creations/:id/moderate error:', error);
      res.status(500).json({ error: 'Gagal memperbarui status karya.' });
    }
  });

  app.patch('/api/member/profile', async (req, res) => {
    try {
      const caller = verifyBearerSession(req.headers.authorization);
      if (!caller) {
        res.status(401).json({ error: 'Autentikasi diperlukan.' });
        return;
      }
      const { nomorInduk, targetMingguan, orangTua } = req.body ?? {};
      const targetCode = String(nomorInduk || caller.nomorInduk || '').trim().toUpperCase();
      const isStaff = caller.role === 'admin' || caller.role === 'superadmin';
      if (!isStaff && targetCode !== caller.nomorInduk?.toUpperCase()) {
        res.status(403).json({ error: 'Tidak dapat mengubah profil anggota lain.' });
        return;
      }
      const db = await ensureDb();
      const nextMembers = db.members.map((m) => {
        if (m.nomorInduk.toUpperCase() !== targetCode) return m;
        return {
          ...m,
          targetMingguan:
            targetMingguan !== undefined
              ? Math.min(20, Math.max(1, Math.round(Number(targetMingguan) || 3)))
              : m.targetMingguan,
          orangTua:
            typeof orangTua === 'string' && orangTua.trim()
              ? orangTua.trim().slice(0, 80)
              : m.orangTua,
        };
      });
      const updated = { ...db, members: nextMembers };
      await saveDb(updated);
      res.json({ ok: true, db: sanitizeDatabaseForClient(updated, caller) });
    } catch (error) {
      console.error('PATCH /api/member/profile error:', error);
      res.status(500).json({ error: 'Gagal memperbarui profil anggota.' });
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
      const token = signSessionToken(session);
      res.json({ session: { ...session, token } });
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
