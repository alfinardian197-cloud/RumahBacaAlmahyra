import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  BookPage,
  BookQuizQuestion,
  Loan,
  Member,
  PassportLog,
  ReadingJournalEntry,
  ReadingProgress,
  ThemeMode,
} from '../types/almahyra';

export const DEFAULT_CATEGORIES = [
  'Cerita Nusantara',
  'Dongeng Dunia',
  'Fabel dan Cerita Binatang',
  'Komik Edukasi',
  'Sains dan Pengetahuan',
  'Sejarah dan Pahlawan',
  'Lingkungan dan Alam',
  'Kisah Inspiratif',
  'Budaya Indonesia',
  'Ensiklopedia Anak',
] as const;

export const DEFAULT_READER_LEVELS = [
  'PAUD',
  'SD Awal',
  'SD Lanjut',
  'SMP',
  'Semua Usia',
] as const;

export function resolveThemeMode(saved: string | null | undefined): ThemeMode {
  return saved === 'dark' ? 'dark' : 'light';
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

export interface LevelInfo {
  currentLevel: string;
  nextLevel: string | null;
  minPoints: number;
  nextTarget: number;
  pointsToNext: number;
  progressPercent: number;
  rewardHint: string;
}

export const LEVEL_TIERS = [
  {
    name: 'Penjelajah Pemula',
    min: 0,
    target: 5,
    reward: 'Stiker atau alat tulis sederhana',
  },
  {
    name: 'Petualang Cerita',
    min: 5,
    target: 15,
    reward: 'Buku tulis kecil atau bibit tanaman',
  },
  {
    name: 'Penjelajah Pengetahuan',
    min: 15,
    target: 30,
    reward: 'Sertifikat dan hadiah edukatif',
  },
  {
    name: 'Duta Literasi Almahyra',
    min: 30,
    target: 50,
    reward: 'Pin/sertifikat dan kesempatan membantu kegiatan',
  },
] as const;

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  const idMatch = trimmed.match(/^[a-zA-Z0-9-_]{15,100}$/);
  return idMatch ? idMatch[0] : '';
}

export function calculateLevelInfo(points: number): LevelInfo {
  const safePoints = Math.max(0, Math.floor(points));

  if (safePoints >= 50) {
    return {
      currentLevel: 'Duta Literasi Almahyra',
      nextLevel: null,
      minPoints: 50,
      nextTarget: 50,
      pointsToNext: 0,
      progressPercent: 100,
      rewardHint: 'Pin/sertifikat dan kesempatan membantu kegiatan',
    };
  }

  if (safePoints >= 30) {
    return {
      currentLevel: 'Penjelajah Pengetahuan',
      nextLevel: 'Duta Literasi Almahyra',
      minPoints: 30,
      nextTarget: 50,
      pointsToNext: 50 - safePoints,
      progressPercent: Math.round(((safePoints - 30) / (50 - 30)) * 100),
      rewardHint: 'Sertifikat dan hadiah edukatif',
    };
  }

  if (safePoints >= 15) {
    return {
      currentLevel: 'Petualang Cerita',
      nextLevel: 'Penjelajah Pengetahuan',
      minPoints: 15,
      nextTarget: 30,
      pointsToNext: 30 - safePoints,
      progressPercent: Math.round(((safePoints - 15) / (30 - 15)) * 100),
      rewardHint: 'Buku tulis kecil atau bibit tanaman',
    };
  }

  if (safePoints >= 5) {
    return {
      currentLevel: 'Penjelajah Pemula',
      nextLevel: 'Petualang Cerita',
      minPoints: 5,
      nextTarget: 15,
      pointsToNext: 15 - safePoints,
      progressPercent: Math.round(((safePoints - 5) / (15 - 5)) * 100),
      rewardHint: 'Stiker atau alat tulis sederhana',
    };
  }

  return {
    currentLevel: 'Penjelajah Pemula',
    nextLevel: 'Petualang Cerita',
    minPoints: 0,
    nextTarget: 5,
    pointsToNext: 5 - safePoints,
    progressPercent: Math.round((safePoints / 5) * 100),
    rewardHint: 'Capai 5 poin untuk stiker atau alat tulis pertama',
  };
}

