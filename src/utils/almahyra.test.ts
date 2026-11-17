import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADVENTURE_JOURNEY_STEPS,
  authenticateUser,
  buildBorrowWhatsAppMessage,
  buildDonationWhatsAppMessage,
  buildSahabatInvitationText,
  buildWhatsAppShareHref,
  calculateLevelInfo,
  claimBookStampInLocalPassport,
  claimRealActionMissionInLocalPassport,
  clampValidatedReadingPoints,
  computeBookShelves,
  computeCompanionDashboard,
  computeJourneyStepStatuses,
  computeLibraryStats,
  computeTopReadersLeaderboard,
  computeZoneAdventureStats,
  CREATION_CATEGORIES,
  DEFAULT_CATEGORIES,
  DEFAULT_READER_LEVELS,
  evaluateMiniQuiz,
  extractSpreadsheetId,
  filterApprovedCreations,
  filterBooks,
  filterBooksAdvanced,
  generateBedtimeStoryAndPrompts,
  generateDeterministicQrMatrix,
  getBookQuizQuestions,
  getBookReadablePages,
  getBookRealActionMission,
  getDefaultLocalPassportState,
  hydrateDatabaseWithDefaults,
  MINI_QUIZ_TEBAK_CERITA,
  normalizeAssetUrl,
  parseBulkBooksCsv,
  REAL_ACTION_BADGE_NAME,
  recordBookReadingAction,
  recordQuizAttemptInLocalPassport,
  recordsToSheetRows,
  resolveThemeMode,
  SAHABAT_GALLERY_PHOTOS,
  sanitizeDatabaseForClient,
  sheetRowsToRecords,
  toggleThemeMode,
} from './almahyra';
import { getStorySoundtrackProfile } from './storyAudioEngine';
import { DEFAULT_DB } from '../data/defaultDb';
import type { AdminAccount, Book, CreationWork, Member } from '../types/almahyra';

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
  assert.ok(books.length >= 25);
  assert.ok(books.some((b) => b.kodeBuku.startsWith('BUDI-')));
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
      config: {
        ...DEFAULT_DB.config,
        appName: 'ALMAHYRA App',
        heroTitle: 'Taman Baca Keluarga & Petualangan Literasi Anak Desa',
      },
      members: [{ ...DEFAULT_DB.members[0], nomorInduk: 'ALM-001' }],
    },
    DEFAULT_DB,
  );
  assert.equal(migrated.members[0].nomorInduk, 'ALMA-001');
  assert.equal(migrated.config.appName, 'Rumah Baca Almahyra');
  assert.equal(migrated.config.heroTitle, 'Selamat Datang di Dunia Literasi Almahyra!');
});

test('getBookReadablePages splits overly long chapters across multiple pages cleanly', () => {
  const longBook: Book = {
    ...DEFAULT_DB.books[0],
    id: 'bk-long',
    isiBacaan: [
      {
        judulBab: 'Bab Panjang',
        isi:
          'Kalimat pertama bercerita tentang pagi cerah di Rumah Baca Almahyra saat anak-anak berkumpul dengan gembira. ' +
          'Kalimat kedua menjelaskan bagaimana mereka memilih buku bergambar warna-warni dari rak bambu rendah yang tertata rapi. ' +
          'Kalimat ketiga mengisahkan Tari membacakan kisah petualangan dengan suara lantang dan penuh semangat agar mudah diikuti. ' +
          'Kalimat keempat menutup bagian ini dengan tepuk tangan meriah dari seluruh teman.',
        pesanMoral: 'Membaca bersama menumbuhkan kebersamaan.',
      },
    ],
  };

  const splitPages = getBookReadablePages(longBook, 220);
  assert.ok(splitPages.length >= 2);
  assert.ok(splitPages[0].judulBab.includes('(1/'));
  assert.equal(splitPages[0].pesanMoral, undefined);
  assert.equal(
    splitPages[splitPages.length - 1].pesanMoral,
    'Membaca bersama menumbuhkan kebersamaan.',
  );
  const rejoined = splitPages.map((p) => p.isi).join(' ');
  assert.ok(rejoined.includes('Kalimat pertama'));
  assert.ok(rejoined.includes('Kalimat keempat'));
});

