# Panduan Deploy ALMAHYRA APP ke Vercel (vercel.app)

Konfigurasi aplikasi sudah disesuaikan untuk berjalan di **Vercel** (Frontend Vite React + PWA di CDN & Backend Express API di Vercel Serverless Function `/api/index.ts`).

## 1. Berkas Konfigurasi yang Tersedia
- `vercel.json` — Konfigurasi build (`npm run build` → `dist`), routing API (`/api/*` → `/api/index`), SPA fallback (`/index.html`), rewrite aset gambar legacy, serta header cache PWA (`sw.js`, `manifest.webmanifest`).
- `api/index.ts` — Entry point Vercel Serverless Function yang mengekspor aplikasi Express tanpa menyertakan `vite` dev server.
- `src/server/app.ts` — Seluruh route API (`/api/health`, `/api/db`, `/api/auth/login`, `/api/reading/record`, `/api/creations`, `/api/member/profile`, `/api/sheets/public-fetch`) dengan 3 mode penyimpanan otomatis:
  1. **`vercel-kv`** *(direkomendasikan untuk produksi)*: otomatis aktif jika `KV_REST_API_URL` & `KV_REST_API_TOKEN` (atau `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`) terpasang. Data buku, anggota, karya anak, dan progres membaca tersimpan permanen lintas cold-start.
  2. **`vercel-tmp`**: otomatis aktif di Vercel jika KV belum dipasang (membaca seed awal `data/almahyra-db.json` dan menulis ke `/tmp/almahyra-db.json` agar tidak error `EROFS`). *Catatan: `/tmp` bersifat sementara saat instance serverless idle/restart.*
  3. **`local-file`**: aktif saat dijalankan lokal (`npm run dev` / `npm start`) dan menulis langsung ke `data/almahyra-db.json`.

## 2. Langkah Deploy ke `*.vercel.app`

### Cara A: Via Dashboard Vercel (Terhubung GitHub)
1. Push repository ini ke GitHub/GitLab/Bitbucket.
2. Buka [vercel.com/new](https://vercel.com/new), pilih repository ini, lalu klik **Import**.
3. Pastikan pengaturan build (otomatis terbaca dari `vercel.json`):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Tambahkan **Environment Variables** (Settings → Environment Variables):
   - `ALMAHYRA_SESSION_SECRET` *(wajib disarankan)*: string acak panjang (mis. 64 karakter hex) untuk menandatangani token login sesi.
   - *(Opsional untuk database permanen lintas cold-start)* Pasang **Upstash Redis / Vercel KV** dari tab **Storage** di dashboard Vercel (otomatis mengisi `KV_REST_API_URL` dan `KV_REST_API_TOKEN`).
   - *(Opsional jika memakai fitur Gemini AI di server)* `GEMINI_API_KEY`.
5. Klik **Deploy**. Setelah selesai, Anda akan mendapatkan URL `https://<nama-proyek>.vercel.app`.

### Cara B: Via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 3. Pengaturan Tambahan Setelah Online
- **Cek Status Server**: buka `https://<nama-proyek>.vercel.app/api/health` untuk memastikan `"status": "ok"`, `"runtime": "vercel-serverless"`, dan mode `"storage"` aktif.
- **Login Google / Firebase Auth**: tambahkan domain `<nama-proyek>.vercel.app` di:
  1. **Firebase Console** → Authentication → Settings → **Authorized domains**.
  2. **Google Cloud Console** → Credentials → OAuth 2.0 Client ID → **Authorized JavaScript origins**.