export function authenticateUser(
  rawUsername: string,
  rawPassword: string,
  db: Pick<AlmahyraDatabase, 'admins' | 'members'>,
): AuthSession | null {
  const username = rawUsername.trim();
  const password = rawPassword.trim();
  if (!username || !password) return null;

  const lowerUser = username.toLowerCase();

  if (lowerUser === 'admin' && password === 'admin@123') {
    const superAdmin = db.admins.find((a) => a.role === 'superadmin');
    return {
      role: 'superadmin',
      username: 'admin',
      displayName: superAdmin?.nama ?? 'Superadmin Almahyra',
    };
  }

  if (lowerUser === 'admin' && password === 'admin123') {
    const regularAdmin = db.admins.find((a) => a.role === 'admin');
    return {
      role: 'admin',
      username: 'admin',
      displayName: regularAdmin?.nama ?? 'Admin Perpustakaan',
    };
  }

  const matchedAdmin = db.admins.find(
    (a) => a.username.toLowerCase() === lowerUser && a.password === password,
  );
  if (matchedAdmin) {
    return {
      role: matchedAdmin.role,
      username: matchedAdmin.username,
      displayName: matchedAdmin.nama,
    };
  }

  const matchedMember = db.members.find(
    (m) => m.nomorInduk.toLowerCase() === lowerUser && m.password === password,
  );
  if (matchedMember) {
    return {
      role: 'anggota',
      username: matchedMember.nomorInduk,
      displayName: matchedMember.nama,
      memberId: matchedMember.id,
      nomorInduk: matchedMember.nomorInduk,
    };
  }

  return null;
}

export function computeLibraryStats(
  db: Pick<AlmahyraDatabase, 'members' | 'books' | 'loans' | 'passportLogs'>,
) {
  const activeMembers = db.members.filter((m) => m.status === 'Aktif').length;
  const activeCatalogBooks = db.books.filter((b) => b.aktif !== false);
  const totalBooks = activeCatalogBooks.reduce((sum, b) => sum + Math.max(0, b.stok), 0);
  const availableTitles = activeCatalogBooks.filter((b) => b.status === 'Tersedia').length;
  const activeLoans = db.loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat').length;
  const verifiedMissions = db.passportLogs.filter((p) => p.stempel).length;
  const totalPointsAwarded = db.passportLogs.reduce((sum, p) => sum + p.poin, 0);

  return {
    activeMembers,
    totalMembers: db.members.length,
    totalTitles: activeCatalogBooks.length,
    totalBooks,
    availableTitles,
    activeLoans,
    verifiedMissions,
    totalPointsAwarded,
  };
}

export function isBookActive(book: Book): boolean {
  return book.aktif !== false;
}

export function filterBooks(
  books: Book[],
  query: string,
  category: string,
): Book[] {
  return filterBooksAdvanced(books, { query, category, onlyActive: true });
}

export function filterBooksAdvanced(
  books: Book[],
  opts: {
    query?: string;
    category?: string;
    readerLevel?: string;
    maxMinutes?: number;
    onlyActive?: boolean;
    favoriteBookIds?: Set<string>;
    onlyFavorites?: boolean;
  },
): Book[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  const category = opts.category ?? 'Semua';
  const readerLevel = opts.readerLevel ?? 'Semua';
  const onlyActive = opts.onlyActive !== false;

  return books.filter((b) => {
    if (onlyActive && b.aktif === false) return false;
    if (category !== 'Semua' && b.kategori !== category) return false;
    if (
      readerLevel !== 'Semua' &&
      (b.jenjangPembaca ?? 'Semua Usia') !== readerLevel &&
      (b.jenjangPembaca ?? 'Semua Usia') !== 'Semua Usia'
    ) {
      return false;
    }
    if (opts.maxMinutes && (b.estimasiMenit ?? 5) > opts.maxMinutes) return false;
    if (opts.onlyFavorites && opts.favoriteBookIds && !opts.favoriteBookIds.has(b.id)) {
      return false;
    }
    if (!q) return true;
    return (
      b.judul.toLowerCase().includes(q) ||
      b.penulis.toLowerCase().includes(q) ||
      b.kodeBuku.toLowerCase().includes(q) ||
      b.zona.toLowerCase().includes(q) ||
      b.kategori.toLowerCase().includes(q) ||
      b.deskripsi.toLowerCase().includes(q)
    );
  });
}