test('normalizeAssetUrl and hydrateDatabaseWithDefaults migrate legacy asset paths to /images/', () => {
  assert.equal(
    normalizeAssetUrl('/src/assets/images/book_cover_folktale_1794800503588.jpg'),
    '/images/book_cover_folktale_1794800503588.jpg',
  );
  assert.equal(
    normalizeAssetUrl(
      'https://budi.kemendikdasmen.go.id/storage/image/pYcwlDFvAtO1qeOcaSFbT8TbIokZvRnbh40yv1qY.png',
    ),
    '/images/budi/pYcwlDFvAtO1qeOcaSFbT8TbIokZvRnbh40yv1qY.png',
  );
  assert.equal(
    normalizeAssetUrl('https://example.com/custom-cover.jpg'),
    'https://example.com/custom-cover.jpg',
  );

  const migrated = hydrateDatabaseWithDefaults(
    {
      config: {
        ...DEFAULT_DB.config,
        heroImageUrl: '/src/assets/images/hero_reading_terrace_1794800502182.jpg',
      },
      books: [
        {
          ...DEFAULT_DB.books[0],
          coverUrl: '/src/assets/images/book_cover_folktale_1794800503588.jpg',
        },
        {
          ...DEFAULT_DB.books[12],
          coverUrl:
            'https://budi.kemendikdasmen.go.id/storage/image/pYcwlDFvAtO1qeOcaSFbT8TbIokZvRnbh40yv1qY.png',
        },
      ],
    },
    DEFAULT_DB,
  );
  assert.equal(migrated.config.heroImageUrl, '/images/hero_reading_terrace_1794800502182.jpg');
  assert.equal(migrated.books[0].coverUrl, '/images/book_cover_folktale_1794800503588.jpg');
  assert.equal(
    migrated.books[1].coverUrl,
    '/images/budi/pYcwlDFvAtO1qeOcaSFbT8TbIokZvRnbh40yv1qY.png',
  );
});

test('Petualangan Almahyra defines all 7 journey steps, 3 real photos, and builds invitation copy', () => {
  assert.equal(ADVENTURE_JOURNEY_STEPS.length, 7);
  assert.deepEqual(
    ADVENTURE_JOURNEY_STEPS.map((s) => s.title),
    [
      'Pintu Masuk Almahyra',
      'Kenali Dunia Almahyra',
      'Jelajahi Hutan Buku',
      'Buka Pintu Cerita',
      'Selesaikan Misi Literasi',
      'Raih Bintang Literasi',
      'Jadilah Sahabat Almahyra',
    ],
  );
  assert.equal(SAHABAT_GALLERY_PHOTOS.length, 3);
  assert.ok(SAHABAT_GALLERY_PHOTOS.every((p) => p.src.startsWith('/assets/aistudio/')));

  const invite = buildSahabatInvitationText({
    senderName: 'Nadia',
    appName: 'ALMAHYRA App',
    booksReadCount: 3,
    favoriteBookTitle: 'Pustaka Kaki Gunung & Lentera Senja',
  });
  assert.ok(invite.includes('Nadia'));
  assert.ok(invite.includes('3 buku'));
  assert.ok(invite.includes('Pustaka Kaki Gunung & Lentera Senja'));

  const statuses = computeJourneyStepStatuses(DEFAULT_DB, 'ALMA-001');
  assert.equal(statuses['pintu-masuk'], true);
  assert.equal(statuses['kenali-dunia'], true);
  assert.equal(statuses['hutan-buku'], true);
  assert.equal(statuses['bintang-literasi'], true);
});

