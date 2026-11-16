import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateUser,
  calculateLevelInfo,
  computeBookShelves,
  computeCompanionDashboard,
  computeLibraryStats,
  DEFAULT_CATEGORIES,
  extractSpreadsheetId,
  filterBooks,
  filterBooksAdvanced,
  generateDeterministicQrMatrix,
  getBookQuizQuestions,
  getBookReadablePages,
  hydrateDatabaseWithDefaults,
  parseBulkBooksCsv,
  recordBookReadingAction,
  recordsToSheetRows,
  resolveThemeMode,
  sheetRowsToRecords,
  toggleThemeMode,
} from './almahyra';
import { getStorySoundtrackProfile } from './storyAudioEngine';
import { DEFAULT_DB } from '../data/defaultDb';
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
      nomorInduk: 'ALMA-001',
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

  const memberSession = authenticateUser('alma-001', '123', { admins, members });
  assert.equal(memberSession?.role, 'anggota');
  assert.equal(memberSession?.nomorInduk, 'ALMA-001');

  assert.equal(authenticateUser('admin', 'wrongpass', { admins, members }), null);
  assert.equal(authenticateUser('ALMA-001', '999', { admins, members }), null);
});

test('recordsToSheetRows and sheetRowsToRecords round-trip cleanly', () => {
  const books: Book[] = [
    {
      id: 'b1',
      kodeBuku: 'BK-01',
      judul: 'Petualangan Kancil',
      penulis: 'Tim Almahyra',
      kategori: 'Fabel dan Cerita Binatang',
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
      kategori: 'Cerita Nusantara',
      zona: 'Zona Imajinasi',
      status: 'Tersedia',
      stok: 2,
      lokasiRak: 'Rak A',
      deskripsi: 'Dongeng anak',
      aktif: true,
    },
    {
      id: '2',
      kodeBuku: 'BK-02',
      judul: 'Eksperimen Air',
      penulis: 'Budi',
      kategori: 'Sains dan Pengetahuan',
      zona: 'Zona Pengetahuan',
      status: 'Dipinjam',
      stok: 1,
      lokasiRak: 'Rak B',
      deskripsi: 'Sains dasar',
      aktif: true,
    },
  ];
  assert.equal(filterBooks(books, 'dongeng', 'Semua').length, 1);
  assert.equal(filterBooks(books, '', 'Sains dan Pengetahuan').length, 1);

  const stats = computeLibraryStats({
    members: [
      {
        id: 'm1',
        nomorInduk: 'ALMA-001',
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
        nomorInduk: 'ALMA-001',
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
        nomorInduk: 'ALMA-001',
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
  const m1 = generateDeterministicQrMatrix('ALMA-001');
  const m2 = generateDeterministicQrMatrix('ALMA-001');
  assert.equal(m1.length, 19);
  assert.deepEqual(m1, m2);
  assert.equal(m1[0][0], true);
  assert.equal(m1[3][3], true);
});

test('resolveThemeMode and toggleThemeMode switch cleanly between light and dark', () => {
  assert.equal(resolveThemeMode(undefined), 'light');
  assert.equal(resolveThemeMode('light'), 'light');
  assert.equal(resolveThemeMode('dark'), 'dark');
  assert.equal(toggleThemeMode('light'), 'dark');
  assert.equal(toggleThemeMode('dark'), 'light');
});

test('DEFAULT_CATEGORIES covers all 10 required categories and filterBooksAdvanced respects active/minutes/favorites', () => {
  assert.equal(DEFAULT_CATEGORIES.length, 10);
  const books = DEFAULT_DB.books;
  assert.ok(books.length >= 10);
  const usedCats = new Set(books.map((b) => b.kategori));
  for (const cat of DEFAULT_CATEGORIES) {
    assert.ok(usedCats.has(cat), `Missing book for category: ${cat}`);
  }

  const quickReads = filterBooksAdvanced(books, { maxMinutes: 5 });
  assert.ok(quickReads.length >= 2);
  assert.ok(quickReads.every((b) => (b.estimasiMenit ?? 5) <= 5));

  const favIds = new Set([books[0].id]);
  const favOnly = filterBooksAdvanced(books, { favoriteBookIds: favIds, onlyFavorites: true });
  assert.equal(favOnly.length, 1);
  assert.equal(favOnly[0].id, books[0].id);
});

test('computeBookShelves builds all curated Beranda shelves and every book has readable content', () => {
  const shelves = computeBookShelves(DEFAULT_DB.books, 'SD');
  assert.ok(shelves.pilihanAlmahyra.length > 0);
  assert.ok(shelves.terbaru.length > 0);
  assert.ok(shelves.terbanyakDibaca.length > 0);
  assert.ok(shelves.rekomendasi.length > 0);
  assert.ok(shelves.ceritaNusantara.length > 0);
  assert.ok(shelves.komikEdukasi.length > 0);
  assert.ok(shelves.bacaanSingkat5Menit.length > 0);

  for (const book of DEFAULT_DB.books) {
    const pages = getBookReadablePages(book);
    const quiz = getBookQuizQuestions(book);
    assert.ok(pages.length >= 3, `Book ${book.judul} should have readable pages`);
    assert.ok(quiz.length >= 2, `Book ${book.judul} should have quiz questions`);
  }
});

test('recordBookReadingAction awards points, adds digital passport stamp, journal, and increments reads', () => {
  const targetBook = DEFAULT_DB.books[0];
  const targetMember = DEFAULT_DB.members[0];
  const prevPoints = targetMember.poin;
  const prevReads = targetBook.dibacaCount ?? 0;

  const updated = recordBookReadingAction(DEFAULT_DB, {
    viewerKey: targetMember.nomorInduk,
    bookId: targetBook.id,
    lastPage: 2,
    totalPages: 4,
    completed: true,
    quizScore: 100,
    journalNote: 'Cerita sangat seru dan menginspirasi!',
    starRating: 5,
    toggleFavorite: true,
    awardPoints: 5,
  });

  const nextMember = updated.members.find((m) => m.id === targetMember.id)!;
  const nextBook = updated.books.find((b) => b.id === targetBook.id)!;
  assert.equal(nextMember.poin, prevPoints + 5);
  assert.equal(nextBook.dibacaCount, prevReads + 1);
  assert.equal(updated.passportLogs[0].judulBuku, targetBook.judul);
  assert.equal(updated.passportLogs[0].kategoriBuku, targetBook.kategori);
  assert.equal(updated.passportLogs[0].stempel, true);
  assert.equal(updated.readingJournals?.[0].catatan, 'Cerita sangat seru dan menginspirasi!');
  const prog = updated.readingProgress?.find(
    (p) => p.viewerKey === targetMember.nomorInduk && p.bookId === targetBook.id,
  );
  assert.ok(prog);
  assert.equal(prog.lastPage, 2);
});

test('computeCompanionDashboard and parseBulkBooksCsv produce valid structures', () => {
  const report = computeCompanionDashboard(DEFAULT_DB);
  assert.ok(report.totalBooksRead > 0);
  assert.ok(report.favoriteCategories.length > 0);
  assert.equal(report.memberReports.length, DEFAULT_DB.members.length);

  const csv = [
    'Kode Buku,Judul,Penulis,Kategori,Jenjang Pembaca,Estimasi Menit,Zona,Sinopsis,Isi Bacaan',
    'IMP-101,"Kisah Matahari Pagi","Bu Sari","Sains dan Pengetahuan","SD Awal",5,"Zona Pengetahuan","Mengenal energi cahaya","Bab 1 cahaya.|Bab 2 manfaatnya."',
  ].join('\n');
  const imported = parseBulkBooksCsv(csv, '/assets/cover.jpg');
  assert.equal(imported.length, 1);
  assert.equal(imported[0].judul, 'Kisah Matahari Pagi');
  assert.equal(imported[0].isiBacaan?.length, 2);
});

test('getStorySoundtrackProfile matches instruments to story categories and hydrateDatabaseWithDefaults upgrades ALM- to ALMA-', () => {
  const nusantaraMusic = getStorySoundtrackProfile('Cerita Nusantara', 'Lentera Senja');
  assert.ok(nusantaraMusic.instrumentsLabel.includes('Gamelan'));

  const komikMusic = getStorySoundtrackProfile('Komik Edukasi', 'Kapten Pilah');
  assert.ok(komikMusic.instrumentsLabel.includes('Marimba'));

  const alamMusic = getStorySoundtrackProfile('Lingkungan dan Alam', 'Dari Biji Menjadi Pohon');
  assert.ok(alamMusic.instrumentsLabel.includes('Kalimba'));
  assert.equal(alamMusic.hasBreeze, true);

  const migrated = hydrateDatabaseWithDefaults(
    {
      config: { ...DEFAULT_DB.config, heroTitle: 'Taman Baca Keluarga & Petualangan Literasi Anak Desa' },
      members: [{ ...DEFAULT_DB.members[0], nomorInduk: 'ALM-001' }],
    },
    DEFAULT_DB,
  );
  assert.equal(migrated.members[0].nomorInduk, 'ALMA-001');
  assert.ok(migrated.config.heroTitle.startsWith('Rumah Baca Keluarga'));
});