export function computeBookShelves(books: Book[], preferredLevel?: string) {
  const active = books.filter(isBookActive);
  const pilihanAlmahyra = active.filter((b) => b.pilihanAlmahyra).slice(0, 4);
  const terbaru = [...active]
    .sort((a, b) => (b.tanggalTerbit ?? '').localeCompare(a.tanggalTerbit ?? ''))
    .slice(0, 4);
  const terbanyakDibaca = [...active]
    .sort((a, b) => (b.dibacaCount ?? 0) - (a.dibacaCount ?? 0))
    .slice(0, 4);

  const normalizedPref = (preferredLevel ?? '').toLowerCase();
  const rekomendasiPool = normalizedPref
    ? active.filter((b) => {
        const lvl = (b.jenjangPembaca ?? 'Semua Usia').toLowerCase();
        return lvl.includes(normalizedPref) || lvl === 'semua usia';
      })
    : active;
  const rekomendasi = (rekomendasiPool.length >= 2 ? rekomendasiPool : active).slice(0, 4);

  const ceritaNusantara = active
    .filter(
      (b) =>
        b.kategori === 'Cerita Nusantara' ||
        b.kategori === 'Budaya Indonesia' ||
        b.kategori === 'Sejarah dan Pahlawan',
    )
    .slice(0, 4);

  const komikEdukasi = active.filter((b) => b.kategori === 'Komik Edukasi').slice(0, 4);

  const bacaanSingkat5Menit = active.filter((b) => (b.estimasiMenit ?? 6) <= 5).slice(0, 4);

  return {
    pilihanAlmahyra: pilihanAlmahyra.length > 0 ? pilihanAlmahyra : active.slice(0, 4),
    terbaru,
    terbanyakDibaca,
    rekomendasi,
    ceritaNusantara,
    komikEdukasi,
    bacaanSingkat5Menit,
  };
}

function splitTextIntoReadableChunks(text: string, maxChars: number): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) return [clean];

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    // Fallback word-boundary split if there is no punctuation
    const words = clean.split(/\s+/);
    const chunks: string[] = [];
    let current = '';
    for (const word of words) {
      if (current && current.length + 1 + word.length > maxChars) {
        chunks.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [clean];
  }

  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (sentence.length > maxChars && !current) {
      const subChunks = splitTextIntoReadableChunks(sentence, maxChars);
      chunks.push(...subChunks.slice(0, -1));
      current = subChunks[subChunks.length - 1] ?? '';
      continue;
    }
    if (current && current.length + 1 + sentence.length > maxChars) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [clean];
}

export function getBookReadablePages(book: Book, maxCharsPerPage = 290): BookPage[] {
  const rawPages: BookPage[] =
    book.isiBacaan && book.isiBacaan.length > 0
      ? book.isiBacaan
      : [
          {
            judulBab: 'Bagian 1 · Pengantar Petualangan',
            isi: `${book.deskripsi} Karya ${book.penulis} ini disiapkan untuk menemani petualangan ${book.zona} di Rumah Baca Almahyra.`,
          },
          {
            judulBab: 'Bagian 2 · Inti Bacaan & Pengamatan',
            isi: `Selama membaca "${book.judul}", pembaca diajak mengamati tokoh, gagasan utama, serta peristiwa penting yang dekat dengan kehidupan sehari-hari anak Indonesia.`,
          },
          {
            judulBab: 'Bagian 3 · Refleksi & Aksi Literasi',
            isi: `Setelah memahami isi bacaan, ceritakan kembali 2 hal baru yang kamu pelajari kepada orang tua, teman, atau pendamping Teras Almahyra untuk mendapatkan stempel E-Paspor Baca.`,
            pesanMoral:
              'Membaca membuka jendela rasa ingin tahu dan menumbuhkan keberanian berkarya.',
          },
        ];

  const paginated: BookPage[] = [];
  for (const page of rawPages) {
    const paragraphs = page.isi
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    const chunks =
      paragraphs.length > 1
        ? paragraphs.flatMap((p) => splitTextIntoReadableChunks(p, maxCharsPerPage))
        : splitTextIntoReadableChunks(page.isi, maxCharsPerPage);

    chunks.forEach((chunk, idx) => {
      const isLastChunk = idx === chunks.length - 1;
      paginated.push({
        judulBab:
          chunks.length > 1 ? `${page.judulBab} (${idx + 1}/${chunks.length})` : page.judulBab,
        isi: chunk,
        pesanMoral: isLastChunk ? page.pesanMoral : undefined,
      });
    });
  }

  return paginated;
}