test('filterBooksAdvanced onlyAvailable, computeTopReadersLeaderboard, WhatsApp builders, and bedtime story generator', () => {
  const sampleBooks: Book[] = [
    { ...DEFAULT_DB.books[0], id: 'avail-1', status: 'Tersedia', aktif: true },
    { ...DEFAULT_DB.books[1], id: 'loan-1', status: 'Dipinjam', aktif: true },
  ];
  const onlyAvail = filterBooksAdvanced(sampleBooks, { onlyAvailable: true });
  assert.equal(onlyAvail.length, 1);
  assert.equal(onlyAvail[0].id, 'avail-1');

  const leaderboard = computeTopReadersLeaderboard(DEFAULT_DB.members, 5);
  assert.ok(leaderboard.length >= 1 && leaderboard.length <= 5);
  for (let i = 0; i < leaderboard.length; i++) {
    assert.equal(leaderboard[i].rank, i + 1);
    assert.equal(leaderboard[i].member.status, 'Aktif');
    if (i > 0) {
      assert.ok(leaderboard[i - 1].member.poin >= leaderboard[i].member.poin);
    }
  }

  const borrowMsg = buildBorrowWhatsAppMessage({
    borrowerName: 'Ibu Sari',
    memberCode: 'alma-002',
    bookCode: 'BK-01',
    bookTitle: 'Pustaka Kaki Gunung',
    borrowDate: '2026-11-20',
  });
  assert.ok(borrowMsg.includes('Ibu Sari'));
  assert.ok(borrowMsg.includes('ALMA-002'));
  assert.ok(borrowMsg.includes('BK-01 — Pustaka Kaki Gunung'));

  const donateMsg = buildDonationWhatsAppMessage({
    donorName: 'Keluarga Pak Budi',
    donorOrigin: 'Tlogosari',
    bookCount: 5,
    bookTopics: 'Buku Cerita Nusantara',
  });
  assert.ok(donateMsg.includes('Keluarga Pak Budi'));
  assert.ok(donateMsg.includes('5 eksemplar'));

  const waHref = buildWhatsAppShareHref(borrowMsg, '+62 812-3456-7890');
  assert.ok(waHref.startsWith('https://wa.me/6281234567890?text='));
  assert.ok(buildWhatsAppShareHref(donateMsg).startsWith('https://wa.me/?text='));

  const story = generateBedtimeStoryAndPrompts({
    characterId: 'kancil',
    settingId: 'teras',
    moralId: 'kejujuran',
    childName: 'Nadia',
  });
  assert.ok(story.title.includes('Kancil Cerdik'));
  assert.equal(story.paragraphs.length, 3);
  assert.ok(story.paragraphs[0].includes('Nadia'));
  assert.equal(story.discussionQuestions.length, 3);
});

test('6 featured pilihanAlmahyra books, TK reader level, local digital passport stamps, and 5-question Mini Quiz work reliably', () => {
  assert.ok((DEFAULT_READER_LEVELS as readonly string[]).includes('TK'));
  const shelves = computeBookShelves(DEFAULT_DB.books, 'SD');
  assert.equal(shelves.pilihanAlmahyra.length, 6);

  const tkFiltered = filterBooksAdvanced(DEFAULT_DB.books, { readerLevel: 'TK' });
  assert.ok(tkFiltered.length >= 2);
  assert.ok(tkFiltered.some((b) => b.judul === 'Bintang Kertas dari Negeri Angin'));

  const initialPassport = getDefaultLocalPassportState();
  const targetBook = shelves.pilihanAlmahyra[0];
  const claim1 = claimBookStampInLocalPassport(initialPassport, targetBook);
  assert.equal(claim1.alreadyClaimed, false);
  assert.equal(claim1.nextState.points, 5);
  assert.equal(claim1.nextState.stamps.length, 1);
  assert.ok(claim1.nextState.badges.includes('Pembaca Pemula'));

  const claimDup = claimBookStampInLocalPassport(claim1.nextState, targetBook);
  assert.equal(claimDup.alreadyClaimed, true);
  assert.equal(claimDup.nextState.points, 5);
  assert.equal(claimDup.nextState.stamps.length, 1);

  assert.equal(MINI_QUIZ_TEBAK_CERITA.length, 5);
  const allCorrect: Record<number, number> = {};
  MINI_QUIZ_TEBAK_CERITA.forEach((q, idx) => {
    allCorrect[idx] = q.correctIndex;
  });
  const quizEval = evaluateMiniQuiz(MINI_QUIZ_TEBAK_CERITA, allCorrect);
  assert.equal(quizEval.correctCount, 5);
  assert.equal(quizEval.scorePercent, 100);
  assert.equal(quizEval.passed, true);

  const afterQuiz = recordQuizAttemptInLocalPassport(claim1.nextState, quizEval.scorePercent);
  assert.equal(afterQuiz.bestQuizScore, 100);
  assert.equal(afterQuiz.quizAttempts, 1);
  assert.equal(afterQuiz.points, 10);
  assert.ok(afterQuiz.badges.includes('Bintang Kuis Tebak Cerita'));
  assert.ok(afterQuiz.badges.includes('Juara 100% Tebak Cerita'));
});

