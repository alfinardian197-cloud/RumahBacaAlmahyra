import type {
  ActivitySchedule,
  AlmahyraDatabase,
  Book,
  Loan,
  Member,
  MissionItem,
  PassportLog,
} from '../types/almahyra';
import { DEFAULT_DB } from '../data/defaultDb';
import {
  extractSpreadsheetId,
  hydrateDatabaseWithDefaults,
  recordsToSheetRows,
  sheetRowsToRecords,
} from '../utils/almahyra';

const SHEET_TABS = {
  config: 'Pengaturan',
  members: 'Anggota',
  books: 'Katalog_Buku',
  loans: 'Peminjaman',
  passportLogs: 'E_Paspor',
  schedules: 'Kegiatan',
  missions: 'Misi_Literasi',
} as const;

export interface SheetSyncResult {
  spreadsheetId: string;
  spreadsheetTitle: string;
  syncedAt: string;
  summary: string;
}

async function sheetsFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `Google Sheets API error (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

export function buildAllSheetRangesPayload(db: AlmahyraDatabase) {
  const configEntries = Object.entries(db.config).map(([key, value]) => ({
    key,
    value: typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value ?? ''),
  }));

  return [
    {
      range: `${SHEET_TABS.config}!A1`,
      values: recordsToSheetRows(
        [
          { key: 'key', header: 'Key' },
          { key: 'value', header: 'Value' },
        ],
        configEntries,
      ),
    },
    {
      range: `${SHEET_TABS.members}!A1`,
      values: recordsToSheetRows<Member>(
        [
          { key: 'id', header: 'ID' },
          { key: 'nomorInduk', header: 'Nomor Induk' },
          { key: 'nama', header: 'Nama' },
          { key: 'jenjangUsia', header: 'Jenjang' },
          { key: 'orangTua', header: 'Orang Tua' },
          { key: 'poin', header: 'Poin' },
          { key: 'lencana', header: 'Lencana' },
          { key: 'status', header: 'Status' },
          { key: 'bergabungSejak', header: 'Bergabung Sejak' },
          { key: 'password', header: 'Kata Sandi' },
        ],
        db.members,
      ),
    },
    {
      range: `${SHEET_TABS.books}!A1`,
      values: recordsToSheetRows<Book>(
        [
          { key: 'id', header: 'ID' },
          { key: 'kodeBuku', header: 'Kode Buku' },
          { key: 'judul', header: 'Judul' },
          { key: 'penulis', header: 'Penulis' },
          { key: 'kategori', header: 'Kategori' },
          { key: 'jenjangPembaca', header: 'Jenjang' },
          { key: 'estimasiMenit', header: 'Estimasi Menit' },
          { key: 'zona', header: 'Zona' },
          { key: 'status', header: 'Status' },
          { key: 'stok', header: 'Stok' },
          { key: 'lokasiRak', header: 'Lokasi Rak' },
          { key: 'deskripsi', header: 'Deskripsi' },
          { key: 'aktif', header: 'Aktif' },
          { key: 'pilihanAlmahyra', header: 'Pilihan' },
          { key: 'dibacaCount', header: 'Dibaca' },
        ],
        db.books,
      ),
    },
    {
      range: `${SHEET_TABS.loans}!A1`,
      values: recordsToSheetRows<Loan>(
        [
          { key: 'id', header: 'ID' },
          { key: 'nomorInduk', header: 'Nomor Induk' },
          { key: 'namaAnggota', header: 'Nama Anggota' },
          { key: 'kodeBuku', header: 'Kode Buku' },
          { key: 'judulBuku', header: 'Judul Buku' },
          { key: 'tanggalPinjam', header: 'Tanggal Pinjam' },
          { key: 'batasKembali', header: 'Batas Kembali' },
          { key: 'tanggalKembali', header: 'Tanggal Kembali' },
          { key: 'status', header: 'Status' },
        ],
        db.loans,
      ),
    },
    {
      range: `${SHEET_TABS.passportLogs}!A1`,
      values: recordsToSheetRows<PassportLog>(
        [
          { key: 'id', header: 'ID' },
          { key: 'nomorInduk', header: 'Nomor Induk' },
          { key: 'namaAnggota', header: 'Nama Anggota' },
          { key: 'misi', header: 'Misi' },
          { key: 'judulBuku', header: 'Judul Buku' },
          { key: 'kategoriBuku', header: 'Kategori Buku' },
          { key: 'zona', header: 'Zona' },
          { key: 'poin', header: 'Poin' },
          { key: 'pendamping', header: 'Pendamping' },
          { key: 'catatan', header: 'Catatan' },
          { key: 'tanggal', header: 'Tanggal' },
          { key: 'stempel', header: 'Stempel' },
        ],
        db.passportLogs,
      ),
    },
    {
      range: `${SHEET_TABS.schedules}!A1`,
      values: recordsToSheetRows<ActivitySchedule>(
        [
          { key: 'id', header: 'ID' },
          { key: 'hari', header: 'Hari' },
          { key: 'waktu', header: 'Waktu' },
          { key: 'program', header: 'Program' },
          { key: 'aktivitas', header: 'Aktivitas' },
          { key: 'zona', header: 'Zona' },
          { key: 'kuota', header: 'Kuota' },
          { key: 'pesertaTerdaftar', header: 'Peserta Terdaftar' },
        ],
        db.schedules,
      ),
    },
    {
      range: `${SHEET_TABS.missions}!A1`,
      values: recordsToSheetRows<MissionItem>(
        [
          { key: 'id', header: 'ID' },
          { key: 'judul', header: 'Judul' },
          { key: 'zona', header: 'Zona' },
          { key: 'tugas', header: 'Tugas' },
          { key: 'verifikasi', header: 'Verifikasi' },
          { key: 'poin', header: 'Poin' },
        ],
        db.missions,
      ),
    },
  ];
}

export async function createAlmahyraSpreadsheet(
  accessToken: string,
  db: AlmahyraDatabase,
): Promise<SheetSyncResult> {
  const title = `Database ${db.config.appName || 'Rumah Baca Almahyra'}`;
  const created = await sheetsFetch('https://sheets.googleapis.com/v4/spreadsheets', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title },
      sheets: Object.values(SHEET_TABS).map((tabName) => ({
        properties: { title: tabName },
      })),
    }),
  });

  const spreadsheetId: string = created.spreadsheetId;
  const payload = buildAllSheetRangesPayload({
    ...db,
    config: { ...db.config, spreadsheetId, spreadsheetTitle: title },
  });

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: payload,
      }),
    },
  );

  return {
    spreadsheetId,
    spreadsheetTitle: title,
    syncedAt: new Date().toISOString(),
    summary: `Spreadsheet baru berhasil dibuat dengan 7 tab (${db.members.length} anggota, ${db.books.length} buku).`,
  };
}

export async function pushDatabaseToGoogleSheet(
  rawSpreadsheetId: string,
  accessToken: string,
  db: AlmahyraDatabase,
): Promise<SheetSyncResult> {
  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID tidak valid.');
  }

  // Fetch metadata first (best practice: avoid hardcoding assumptions about existing tabs)
  const meta = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
    accessToken,
  );
  const existingTitles = new Set<string>(
    (meta.sheets ?? []).map((s: { properties?: { title?: string } }) => s.properties?.title ?? ''),
  );

  const missingTabs = Object.values(SHEET_TABS).filter((t) => !existingTitles.has(t));
  if (missingTabs.length > 0) {
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: missingTabs.map((t) => ({ addSheet: { properties: { title: t } } })),
        }),
      },
    );
  }

  const clearRanges = Object.values(SHEET_TABS).map((t) => `${t}!A1:Z1000`);
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ ranges: clearRanges }),
    },
  );

  const payload = buildAllSheetRangesPayload({
    ...db,
    config: {
      ...db.config,
      spreadsheetId,
      spreadsheetTitle: meta.properties?.title || db.config.spreadsheetTitle,
    },
  });

  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: payload,
      }),
    },
  );

  return {
    spreadsheetId,
    spreadsheetTitle: meta.properties?.title || 'Google Spreadsheet',
    syncedAt: new Date().toISOString(),
    summary: `Berhasil menyimpan ${db.members.length} anggota, ${db.books.length} buku, dan konfigurasi ke Spreadsheet.`,
  };
}

export async function pullDatabaseFromGoogleSheet(
  rawSpreadsheetId: string,
  currentDb: AlmahyraDatabase,
  accessToken?: string | null,
): Promise<{ updatedDb: AlmahyraDatabase; result: SheetSyncResult }> {
  const spreadsheetId = extractSpreadsheetId(rawSpreadsheetId);
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID tidak valid.');
  }

  const tabValues: Record<string, string[][]> = {};
  let spreadsheetTitle = currentDb.config.spreadsheetTitle || 'Google Spreadsheet';

  if (accessToken) {
    const meta = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
      accessToken,
    );
    spreadsheetTitle = meta.properties?.title || spreadsheetTitle;
    const sheetTitles: string[] = (meta.sheets ?? [])
      .map((s: { properties?: { title?: string } }) => s.properties?.title)
      .filter(Boolean);

    const targetTabs = Object.values(SHEET_TABS).filter((t) => sheetTitles.includes(t));
    if (targetTabs.length > 0) {
      const rangesQuery = targetTabs.map((t) => `ranges=${encodeURIComponent(`${t}!A1:Z1000`)}`).join('&');
      const batch = await sheetsFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`,
        accessToken,
      );
      for (const vr of batch.valueRanges ?? []) {
        const tabName = String(vr.range ?? '').split('!')[0].replace(/^'|'$/g, '');
        tabValues[tabName] = vr.values ?? [];
      }
    }
  } else {
    // Public read fallback via server proxy for publicly shared spreadsheets
    for (const tabName of Object.values(SHEET_TABS)) {
      const res = await fetch(
        `/api/sheets/public-fetch?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheet=${encodeURIComponent(tabName)}`,
      );
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.rows) && json.rows.length > 0) {
          tabValues[tabName] = json.rows;
        }
      }
    }
  }

  const nextDb: AlmahyraDatabase = structuredClone(currentDb);
  nextDb.config.spreadsheetId = spreadsheetId;
  nextDb.config.spreadsheetTitle = spreadsheetTitle;
  nextDb.config.lastSyncedAt = new Date().toISOString();

  if (tabValues[SHEET_TABS.config]) {
    const rows = sheetRowsToRecords(tabValues[SHEET_TABS.config]);
    for (const r of rows) {
      const k = r.Key;
      const v = r.Value;
      if (!k || v === undefined) continue;
      if (k in nextDb.config) {
        const currentVal = (nextDb.config as unknown as Record<string, unknown>)[k];
        if (typeof currentVal === 'boolean') {
          (nextDb.config as unknown as Record<string, unknown>)[k] = v.toUpperCase() === 'TRUE';
        } else if (k !== 'spreadsheetId') {
          (nextDb.config as unknown as Record<string, unknown>)[k] = v;
        }
      }
    }
  }

  if (tabValues[SHEET_TABS.members]) {
    const recs = sheetRowsToRecords(tabValues[SHEET_TABS.members]);
    if (recs.length > 0) {
      nextDb.members = recs.map((r, idx) => ({
        id: r.ID || `mem-sheet-${idx + 1}`,
        nomorInduk: r['Nomor Induk'] || `ALMA-${String(idx + 1).padStart(3, '0')}`,
        nama: r.Nama || 'Anggota',
        jenjangUsia: (['PAUD', 'SD', 'SMP', 'Umum'].includes(r.Jenjang)
          ? r.Jenjang
          : 'SD') as Member['jenjangUsia'],
        orangTua: r['Orang Tua'] || '-',
        poin: Number(r.Poin) || 0,
        lencana: r.Lencana
          ? r.Lencana.split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        status: r.Status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
        bergabungSejak: r['Bergabung Sejak'] || new Date().toISOString().slice(0, 10),
        password: r['Kata Sandi'] || '123',
      }));
    }
  }

  if (tabValues[SHEET_TABS.books]) {
    const recs = sheetRowsToRecords(tabValues[SHEET_TABS.books]);
    if (recs.length > 0) {
      nextDb.books = recs.map((r, idx) => ({
        id: r.ID || `bk-sheet-${idx + 1}`,
        kodeBuku: r['Kode Buku'] || `BK-${String(idx + 1).padStart(3, '0')}`,
        judul: r.Judul || 'Judul Buku',
        penulis: r.Penulis || 'Anonim',
        kategori: r.Kategori || 'Cerita Nusantara',
        jenjangPembaca: r.Jenjang || 'Semua Usia',
        estimasiMenit: Number(r['Estimasi Menit']) || 5,
        zona: r.Zona || 'Zona Imajinasi',
        status: r.Status === 'Dipinjam' ? 'Dipinjam' : 'Tersedia',
        stok: Number(r.Stok) || 1,
        lokasiRak: r['Lokasi Rak'] || 'Rak Utama',
        deskripsi: r.Deskripsi || '',
        aktif: r.Aktif?.toUpperCase() !== 'FALSE',
        pilihanAlmahyra: r.Pilihan?.toUpperCase() === 'TRUE',
        dibacaCount: Number(r.Dibaca) || 0,
      }));
    }
  }

  if (tabValues[SHEET_TABS.loans]) {
    const recs = sheetRowsToRecords(tabValues[SHEET_TABS.loans]);
    if (recs.length > 0) {
      nextDb.loans = recs.map((r, idx) => ({
        id: r.ID || `ln-sheet-${idx + 1}`,
        nomorInduk: r['Nomor Induk'] || '',
        namaAnggota: r['Nama Anggota'] || '',
        kodeBuku: r['Kode Buku'] || '',
        judulBuku: r['Judul Buku'] || '',
        tanggalPinjam: r['Tanggal Pinjam'] || '',
        batasKembali: r['Batas Kembali'] || '',
        tanggalKembali: r['Tanggal Kembali'] || undefined,
        status: (['Dipinjam', 'Dikembalikan', 'Terlambat'].includes(r.Status)
          ? r.Status
          : 'Dipinjam') as Loan['status'],
      }));
    }
  }

  if (tabValues[SHEET_TABS.passportLogs]) {
    const recs = sheetRowsToRecords(tabValues[SHEET_TABS.passportLogs]);
    if (recs.length > 0) {
      nextDb.passportLogs = recs.map((r, idx) => ({
        id: r.ID || `pas-sheet-${idx + 1}`,
        nomorInduk: r['Nomor Induk'] || '',
        namaAnggota: r['Nama Anggota'] || '',
        misi: r.Misi || '',
        judulBuku: r['Judul Buku'] || undefined,
        kategoriBuku: r['Kategori Buku'] || undefined,
        zona: r.Zona || 'Zona Imajinasi',
        poin: Number(r.Poin) || 5,
        pendamping: r.Pendamping || 'Pendamping',
        catatan: r.Catatan || '',
        tanggal: r.Tanggal || '',
        stempel: r.Stempel?.toUpperCase() !== 'FALSE',
      }));
    }
  }

  if (tabValues[SHEET_TABS.schedules]) {
    const recs = sheetRowsToRecords(tabValues[SHEET_TABS.schedules]);
    if (recs.length > 0) {
      nextDb.schedules = recs.map((r, idx) => ({
        id: r.ID || `sch-sheet-${idx + 1}`,
        hari: r.Hari || 'Sabtu',
        waktu: r.Waktu || '15.30–17.00 WIB',
        program: r.Program || 'Kegiatan Literasi',
        aktivitas: r.Aktivitas || '',
        zona: r.Zona || 'Semua Zona',
        kuota: Number(r.Kuota) || 20,
        pesertaTerdaftar: Number(r['Peserta Terdaftar']) || 0,
      }));
    }
  }

  if (tabValues[SHEET_TABS.missions]) {
    const recs = sheetRowsToRecords(tabValues[SHEET_TABS.missions]);
    if (recs.length > 0) {
      nextDb.missions = recs.map((r, idx) => ({
        id: r.ID || `mis-sheet-${idx + 1}`,
        judul: r.Judul || 'Misi Literasi',
        zona: r.Zona || 'Zona Imajinasi',
        tugas: r.Tugas || '',
        verifikasi: r.Verifikasi || 'Pendamping',
        poin: Number(r.Poin) || 5,
      }));
    }
  }

  const syncedTabsCount = Object.keys(tabValues).length;
  if (syncedTabsCount === 0 && !accessToken) {
    throw new Error(
      'Spreadsheet tidak dapat dibaca secara publik. Silakan masuk dengan akun Google Sheets atau atur izin Spreadsheet ke "Siapa saja yang memiliki link dapat melihat".',
    );
  }

  const hydrated = hydrateDatabaseWithDefaults(nextDb, DEFAULT_DB);

  return {
    updatedDb: hydrated,
    result: {
      spreadsheetId,
      spreadsheetTitle,
      syncedAt: hydrated.config.lastSyncedAt,
      summary: `Berhasil menarik data dari ${syncedTabsCount} tab spreadsheet (${hydrated.members.length} anggota, ${hydrated.books.length} buku).`,
    },
  };
}