export function getBookQuizQuestions(book: Book): BookQuizQuestion[] {
  if (book.kuis && book.kuis.length > 0) {
    return book.kuis;
  }
  return [
    {
      pertanyaan: `Termasuk ke dalam kategori apakah buku "${book.judul}"?`,
      pilihan: [book.kategori, 'Panduan Olahraga Berat', 'Manual Mesin Industri'],
      jawabanBenar: 0,
      penjelasan: `Tepat! Buku ini termasuk kategori ${book.kategori} di ${book.zona}.`,
    },
    {
      pertanyaan: 'Apa langkah baik yang dilakukan setelah selesai membaca di Rumah Baca Almahyra?',
      pilihan: [
        'Menceritakan kembali atau mencatat kesan di Jurnal Membaca',
        'Menyembunyikan buku agar tidak dibaca teman',
        'Melewati halaman tanpa membaca isinya',
      ],
      jawabanBenar: 0,
      penjelasan: 'Berbagi cerita dan menulis jurnal membantu memperkuat pemahaman serta memperoleh stempel E-Paspor.',
    },
  ];
}

export function recordBookReadingAction(
  db: AlmahyraDatabase,
  params: {
    viewerKey: string;
    bookId: string;
    lastPage: number;
    totalPages: number;
    completed?: boolean;
    quizScore?: number;
    journalNote?: string;
    starRating?: number;
    toggleFavorite?: boolean;
    awardPoints?: number;
  },
): AlmahyraDatabase {
  const book = db.books.find((b) => b.id === params.bookId);
  if (!book) return db;

  const nowDate = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const existingList = db.readingProgress ?? [];
  const existing = existingList.find(
    (p) => p.viewerKey === params.viewerKey && p.bookId === params.bookId,
  );

  const nextFavorite = params.toggleFavorite
    ? !(existing?.isFavorite ?? false)
    : (existing?.isFavorite ?? false);

  const nextCompleted = params.completed
    ? (existing?.completedCount ?? 0) + 1
    : (existing?.completedCount ?? 0);

  const updatedProgress: ReadingProgress = {
    id: existing?.id ?? `rp-${params.viewerKey}-${params.bookId}`,
    viewerKey: params.viewerKey,
    bookId: params.bookId,
    lastPage: Math.max(0, Math.min(params.totalPages - 1, params.lastPage)),
    totalPages: Math.max(1, params.totalPages),
    isFavorite: nextFavorite,
    completedCount: nextCompleted,
    lastReadAt: nowIso,
    quizScore: params.quizScore ?? existing?.quizScore,
  };

  const nextProgressList = existing
    ? existingList.map((p) => (p.id === updatedProgress.id ? updatedProgress : p))
    : [updatedProgress, ...existingList];

  const nextBooks = params.completed
    ? db.books.map((b) =>
        b.id === book.id ? { ...b, dibacaCount: (b.dibacaCount ?? 0) + 1 } : b,
      )
    : db.books;

  let nextMembers = db.members;
  let nextPassportLogs = db.passportLogs;
  let nextJournals = db.readingJournals ?? [];

  if (params.completed) {
    const member = db.members.find(
      (m) => m.nomorInduk.toLowerCase() === params.viewerKey.toLowerCase(),
    );
    const earnedPoints = params.awardPoints ?? 5;
    const cleanNote =
      params.journalNote?.trim() ||
      `Menyelesaikan bacaan "${book.judul}" (${book.kategori}).`;

    if (member) {
      const badgeToGrant =
        book.kategori === 'Komik Edukasi'
          ? 'Pembaca Komik Cerdas'
          : book.kategori === 'Sains dan Pengetahuan'
            ? 'Ilmuwan Cilik'
            : book.kategori === 'Lingkungan dan Alam'
              ? 'Sahabat Bumi'
              : 'Pemburu Cerita';

      nextMembers = db.members.map((m) => {
        if (m.id !== member.id) return m;
        const badges = m.lencana.includes(badgeToGrant)
          ? m.lencana
          : [...m.lencana, badgeToGrant];
        return {
          ...m,
          poin: m.poin + earnedPoints,
          lencana: badges,
        };
      });

      const stampLog: PassportLog = {
        id: `pas-read-${Date.now()}`,
        nomorInduk: member.nomorInduk,
        namaAnggota: member.nama,
        misi: `Baca Digital: ${book.judul}`,
        zona: book.zona,
        poin: earnedPoints,
        pendamping: 'Sistem E-Paspor Digital',
        catatan: cleanNote,
        tanggal: nowDate,
        stempel: true,
        judulBuku: book.judul,
        kategoriBuku: book.kategori,
      };
      nextPassportLogs = [stampLog, ...db.passportLogs];

      const journalEntry: ReadingJournalEntry = {
        id: `jrn-${Date.now()}`,
        nomorInduk: member.nomorInduk,
        namaAnggota: member.nama,
        bookId: book.id,
        judulBuku: book.judul,
        kategoriBuku: book.kategori,
        tanggal: nowDate,
        catatan: cleanNote,
        peringkatBintang: Math.max(1, Math.min(5, params.starRating ?? 5)),
        poinDiperoleh: earnedPoints,
      };
      nextJournals = [journalEntry, ...nextJournals];
    }
  }

  return {
    ...db,
    books: nextBooks,
    members: nextMembers,
    passportLogs: nextPassportLogs,
    readingProgress: nextProgressList,
    readingJournals: nextJournals,
  };
}