test('Misi Petualang Nyata tailors themes per book, adds +2 Bintang Ekstra, and unlocks Pahlawan Alam Grontol', () => {
  const komposBook = DEFAULT_DB.books.find((b) => b.judul.includes('Kapten Pilah'))!;
  const sainsBook = DEFAULT_DB.books.find((b) => b.judul.includes('Sains Dapur'))!;
  const dongengBook = DEFAULT_DB.books.find((b) => b.judul.includes('Lentera Senja'))!;

  const mKompos = getBookRealActionMission(komposBook);
  assert.equal(mKompos.theme, 'kompos-lingkungan');
  assert.equal(mKompos.checklistSteps?.length, 3);

  const mSains = getBookRealActionMission(sainsBook);
  assert.equal(mSains.theme, 'sains-dapur-kebun');
  assert.ok(mSains.observationPrompt);

  const mDongeng = getBookRealActionMission(dongengBook);
  assert.equal(mDongeng.theme, 'alam-dongeng');
  assert.equal(mDongeng.creativeOptions?.length, 2);

  const startState = getDefaultLocalPassportState();
  const res1 = claimRealActionMissionInLocalPassport(
    startState,
    komposBook,
    'Memilah sampah daun & plastik',
  );
  assert.equal(res1.alreadyClaimed, false);
  assert.equal(res1.nextState.extraStars, 2);
  assert.equal(res1.nextState.points, 2);
  assert.equal(res1.nextState.realActionMissions.length, 1);
  assert.ok(res1.nextState.badges.includes(REAL_ACTION_BADGE_NAME));

  // Duplicate claim on the same book does not double-count extraStars
  const resDup = claimRealActionMissionInLocalPassport(res1.nextState, komposBook, 'Ulang');
  assert.equal(resDup.alreadyClaimed, true);
  assert.equal(resDup.nextState.extraStars, 2);
  assert.equal(resDup.nextState.points, 2);
});

test('All curated and BUDI book covers point to existing local assets and legacy generic covers migrate cleanly', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const curatedCovers = new Set<string>();
  for (const book of DEFAULT_DB.books) {
    assert.ok(book.coverUrl, `Missing coverUrl on ${book.kodeBuku}`);
    assert.ok(book.coverUrl.startsWith('/images/'), `Expected local /images path on ${book.kodeBuku}, got ${book.coverUrl}`);
    const diskPath = path.join(process.cwd(), 'public', book.coverUrl);
    assert.equal(fs.existsSync(diskPath), true, `Missing cover file on disk: ${diskPath}`);
    if (book.coverUrl.startsWith('/images/covers/')) {
      assert.equal(curatedCovers.has(book.coverUrl), false, `Duplicate curated cover ${book.coverUrl}`);
      curatedCovers.add(book.coverUrl);
    }
  }
  assert.equal(curatedCovers.size, 12);

  const upgraded = hydrateDatabaseWithDefaults(
    {
      books: [
        {
          ...DEFAULT_DB.books[0],
          coverUrl: '/images/book_cover_folktale_1794800503588.jpg',
        },
        {
          ...DEFAULT_DB.books[4],
          coverUrl: '/images/illustration_eco_garden_1794805037060.jpg',
        },
      ],
    },
    DEFAULT_DB,
  );
  assert.equal(upgraded.books.find((b) => b.kodeBuku === 'IMG-001')?.coverUrl, '/images/covers/bk-01-lentera-gunung.jpg');
  assert.equal(upgraded.books.find((b) => b.kodeBuku === 'KMK-005')?.coverUrl, '/images/covers/bk-05-kapten-pilah.jpg');
});

