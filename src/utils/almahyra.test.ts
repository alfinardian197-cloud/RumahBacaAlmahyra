import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateUser,
  calculateLevelInfo,
  computeLibraryStats,
  extractSpreadsheetId,
  filterBooks,
  generateDeterministicQrMatrix,
  recordsToSheetRows,
  sheetRowsToRecords,
} from './almahyra';
import type { AdminAccount, Book, Member } from '../types/almahyra';

test('extractSpreadsheetId parses raw IDs and full Google Sheets URLs', () => {
  const rawId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
  assert.equal(extractSpreadsheetId(rawId), rawId);
  assert.equal(
    extractSpreadsheetId(`https://docs.google.com/spreadsheets/d/${rawId}/edit#gid=0`),
    rawId,
  );
  assert.equal(extractSpreadsheetId('   '), '');
  assert.equal(extractSpreadsheetId('short'), '');
});

test('calculateLevelInfo returns exact proposal tiers and progress', () => {
  const starter = calculateLevelInfo(3);
  assert.equal(starter.currentLevel, 'Penjelajah Pemula');
  assert.equal(starter.nextTarget, 5);
  assert.equal(starter.pointsToNext, 2);

  const story = calculateLevelInfo(18);
  assert.equal(story.currentLevel, 'Petualang Cerita');
  assert.equal(story.nextLevel, 'Penjelajah Pengetahuan');
  assert.equal(story.pointsToNext, 12);

  const explorer = calculateLevelInfo(35);
  assert.equal(explorer.currentLevel, 'Penjelajah Pengetahuan');
  assert.equal(explorer.nextLevel, 'Duta Literasi Almahyra');
  assert.equal(explorer.pointsToNext, 15);

  const ambassador = calculateLevelInfo(55);
  assert.equal(ambassador.currentLevel, 'Duta Literasi Almahyra');
  assert.equal(ambassador.progressPercent, 100);
  assert.equal(ambassador.nextLevel, null);
});

test('authenticateUser resolves superadmin, admin, and anggota credentials accurately', () => {
  const admins: AdminAccount[] = [
    {
      id: 'adm-1',
      username: 'admin',
      password: 'admin@123',
      role: 'superadmin',
      nama: 'Mohammad Alfin Ardiansyah, S.Pd.',
      jabatan: 'Koordinator & Superadmin',
    },
    {
      id: 'adm-2',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      nama: 'Admin Perpustakaan',
      jabatan: 'Admin Perpustakaan',
    },
  ];
  const members: Member[] = [
    {
      id: 'mem-1',
      nomorInduk: 'ALM-001',
      nama: 'Nadia Putri',
      jenjangUsia: 'SD',
      orangTua: 'Ibu Siti Aminah',
      poin: 20,
      lencana: ['Pemburu Cerita'],
      status: 'Aktif',
      bergabungSejak: '2026-01-15',
      password: '123',
    },
  ];

  const superSession = authenticateUser('admin', 'admin@123', { admins, members });
  assert.equal(superSession?.role, 'superadmin');

  const adminSession = authenticateUser('admin', 'admin123', { admins, members });
  assert.equal(adminSession?.role, 'admin');

  const memberSession = authenticateUser('alm-001', '123', { admins, members });
  assert.equal(memberSession?.role, 'anggota');
  assert.equal(memberSession?.nomorInduk, 'ALM-001');

  assert.equal(authenticateUser('admin', 'wrongpass', { admins, members }), null);
  assert.equal(authenticateUser('ALM-001', '999', { admins, members }), null);
});

test('recordsToSheetRows and sheetRowsToRecords round-trip cleanly', () => {
  const books: Book[] = [
    {
      id: 'b1',
      kodeBuku: 'BK-01',
      judul: 'Petualangan Kancil',
      penulis: 'Tim Almahyra',
      kategori: 'Fabel & Dongeng',
      zona: 'Zona Imajinasi',
      status: 'Tersedia',
      stok: 3,
      lokasiRak: 'Rak A1',
      deskripsi: 'Cerita rakyat Nusantara',
    },
  ];
  const rows = recordsToSheetRows(
    [
      { key: 'kodeBuku', header: 'Kode Buku' },
      { key: 'judul', header: 'Judul' },
      { key: 'stok', header: 'Stok' },
    ],
    books,
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], ['Kode Buku', 'Judul', 'Stok']);
  const parsed = sheetRowsToRecords(rows);
  assert.equal(parsed[0]['Kode Buku'], 'BK-01');
  assert.equal(parsed[0]['Judul'], 'Petualangan Kancil');
  assert.equal(parsed[0]['Stok'], '3');
});

test('filterBooks and computeLibraryStats compute accurate results', () => {
  const books: Book[] = [
    {
      id: '1',
      kodeBuku: 'BK-01',
      judul: 'Dongeng Nusantara',
      penulis: 'Ayu',
      kategori: 'Cerita Anak',
      zona: 'Zona Imajinasi',
      status: 'Tersedia',
      stok: 2,
      lokasiRak: 'Rak A',
      deskripsi: 'Dongeng anak',
    },
    {
      id: '2',
      kodeBuku: 'BK-02',
      judul: 'Eksperimen Air',
      penulis: 'Budi',
      kategori: 'Sains',
      zona: 'Zona Pengetahuan',
      status: 'Dipinjam',
      stok: 1,
      lokasiRak: 'Rak B',
      deskripsi: 'Sains dasar',
    },
  ];
  assert.equal(filterBooks(books, 'dongeng', 'Semua').length, 1);
  assert.equal(filterBooks(books, '', 'Sains').length, 1);

  const stats = computeLibraryStats({
    members: [
      {
        id: 'm1',
        nomorInduk: 'ALM-001',
        nama: 'A',
        jenjangUsia: 'SD',
        orangTua: 'B',
        poin: 10,
        lencana: [],
        status: 'Aktif',
        bergabungSejak: '2026-01-01',
        password: '123',
      },
    ],
    books,
    loans: [
      {
        id: 'l1',
        nomorInduk: 'ALM-001',
        namaAnggota: 'A',
        kodeBuku: 'BK-02',
        judulBuku: 'Eksperimen Air',
        tanggalPinjam: '2026-11-01',
        batasKembali: '2026-11-08',
        status: 'Dipinjam',
      },
    ],
    passportLogs: [
      {
        id: 'p1',
        nomorInduk: 'ALM-001',
        namaAnggota: 'A',
        misi: 'Pemburu Cerita',
        zona: 'Zona Imajinasi',
        poin: 5,
        pendamping: 'Alfin',
        catatan: 'Baik',
        tanggal: '2026-11-01',
        stempel: true,
      },
    ],
  });
  assert.equal(stats.totalBooks, 3);
  assert.equal(stats.activeLoans, 1);
  assert.equal(stats.verifiedMissions, 1);
});

test('generateDeterministicQrMatrix builds a reproducible 19x19 finder matrix', () => {
  const m1 = generateDeterministicQrMatrix('ALM-001');
  const m2 = generateDeterministicQrMatrix('ALM-001');
  assert.equal(m1.length, 19);
  assert.deepEqual(m1, m2);
  assert.equal(m1[0][0], true);
  assert.equal(m1[3][3], true);
});