export function computeCompanionDashboard(db: AlmahyraDatabase) {
  const progressList = db.readingProgress ?? [];
  const journals = db.readingJournals ?? [];
  const bookMap = new Map(db.books.map((b) => [b.id, b]));

  const categoryScores = new Map<string, number>();
  for (const p of progressList) {
    const b = bookMap.get(p.bookId);
    if (!b) continue;
    const weight = p.completedCount * 2 + (p.isFavorite ? 1 : 0) + 1;
    categoryScores.set(b.kategori, (categoryScores.get(b.kategori) ?? 0) + weight);
  }
  for (const j of journals) {
    categoryScores.set(j.kategoriBuku, (categoryScores.get(j.kategoriBuku) ?? 0) + 2);
  }
  for (const log of db.passportLogs) {
    if (log.kategoriBuku) {
      categoryScores.set(log.kategoriBuku, (categoryScores.get(log.kategoriBuku) ?? 0) + 1);
    }
  }

  const favoriteCategories = Array.from(categoryScores.entries())
    .map(([kategori, skor]) => ({ kategori, skor }))
    .sort((a, b) => b.skor - a.skor);

  const memberReports = db.members.map((member) => {
    const mProgress = progressList.filter((p) => p.viewerKey === member.nomorInduk);
    const mJournals = journals.filter((j) => j.nomorInduk === member.nomorInduk);
    const mLogs = db.passportLogs.filter((l) => l.nomorInduk === member.nomorInduk);

    const completedFromProgress = mProgress.reduce((sum, p) => sum + p.completedCount, 0);
    const booksReadCount = Math.max(completedFromProgress, mJournals.length, mLogs.length);

    const catCount = new Map<string, number>();
    for (const p of mProgress) {
      const b = bookMap.get(p.bookId);
      if (b) catCount.set(b.kategori, (catCount.get(b.kategori) ?? 0) + Math.max(1, p.completedCount));
    }
    for (const j of mJournals) {
      catCount.set(j.kategoriBuku, (catCount.get(j.kategoriBuku) ?? 0) + 1);
    }
    const topCategory =
      Array.from(catCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Cerita Nusantara';

    return {
      member,
      booksReadCount,
      activeBookmarks: mProgress.filter((p) => p.lastPage > 0).length,
      journalsCount: mJournals.length,
      favoriteCount: mProgress.filter((p) => p.isFavorite).length,
      topCategory,
      levelInfo: calculateLevelInfo(member.poin),
      weeklyTarget: member.targetMingguan ?? 3,
      latestActivity: mJournals[0]?.tanggal ?? mLogs[0]?.tanggal ?? member.bergabungSejak,
    };
  });

  const totalBooksRead = memberReports.reduce((sum, r) => sum + r.booksReadCount, 0);
  const totalReadingActivities =
    progressList.length + journals.length + db.passportLogs.length;

  return {
    totalBooksRead,
    totalReadingActivities,
    totalJournals: journals.length,
    activeReadersCount: memberReports.filter((r) => r.booksReadCount > 0 || r.activeBookmarks > 0).length,
    favoriteCategories,
    memberReports,
  };
}

export function parseBulkBooksCsv(
  csvText: string,
  defaultCoverUrl: string,
): Book[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    out.push(current.trim());
    return out;
  };

  const firstCells = splitLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = firstCells.some((c) => c.includes('judul') || c.includes('title'));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line, idx) => {
      const cols = splitLine(line);
      const judul = cols[1] || cols[0];
      if (!judul) return null;
      const kodeBuku = cols[0] || `IMP-${String(idx + 1).padStart(3, '0')}`;
      const penulis = cols[2] || 'Tim Literasi Almahyra';
      const kategori = cols[3] || 'Cerita Nusantara';
      const jenjangPembaca = cols[4] || 'SD Awal';
      const estimasiMenit = Math.max(1, Number(cols[5]) || 5);
      const zona = cols[6] || 'Zona Imajinasi';
      const deskripsi = cols[7] || `Bacaan ${kategori} untuk jenjang ${jenjangPembaca}.`;
      const rawContent = cols[8] || '';

      const isiBacaan: BookPage[] | undefined = rawContent
        ? rawContent.split('|').map((chunk, cIdx) => ({
            judulBab: `Bagian ${cIdx + 1}`,
            isi: chunk.trim(),
          }))
        : undefined;

      const book: Book = {
        id: `bk-imp-${Date.now()}-${idx}`,
        kodeBuku,
        judul,
        penulis,
        kategori,
        jenjangPembaca,
        estimasiMenit,
        zona,
        status: 'Tersedia',
        stok: 2,
        lokasiRak: 'Rak Digital',
        deskripsi,
        coverUrl: defaultCoverUrl,
        aktif: true,
        pilihanAlmahyra: false,
        dibacaCount: 0,
        tanggalTerbit: new Date().toISOString().slice(0, 10),
        isiBacaan,
      };
      return book;
    })
    .filter((b): b is Book => b !== null);
}