test('Creation moderation, privacy sanitization, 6 adventure zones, and clamped reading points enforce safety rules', () => {
  assert.equal(CREATION_CATEGORIES.length, 6);

  const sampleCreations: CreationWork[] = [
    ...(DEFAULT_DB.creations ?? []),
    {
      id: 'cr-pending',
      judul: 'Puisi Belum Disetujui',
      kategori: 'Puisi',
      namaSamaran: 'Nadia P.',
      jenjangUsia: 'SD',
      memberNomorInduk: 'ALMA-001',
      ringkasan: 'Ringkasan',
      konten: 'Isi karya menunggu moderasi.',
      createdAt: '2026-11-16',
      parentApproved: false,
      moderationStatus: 'pending',
    },
    {
      id: 'cr-unconsented',
      judul: 'Gambar Belum Izin Wali',
      kategori: 'Gambar',
      namaSamaran: 'Bagus P.',
      jenjangUsia: 'SD',
      memberNomorInduk: 'ALMA-002',
      ringkasan: 'Ringkasan',
      konten: 'Sudah dicek admin tapi belum izin wali.',
      createdAt: '2026-11-16',
      parentApproved: false,
      moderationStatus: 'approved',
    },
  ];

  const publicVisible = filterApprovedCreations(sampleCreations, 'Semua');
  assert.equal(publicVisible.some((c) => c.id === 'cr-pending'), false);
  assert.equal(publicVisible.some((c) => c.id === 'cr-unconsented'), false);
  assert.equal(publicVisible.length, DEFAULT_DB.creations?.length ?? 0);

  const dbWithPending = { ...DEFAULT_DB, creations: sampleCreations };
  const guestView = sanitizeDatabaseForClient(dbWithPending, null);
  assert.equal(guestView.admins.length, 0);
  assert.ok(guestView.members.every((m) => m.password === ''));
  assert.ok(guestView.members.every((m) => m.orangTua === 'Wali Anggota Terdaftar'));
  assert.equal(guestView.creations?.some((c) => c.id === 'cr-pending'), false);

  const memberView = sanitizeDatabaseForClient(dbWithPending, {
    role: 'anggota',
    nomorInduk: 'ALMA-001',
    memberId: 'mem-1',
  });
  assert.equal(memberView.admins.length, 0);
  assert.equal(memberView.creations?.some((c) => c.id === 'cr-pending'), true);
  assert.equal(memberView.creations?.some((c) => c.id === 'cr-unconsented'), false);
  assert.equal(memberView.members.find((m) => m.nomorInduk === 'ALMA-001')?.orangTua, 'Ibu Siti Aminah');
  assert.equal(memberView.members.find((m) => m.nomorInduk === 'ALMA-002')?.orangTua, 'Wali Anggota Terdaftar');

  const zones = computeZoneAdventureStats(DEFAULT_DB.books, DEFAULT_DB.missions, DEFAULT_DB.passportLogs);
  assert.equal(zones.length, 6);
  assert.ok(zones.every((z) => z.progressPercent >= 25 && z.progressPercent <= 100));

  assert.equal(clampValidatedReadingPoints(-5), 0);
  assert.equal(clampValidatedReadingPoints(5), 5);
  assert.equal(clampValidatedReadingPoints(999), 10);
});