export function hydrateDatabaseWithDefaults(
  incoming: Partial<AlmahyraDatabase>,
  fallback: AlmahyraDatabase,
): AlmahyraDatabase {
  const defaultBooksByCode = new Map(fallback.books.map((b) => [b.kodeBuku, b]));
  const rawBooks = Array.isArray(incoming.books) && incoming.books.length > 0
    ? incoming.books
    : fallback.books;

  const mergedBooks: Book[] = rawBooks.map((b) => {
    const def = defaultBooksByCode.get(b.kodeBuku);
    return {
      ...def,
      ...b,
      jenjangPembaca: b.jenjangPembaca ?? def?.jenjangPembaca ?? 'Semua Usia',
      estimasiMenit: b.estimasiMenit ?? def?.estimasiMenit ?? 5,
      aktif: b.aktif ?? true,
      pilihanAlmahyra: b.pilihanAlmahyra ?? def?.pilihanAlmahyra ?? false,
      dibacaCount: b.dibacaCount ?? def?.dibacaCount ?? 0,
      tanggalTerbit: b.tanggalTerbit ?? def?.tanggalTerbit ?? '2026-11-01',
      isiBacaan: b.isiBacaan && b.isiBacaan.length > 0 ? b.isiBacaan : def?.isiBacaan,
      kuis: b.kuis && b.kuis.length > 0 ? b.kuis : def?.kuis,
      coverUrl: b.coverUrl || def?.coverUrl,
    };
  });

  // Ensure curated new categories books exist if migrating from older 8-book DB
  const existingCodes = new Set(mergedBooks.map((b) => b.kodeBuku));
  for (const defBook of fallback.books) {
    if (!existingCodes.has(defBook.kodeBuku)) {
      mergedBooks.push(defBook);
    }
  }

  const upgradeMemberCode = (code: string | undefined): string => {
    if (!code) return '';
    return code.replace(/^ALM-/i, 'ALMA-');
  };

  const rawConfig = { ...fallback.config, ...(incoming.config ?? {}) };
  if (rawConfig.heroTitle?.startsWith('Taman Baca Keluarga')) {
    rawConfig.heroTitle = 'Rumah Baca Keluarga & Petualangan Literasi Anak Desa';
  }

  const migratedMembers = (
    incoming.members && incoming.members.length > 0 ? incoming.members : fallback.members
  ).map((m) => ({
    ...m,
    nomorInduk: upgradeMemberCode(m.nomorInduk),
  }));

  const migratedLoans = (Array.isArray(incoming.loans) ? incoming.loans : fallback.loans).map(
    (l) => ({
      ...l,
      nomorInduk: upgradeMemberCode(l.nomorInduk),
    }),
  );

  const migratedPassportLogs = (
    Array.isArray(incoming.passportLogs) ? incoming.passportLogs : fallback.passportLogs
  ).map((p) => ({
    ...p,
    nomorInduk: upgradeMemberCode(p.nomorInduk),
  }));

  const migratedProgress = (
    Array.isArray(incoming.readingProgress) && incoming.readingProgress.length > 0
      ? incoming.readingProgress
      : (fallback.readingProgress ?? [])
  ).map((rp) => ({
    ...rp,
    viewerKey: upgradeMemberCode(rp.viewerKey),
  }));

  const migratedJournals = (
    Array.isArray(incoming.readingJournals) && incoming.readingJournals.length > 0
      ? incoming.readingJournals
      : (fallback.readingJournals ?? [])
  ).map((j) => ({
    ...j,
    nomorInduk: upgradeMemberCode(j.nomorInduk),
  }));

  return {
    config: rawConfig,
    admins: incoming.admins && incoming.admins.length > 0 ? incoming.admins : fallback.admins,
    members: migratedMembers,
    books: mergedBooks,
    loans: migratedLoans,
    passportLogs: migratedPassportLogs,
    schedules:
      incoming.schedules && incoming.schedules.length > 0 ? incoming.schedules : fallback.schedules,
    missions:
      incoming.missions && incoming.missions.length > 0 ? incoming.missions : fallback.missions,
    categories:
      incoming.categories && incoming.categories.length >= 10
        ? incoming.categories
        : [...(fallback.categories ?? DEFAULT_CATEGORIES)],
    readerLevels:
      incoming.readerLevels && incoming.readerLevels.length > 0
        ? incoming.readerLevels
        : [...(fallback.readerLevels ?? DEFAULT_READER_LEVELS)],
    readingProgress: migratedProgress,
    readingJournals: migratedJournals,
    challenges:
      incoming.challenges && incoming.challenges.length > 0
        ? incoming.challenges
        : (fallback.challenges ?? []),
  };
}

export function recordsToSheetRows<T extends object>(
  columns: { key: keyof T; header: string }[],
  records: T[],
): string[][] {
  const headerRow = columns.map((c) => c.header);
  const dataRows = records.map((rec) =>
    columns.map((c) => {
      const val = rec[c.key];
      if (Array.isArray(val)) return val.join(', ');
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (val === undefined || val === null) return '';
      return String(val);
    }),
  );
  return [headerRow, ...dataRows];
}

export function sheetRowsToRecords(rows: string[][]): Record<string, string>[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h).trim());
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        if (header) {
          obj[header] = String(row[idx] ?? '').trim();
        }
      });
      return obj;
    });
}

export function getMemberLoans(loans: Loan[], nomorInduk: string): Loan[] {
  return loans.filter((l) => l.nomorInduk.toLowerCase() === nomorInduk.toLowerCase());
}

export function getMemberPassportLogs(
  logs: PassportLog[],
  nomorInduk: string,
): PassportLog[] {
  return logs.filter((l) => l.nomorInduk.toLowerCase() === nomorInduk.toLowerCase());
}

export function generateDeterministicQrMatrix(seedText: string, size = 19): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rowOffset + r][colOffset + c] = isBorder || isCore;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (Math.abs(hash) % 10) < 5;
    }
  }

  return matrix;
}

export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(color.trim());
}

export function exportRecordsToCsv<T extends object>(
  columns: { key: keyof T; header: string }[],
  records: T[],
): string {
  const rows = recordsToSheetRows(columns, records);
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(','),
    )
    .join('\n');
}
