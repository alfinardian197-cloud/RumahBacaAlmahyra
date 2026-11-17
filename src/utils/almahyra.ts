import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  BookPage,
  BookQuizQuestion,
  CreationCategory,
  CreationWork,
  Loan,
  Member,
  PassportLog,
  ReadingJournalEntry,
  ReadingProgress,
  TestimonialItem,
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
  'TK',
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
    zona?: string;
    sumberKatalog?: string;
    maxMinutes?: number;
    onlyActive?: boolean;
    onlyAvailable?: boolean;
    favoriteBookIds?: Set<string>;
    onlyFavorites?: boolean;
  },
): Book[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  const category = opts.category ?? 'Semua';
  const readerLevel = opts.readerLevel ?? 'Semua';
  const zona = opts.zona ?? 'Semua';
  const sumberKatalog = opts.sumberKatalog ?? 'Semua';
  const onlyActive = opts.onlyActive !== false;

  return books.filter((b) => {
    if (onlyActive && b.aktif === false) return false;
    if (opts.onlyAvailable && b.status !== 'Tersedia') return false;
    if (category !== 'Semua' && b.kategori !== category) return false;
    if (zona !== 'Semua' && b.zona !== zona) return false;
    if (sumberKatalog !== 'Semua' && b.sumberKatalog !== sumberKatalog) return false;
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
      b.deskripsi.toLowerCase().includes(q) ||
      (b.subtema ?? '').toLowerCase().includes(q) ||
      (b.sasaranUsia ?? '').toLowerCase().includes(q) ||
      (b.format ?? '').toLowerCase().includes(q) ||
      (b.sumberKatalog ?? '').toLowerCase().includes(q) ||
      (b.catatanKurasi ?? '').toLowerCase().includes(q)
    );
  });
}

export function computeBookShelves(books: Book[], preferredLevel?: string) {
  const active = books.filter(isBookActive);
  const pilihanAlmahyra = active.filter((b) => b.pilihanAlmahyra).slice(0, 6);
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

export type FlipbookPageKind =
  | 'cover'
  | 'opener'
  | 'story'
  | 'info'
  | 'discussion'
  | 'closing'
  | 'back-cover';

export interface FlipbookPageEntry {
  id: string;
  index: number;
  kind: FlipbookPageKind;
  density: 'hard' | 'soft';
  tocTitle: string;
  chapterLabel: string;
  heading: string;
  body?: string;
  moralMessage?: string;
  storyPageNumber?: number;
  totalStoryPages?: number;
  discussionPrompts?: string[];
  hasIllustrationFrame?: boolean;
}

export function buildFlipbookPages(
  book: Book,
  maxCharsPerPage = 260,
): FlipbookPageEntry[] {
  const storyChunks = getBookReadablePages(book, maxCharsPerPage);
  const insideDraft: Omit<FlipbookPageEntry, 'index'>[] = [];

  // 1. Pembuka cerita (halaman kiri saat buku pertama kali dibuka)
  insideDraft.push({
    id: `${book.id}-opener`,
    kind: 'opener',
    density: 'soft',
    tocTitle: 'Pembuka & Pengantar Cerita',
    chapterLabel: 'Pembuka Cerita',
    heading: book.judul,
    body: book.deskripsi,
    hasIllustrationFrame: true,
  });

  // 2. Halaman isi cerita (berpasangan dengan selingan ilustrasi visual)
  storyChunks.forEach((chunk, idx) => {
    insideDraft.push({
      id: `${book.id}-story-${idx + 1}`,
      kind: 'story',
      density: 'soft',
      tocTitle: chunk.judulBab,
      chapterLabel: chunk.judulBab,
      heading: book.judul,
      body: chunk.isi,
      moralMessage: chunk.pesanMoral,
      storyPageNumber: idx + 1,
      totalStoryPages: storyChunks.length,
      hasIllustrationFrame: idx % 2 === 0,
    });
  });

  // 3. Halaman Informasi Buku, Kurasi & Sumber Resmi
  insideDraft.push({
    id: `${book.id}-info`,
    kind: 'info',
    density: 'soft',
    tocTitle: 'Informasi & Sumber Resmi',
    chapterLabel: 'Informasi Bacaan',
    heading: 'Fakta Buku & Sumber Resmi',
    body:
      book.catatanKurasi?.trim() ||
      `Bacaan ${book.kategori} untuk ${book.sasaranUsia ?? book.jenjangPembaca ?? 'semua usia'} di ${book.zona}, Rumah Baca Almahyra.`,
  });

  // 4. Penyeimbang spread genap: tambahkan Obrolan Keluarga jika jumlah halaman dalam ganjil
  // Supaya total halaman dalam (tanpa sampul depan & belakang) SELALU genap & setiap spread 2 halaman penuh
  if ((insideDraft.length + 1) % 2 !== 0) {
    insideDraft.push({
      id: `${book.id}-discussion`,
      kind: 'discussion',
      density: 'soft',
      tocTitle: 'Obrolan Keluarga & Refleksi',
      chapterLabel: 'Obrolan Keluarga',
      heading: 'Ayo Ceritakan Kembali!',
      body: `Ajak ayah, ibu, atau sahabat di Rumah Baca Almahyra mendiskusikan kisah "${book.judul}".`,
      discussionPrompts: [
        `Siapa tokoh atau peristiwa paling berkesan di "${book.judul}"?`,
        `Hal baru apa tentang ${book.kategori.toLowerCase()} yang kamu temukan hari ini?`,
        'Bagaimana cara kita mempraktikkan pesan baik cerita ini di rumah atau Dusun Grontol?',
      ],
    });
  }

  // 5. Penutup cerita + Misi Petualang Nyata + Klaim Stempel
  insideDraft.push({
    id: `${book.id}-closing`,
    kind: 'closing',
    density: 'soft',
    tocTitle: 'Penutup & Misi Aksi Nyata',
    chapterLabel: 'Penutup & Aksi Nyata',
    heading: 'Tamat & Tantangan Aksi Nyata!',
    body:
      'Hore! Kamu telah membaca kisah ini sampai selesai. Klaim stempel E-Paspor Baca dan selesaikan Misi Petualang Nyata di bawah ini!',
  });

  const allDraft: Omit<FlipbookPageEntry, 'index'>[] = [
    {
      id: `${book.id}-front-cover`,
      kind: 'cover',
      density: 'hard',
      tocTitle: 'Sampul Depan',
      chapterLabel: 'Sampul Buku',
      heading: book.judul,
      body: book.deskripsi,
      hasIllustrationFrame: true,
    },
    ...insideDraft,
    {
      id: `${book.id}-back-cover`,
      kind: 'back-cover',
      density: 'hard',
      tocTitle: 'Sampul Belakang',
      chapterLabel: 'Rumah Baca Almahyra',
      heading: 'Terima Kasih Sudah Membaca!',
      body: `Terus bertualang bersama koleksi ${book.kategori} dan kumpulkan stempel E-Paspor Baca di Rumah Baca Almahyra, Dusun Grontol, Desa Tlogosari.`,
    },
  ];

  return allDraft.map((entry, index) => ({
    ...entry,
    index,
  }));
}

export function getFlipbookVisibleIndices(
  currentPageIndex: number,
  totalPages: number,
  isPortrait: boolean,
): number[] {
  if (totalPages <= 0) return [];
  const safeIdx = Math.max(0, Math.min(totalPages - 1, currentPageIndex));
  if (isPortrait || safeIdx === 0 || safeIdx === totalPages - 1) {
    return [safeIdx];
  }
  // In landscape showCover mode: spreads are (1,2), (3,4), (5,6), ...
  const leftIdx = safeIdx % 2 === 1 ? safeIdx : safeIdx - 1;
  const rightIdx = leftIdx + 1;
  if (rightIdx < totalPages - 1) {
    return [leftIdx, rightIdx];
  }
  return [leftIdx];
}

export function getFlipbookSpreadNarrationText(
  book: Book,
  flipPages: FlipbookPageEntry[],
  currentPageIndex: number,
  isPortrait: boolean,
): string {
  const visibleIndices = getFlipbookVisibleIndices(
    currentPageIndex,
    flipPages.length,
    isPortrait,
  );
  if (visibleIndices.length === 0) return book.judul;

  const segments = visibleIndices
    .map((idx) => {
      const p = flipPages[idx];
      if (!p) return '';
      if (p.kind === 'cover') {
        return `${book.judul}. Ditulis oleh ${book.penulis}. ${book.deskripsi}`;
      }
      if (p.kind === 'discussion' && p.discussionPrompts?.length) {
        return `${p.chapterLabel}. ${p.body ?? ''} ${p.discussionPrompts.join(' ')}`;
      }
      return `${p.chapterLabel}. ${p.body ?? ''} ${
        p.moralMessage ? `Pesan cerita: ${p.moralMessage}` : ''
      }`.trim();
    })
    .filter(Boolean);

  return segments.join(' ').trim() || book.judul;
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

export function normalizeAssetUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('/src/assets/images/')) {
    return `/images/${trimmed.slice('/src/assets/images/'.length)}`;
  }
  if (trimmed.startsWith('/public/images/')) {
    return `/images/${trimmed.slice('/public/images/'.length)}`;
  }
  if (trimmed.startsWith('/public/assets/')) {
    return `/assets/${trimmed.slice('/public/assets/'.length)}`;
  }
  return trimmed;
}

const LEGACY_GENERIC_COVER_URLS = new Set([
  '/images/book_cover_folktale_1794800503588.jpg',
  '/images/zone_adventure_craft_1794800503519.jpg',
  '/images/illustration_science_explore_1794805037083.jpg',
  '/images/illustration_eco_garden_1794805037060.jpg',
  '/images/illustration_story_stage_1794805036949.jpg',
  '/images/illustration_telaga_community_1794805036320.jpg',
]);

const LEGACY_PRE_BATCH1_BOOK_CODES = new Set([
  'IMG-001',
  'FBL-002',
  'SNS-003',
  'DNG-004',
  'KMK-005',
  'LNG-006',
  'SJR-007',
  'INS-008',
  'BDY-009',
  'ENS-010',
  'KMK-011',
  'NSN-012',
]);

function isLegacyPreBatch1Book(book: Pick<Book, 'id' | 'kodeBuku'>): boolean {
  const code = (book.kodeBuku ?? '').trim();
  const id = (book.id ?? '').trim();
  return (
    /^bk-\d+$/i.test(id) ||
    code.startsWith('BUDI-') ||
    LEGACY_PRE_BATCH1_BOOK_CODES.has(code)
  );
}

export function hydrateDatabaseWithDefaults(
  incoming: Partial<AlmahyraDatabase>,
  fallback: AlmahyraDatabase,
): AlmahyraDatabase {
  const defaultBooksByCode = new Map(fallback.books.map((b) => [b.kodeBuku, b]));
  const incomingNonLegacyBooks = Array.isArray(incoming.books)
    ? incoming.books.filter((b) => !isLegacyPreBatch1Book(b))
    : [];
  const rawBooks =
    incomingNonLegacyBooks.length > 0 ? incomingNonLegacyBooks : fallback.books;

  const mergedBooks: Book[] = rawBooks.map((b) => {
    const def = defaultBooksByCode.get(b.kodeBuku);
    const rawTrimmedCover = b.coverUrl?.trim();
    const shouldUpgradeLegacyGenericCover = Boolean(
      def?.coverUrl &&
        (!rawTrimmedCover || LEGACY_GENERIC_COVER_URLS.has(rawTrimmedCover)),
    );
    const resolvedCover = shouldUpgradeLegacyGenericCover
      ? normalizeAssetUrl(def?.coverUrl)
      : normalizeAssetUrl(b.coverUrl) || normalizeAssetUrl(def?.coverUrl);
    return {
      ...def,
      ...b,
      jenjangPembaca: b.jenjangPembaca ?? def?.jenjangPembaca ?? 'Semua Usia',
      estimasiMenit: b.estimasiMenit ?? def?.estimasiMenit ?? 5,
      aktif: b.aktif ?? true,
      pilihanAlmahyra: b.pilihanAlmahyra ?? def?.pilihanAlmahyra ?? false,
      dibacaCount: b.dibacaCount ?? def?.dibacaCount ?? 0,
      tanggalTerbit: b.tanggalTerbit ?? def?.tanggalTerbit ?? '2026-11-17',
      isiBacaan: b.isiBacaan && b.isiBacaan.length > 0 ? b.isiBacaan : def?.isiBacaan,
      kuis: b.kuis && b.kuis.length > 0 ? b.kuis : def?.kuis,
      coverUrl: resolvedCover || undefined,
    };
  });

  // Ensure every Batch 1 catalog book is present
  const existingCodes = new Set(mergedBooks.map((b) => b.kodeBuku));
  for (const defBook of fallback.books) {
    if (!existingCodes.has(defBook.kodeBuku)) {
      mergedBooks.push(defBook);
    }
  }

  const validBookIds = new Set(mergedBooks.map((b) => b.id));
  const upgradeMemberCode = (code: string | undefined): string => {
    if (!code) return '';
    return code.replace(/^ALM-/i, 'ALMA-');
  };

  const rawConfig = { ...fallback.config, ...(incoming.config ?? {}) };
  rawConfig.logoUrl = normalizeAssetUrl(rawConfig.logoUrl) || fallback.config.logoUrl;
  rawConfig.heroImageUrl = normalizeAssetUrl(rawConfig.heroImageUrl) || fallback.config.heroImageUrl;
  if (!rawConfig.appName || rawConfig.appName === 'ALMAHYRA App') {
    rawConfig.appName = 'Rumah Baca Almahyra';
  }
  if (!rawConfig.tagline || rawConfig.tagline === 'A Living Learning Adventure') {
    rawConfig.tagline = fallback.config.tagline;
  }
  if (
    !rawConfig.heroTitle ||
    rawConfig.heroTitle === 'Rumah Baca Almahyra' ||
    rawConfig.heroTitle.startsWith('Taman Baca Keluarga') ||
    rawConfig.heroTitle === 'Rumah Baca Keluarga & Petualangan Literasi Anak Desa'
  ) {
    rawConfig.heroTitle = fallback.config.heroTitle;
  }
  if (
    !rawConfig.heroSubtitle ||
    rawConfig.heroSubtitle.startsWith('Ruang belajar komunitas yang hangat')
  ) {
    rawConfig.heroSubtitle = fallback.config.heroSubtitle;
  }
  if (rawConfig.primaryColor === '#047857' || rawConfig.primaryColor === '#136B36') {
    rawConfig.primaryColor = fallback.config.primaryColor;
    rawConfig.secondaryColor = fallback.config.secondaryColor;
    rawConfig.accentColor = fallback.config.accentColor;
  }

  const migratedMembers = (
    incoming.members && incoming.members.length > 0 ? incoming.members : fallback.members
  ).map((m) => ({
    ...m,
    nomorInduk: upgradeMemberCode(m.nomorInduk),
  }));

  const rawIncomingLoans = Array.isArray(incoming.loans)
    ? incoming.loans.filter(
        (l) => !LEGACY_PRE_BATCH1_BOOK_CODES.has(l.kodeBuku) && !l.kodeBuku.startsWith('BUDI-'),
      )
    : [];
  const migratedLoans = (rawIncomingLoans.length > 0 ? rawIncomingLoans : fallback.loans).map(
    (l) => ({
      ...l,
      nomorInduk: upgradeMemberCode(l.nomorInduk),
    }),
  );

  const migratedPassportLogs = (
    Array.isArray(incoming.passportLogs) && incoming.passportLogs.length > 0
      ? incoming.passportLogs
      : fallback.passportLogs
  ).map((p) => ({
    ...p,
    nomorInduk: upgradeMemberCode(p.nomorInduk),
  }));

  const rawProgress = Array.isArray(incoming.readingProgress)
    ? incoming.readingProgress.filter((rp) => validBookIds.has(rp.bookId))
    : [];
  const migratedProgress = (
    rawProgress.length > 0 ? rawProgress : (fallback.readingProgress ?? [])
  ).map((rp) => ({
    ...rp,
    viewerKey: upgradeMemberCode(rp.viewerKey),
  }));

  const rawJournals = Array.isArray(incoming.readingJournals)
    ? incoming.readingJournals.filter((j) => validBookIds.has(j.bookId))
    : [];
  const migratedJournals = (
    rawJournals.length > 0 ? rawJournals : (fallback.readingJournals ?? [])
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
      incoming.readerLevels &&
      incoming.readerLevels.length >= 6 &&
      incoming.readerLevels.includes('TK')
        ? incoming.readerLevels
        : [...(fallback.readerLevels ?? DEFAULT_READER_LEVELS)],
    readingProgress: migratedProgress,
    readingJournals: migratedJournals,
    challenges:
      incoming.challenges && incoming.challenges.length > 0
        ? incoming.challenges
        : (fallback.challenges ?? []),
    creations:
      Array.isArray(incoming.creations) && incoming.creations.length > 0
        ? incoming.creations
        : (fallback.creations ?? []),
    testimonials:
      Array.isArray(incoming.testimonials) && incoming.testimonials.length > 0
        ? incoming.testimonials
        : (fallback.testimonials ?? []),
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

export interface SahabatPhotoCard {
  id: string;
  src: string;
  name: string;
  greeting: string;
  caption: string;
}

export const SAHABAT_GALLERY_PHOTOS: SahabatPhotoCard[] = [
  {
    id: 'sahabat-1',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-16_at_10.49.14_7257879f.jpeg',
    name: 'Sapaan Hangat Sahabat Cilik',
    greeting: 'Hai teman! Yuk masuk ke Pintu Masuk Rumah Baca Almahyra.',
    caption: 'Salam ceria pembuka petualangan membaca bersama keluarga.',
  },
  {
    id: 'sahabat-2',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-16_at_10.49.14__2__1caa94d4.jpeg',
    name: 'Senyum Ceria Teras Baca',
    greeting: 'Halo! Banyak buku bergambar dan cerita seru menantimu di sini.',
    caption: 'Semangat membaca bersama di Teras Rumah Baca Almahyra.',
  },
  {
    id: 'sahabat-3',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-16_at_10.49.14__1__65c278f8.jpeg',
    name: 'Sahabat Almahyra Dusun Grontol',
    greeting: 'Ayo ajak temanmu ikut membaca, berkarya, dan raih bintang literasi!',
    caption: 'Berbagi cerita dan mengundang sahabat untuk petualangan berikutnya.',
  },
];

export interface AdventureJourneyStepDef {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  id:
    | 'pintu-masuk'
    | 'kenali-dunia'
    | 'hutan-buku'
    | 'pintu-cerita'
    | 'misi-literasi'
    | 'bintang-literasi'
    | 'sahabat-almahyra';
  title: string;
  shortTitle: string;
  description: string;
  actionLabel: string;
  photoIndex: number;
}

export const ADVENTURE_JOURNEY_STEPS: AdventureJourneyStepDef[] = [
  {
    stepNumber: 1,
    id: 'pintu-masuk',
    title: 'Pintu Masuk Almahyra',
    shortTitle: 'Pintu Masuk',
    description:
      'Pengunjung disambut dengan ilustrasi menarik, sapaan hangat sahabat cilik Almahyra, serta ajakan ramah untuk memulai perjalanan literasi.',
    actionLabel: 'Mulai Petualangan',
    photoIndex: 0,
  },
  {
    stepNumber: 2,
    id: 'kenali-dunia',
    title: 'Kenali Dunia Almahyra',
    shortTitle: 'Kenali Dunia',
    description:
      'Kenali Rumah Baca keluarga Dusun Grontol, 10+ kategori koleksi, jadwal kegiatan mingguan Senin–Minggu, Kerangka TELAGA, dan tujuan literasi anak.',
    actionLabel: 'Lihat Pilar & Jadwal',
    photoIndex: 1,
  },
  {
    stepNumber: 3,
    id: 'hutan-buku',
    title: 'Jelajahi Hutan Buku',
    shortTitle: 'Hutan Buku',
    description:
      'Pilih bacaan favoritmu berdasarkan 10 kategori, jenjang usia pembaca, waktu baca singkat 5 menit, atau rekomendasi pilihan pendamping.',
    actionLabel: 'Buka Hutan Buku Lengkap',
    photoIndex: 0,
  },
  {
    stepNumber: 4,
    id: 'pintu-cerita',
    title: 'Buka Pintu Cerita',
    shortTitle: 'Pintu Cerita',
    description:
      'Baca sinopsis cerita, langsung masuk ke mode baca penuh layar lengkap dengan musik pengiring cerita, atau lihat langkah mudah meminjam buku cetak.',
    actionLabel: 'Baca Sekarang',
    photoIndex: 1,
  },
  {
    stepNumber: 5,
    id: 'misi-literasi',
    title: 'Selesaikan Misi Literasi',
    shortTitle: 'Misi Literasi',
    description:
      'Jawab kuis pemahaman bacaan, ikuti tantangan membaca mingguan, dan tulis ulasan atau jurnal membaca setelah menamatkan cerita.',
    actionLabel: 'Kerjakan Kuis & Jurnal',
    photoIndex: 2,
  },
  {
    stepNumber: 6,
    id: 'bintang-literasi',
    title: 'Raih Bintang Literasi',
    shortTitle: 'Bintang Literasi',
    description:
      'Kumpulkan poin membaca, stempel digital E-Paspor Baca, lencana prestasi, dan naik jenjang menuju Duta Literasi Almahyra.',
    actionLabel: 'Buka E-Paspor Saya',
    photoIndex: 0,
  },
  {
    stepNumber: 7,
    id: 'sahabat-almahyra',
    title: 'Jadilah Sahabat Almahyra',
    shortTitle: 'Sahabat Almahyra',
    description:
      'Bagikan pengalaman membacamu, kirim ajakan hangat kepada teman sebaya, dan kembali lagi untuk menaklukkan petualangan cerita berikutnya.',
    actionLabel: 'Salin Ajakan Teman',
    photoIndex: 2,
  },
];

export function buildSahabatInvitationText(params: {
  senderName?: string;
  appName?: string;
  booksReadCount: number;
  favoriteBookTitle?: string;
}): string {
  const sender = params.senderName?.trim() || 'Sahabat Almahyra';
  const app = params.appName?.trim() || 'Rumah Baca Almahyra';
  const bookPart = params.favoriteBookTitle
    ? ` Aku baru saja membaca "${params.favoriteBookTitle}"`
    : ' Aku baru saja menjelajahi cerita seru';
  const progressPart =
    params.booksReadCount > 0
      ? ` dan sudah menamatkan ${params.booksReadCount} buku!`
      : ' bersama keluarga!';

  return `Hai teman! Aku ${sender} dari ${app}.${bookPart}${progressPart} Yuk ikut petualangan membaca, dengarkan musik cerita, jawab kuis seru, dan kumpulkan stempel E-Paspor Baca di Rumah Baca Almahyra!`;
}

export function computeJourneyStepStatuses(
  db: AlmahyraDatabase,
  viewerKey: string,
): Record<AdventureJourneyStepDef['id'], boolean> {
  const viewerProgress = (db.readingProgress ?? []).filter((p) => p.viewerKey === viewerKey);
  const member = db.members.find(
    (m) => m.nomorInduk.toLowerCase() === viewerKey.toLowerCase(),
  );
  const viewerJournals = (db.readingJournals ?? []).filter(
    (j) => j.nomorInduk.toLowerCase() === viewerKey.toLowerCase(),
  );

  const hasReadOrBookmarked = viewerProgress.some((p) => p.lastPage > 0 || p.completedCount > 0);
  const hasCompletedMission =
    viewerProgress.some((p) => p.completedCount > 0 || p.quizScore !== undefined) ||
    viewerJournals.length > 0;
  const hasStarsOrPoints =
    (member ? member.poin > 0 : false) ||
    viewerProgress.some((p) => p.completedCount > 0) ||
    db.passportLogs.some((l) => l.nomorInduk.toLowerCase() === viewerKey.toLowerCase());

  return {
    'pintu-masuk': true,
    'kenali-dunia': db.books.length > 0 && db.schedules.length > 0,
    'hutan-buku': db.books.some((b) => b.aktif !== false),
    'pintu-cerita': hasReadOrBookmarked,
    'misi-literasi': hasCompletedMission,
    'bintang-literasi': hasStarsOrPoints,
    'sahabat-almahyra': hasCompletedMission || hasStarsOrPoints,
  };
}

export const LITERACY_SPLASH_QUOTES: string[] = [
  'Dari rumah kecil di Dusun Grontol, lahir penjelajah dunia yang gemar membaca.',
  'Satu halaman cerita setiap hari menumbuhkan rasa ingin tahu sepanjang hayat.',
  'Membaca, berkarya, bertualang, dan merawat bumi bersama keluarga.',
  'Setiap buku adalah pintu baru menuju imajinasi, ilmu pengetahuan, dan budi pekerti.',
];

export interface LeaderboardEntry {
  rank: number;
  member: Member;
  levelInfo: LevelInfo;
}

export function computeTopReadersLeaderboard(
  members: Member[],
  limit = 5,
): LeaderboardEntry[] {
  return [...members]
    .filter((m) => m.status === 'Aktif')
    .sort((a, b) => {
      if (b.poin !== a.poin) return b.poin - a.poin;
      return a.nama.localeCompare(b.nama, 'id');
    })
    .slice(0, Math.max(1, limit))
    .map((member, index) => ({
      rank: index + 1,
      member,
      levelInfo: calculateLevelInfo(member.poin),
    }));
}

export function buildBorrowWhatsAppMessage(params: {
  borrowerName: string;
  memberCode?: string;
  bookCode?: string;
  bookTitle: string;
  borrowDate?: string;
  notes?: string;
}): string {
  const borrower = params.borrowerName.trim() || 'Warga / Orang Tua';
  const codeLine = params.memberCode?.trim()
    ? `Nomor Anggota: ${params.memberCode.trim().toUpperCase()}\n`
    : '';
  const bookLabel = params.bookCode
    ? `${params.bookCode} — ${params.bookTitle}`
    : params.bookTitle;
  const dateLine = params.borrowDate?.trim()
    ? `Rencana Ambil: ${params.borrowDate.trim()}\n`
    : '';
  const noteLine = params.notes?.trim() ? `Catatan: ${params.notes.trim()}\n` : '';

  return (
    `Halo Pengurus Rumah Baca Almahyra,\n\n` +
    `Saya ingin mengajukan peminjaman buku fisik di Teras Almahyra:\n` +
    `Nama Peminjam: ${borrower}\n` +
    codeLine +
    `Buku Dipilih: ${bookLabel}\n` +
    dateLine +
    noteLine +
    `\nTerima kasih, mohon konfirmasi ketersediaan di rak Dusun Grontol.`
  );
}

export function buildDonationWhatsAppMessage(params: {
  donorName: string;
  donorOrigin?: string;
  bookCount: number;
  bookTopics: string;
  condition?: string;
  notes?: string;
}): string {
  const donor = params.donorName.trim() || 'Sahabat Donatur';
  const originLine = params.donorOrigin?.trim()
    ? `Asal/Komunitas: ${params.donorOrigin.trim()}\n`
    : '';
  const condLine = params.condition?.trim() ? `Kondisi: ${params.condition.trim()}\n` : '';
  const noteLine = params.notes?.trim() ? `Catatan: ${params.notes.trim()}\n` : '';

  return (
    `Halo Pengurus Rumah Baca Almahyra,\n\n` +
    `Saya ingin berpartisipasi dalam Gerakan Satu Rumah Satu Buku:\n` +
    `Nama Donatur: ${donor}\n` +
    originLine +
    `Jumlah Buku: ${Math.max(1, params.bookCount)} eksemplar\n` +
    `Judul / Topik: ${params.bookTopics.trim() || 'Buku cerita anak layak baca'}\n` +
    condLine +
    noteLine +
    `\nMohon informasi jadwal penyerahan atau penjemputan buku. Terima kasih!`
  );
}

export function buildWhatsAppShareHref(message: string, phoneDigits = ''): string {
  const cleanPhone = phoneDigits.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

export const STORY_GENERATOR_CHARACTERS = [
  { id: 'kancil', label: 'Kancil Cerdik', trait: 'selalu mengamati dengan teliti dan ramah' },
  { id: 'rara', label: 'Rara Penjelajah', trait: 'gemar membawa buku catatan dan lentera kecil' },
  { id: 'rangkong', label: 'Kakak Rangkong', trait: 'tekun menjaga hutan dan menyayangi keluarganya' },
  { id: 'bima', label: 'Bima Sahabat Kebun', trait: 'suka menanam bibit dan membantu tetangga' },
] as const;

export const STORY_GENERATOR_SETTINGS = [
  { id: 'teras', label: 'Teras Rumah Baca Almahyra', scenery: 'tikar lesehan hangat di bawah lampu senja Dusun Grontol' },
  { id: 'lereng', label: 'Lereng Gunung Tlogosari', scenery: 'sawah hijau berembun dan suara angin pegunungan' },
  { id: 'kebun', label: 'Kebun Literasi Desa', scenery: 'bedeng sayur, bunga kupu-kupu, dan rak buku bambu' },
] as const;

export const STORY_GENERATOR_MORALS = [
  {
    id: 'kejujuran',
    label: 'Kejujuran & Amanah',
    lesson: 'berani berkata jujur dan menjaga barang pinjaman membuat semua teman percaya kepada kita.',
    closingQuestion: 'Mengapa berkata jujur dan mengembalikan buku tepat waktu membuat hati terasa tenang?',
  },
  {
    id: 'gotong-royong',
    label: 'Gotong Royong',
    lesson: 'pekerjaan berat terasa ringan saat dikerjakan bersama dengan senyum dan saling menghargai.',
    closingQuestion: 'Hal baik apa yang bisa kamu lakukan bersama teman atau keluargamu besok?',
  },
  {
    id: 'alam',
    label: 'Cinta Lingkungan',
    lesson: 'merawat tanaman, memilah sampah, dan menyayangi satwa menjaga bumi tetap lestari.',
    closingQuestion: 'Tindakan kecil apa yang bisa kita mulai di rumah untuk menjaga lingkungan sekitar?',
  },
  {
    id: 'gemar-baca',
    label: 'Gemar Bertanya & Membaca',
    lesson: 'setiap pertanyaan yang kita temukan jawabannya di buku membuka jendela petualangan baru.',
    closingQuestion: 'Jika kamu menjadi tokoh dalam cerita tadi, pertanyaan apa yang ingin kamu cari di buku berikutnya?',
  },
] as const;

export interface GeneratedStoryResult {
  title: string;
  characterLabel: string;
  settingLabel: string;
  moralLabel: string;
  paragraphs: string[];
  discussionQuestions: [string, string, string];
}

export function generateBedtimeStoryAndPrompts(params: {
  characterId: string;
  settingId: string;
  moralId: string;
  childName?: string;
}): GeneratedStoryResult {
  const character =
    STORY_GENERATOR_CHARACTERS.find((c) => c.id === params.characterId) ??
    STORY_GENERATOR_CHARACTERS[0];
  const setting =
    STORY_GENERATOR_SETTINGS.find((s) => s.id === params.settingId) ??
    STORY_GENERATOR_SETTINGS[0];
  const moral =
    STORY_GENERATOR_MORALS.find((m) => m.id === params.moralId) ??
    STORY_GENERATOR_MORALS[0];

  const readerName = params.childName?.trim();
  const companionText = readerName
    ? `bersama sahabat kecilnya bernama ${readerName}`
    : 'bersama teman-teman kecil di desa';

  const title = `Kisah ${character.label} di ${setting.label}`;
  const paragraphs = [
    `Sore itu di ${setting.label}, suasana terasa damai dengan ${setting.scenery}. ${character.label}, yang dikenal ${character.trait}, datang ${companionText} untuk mencari ide kegiatan baru.`,
    `Di tengah perjalanan, mereka menemukan sebuah tantangan kecil yang membutuhkan kesabaran dan ketelitian. Alih-alih tergesa-gesa, ${character.label} mengajak semuanya berdiskusi, membuka buku panduan sederhana, lalu mencoba langkah demi langkah dengan gembira.`,
    `Menjelang malam, tantangan itu berhasil diselesaikan dengan indah. Dari pengalaman hari itu mereka belajar tentang ${moral.label.toLowerCase()}: bahwa ${moral.lesson}`,
  ];

  const discussionQuestions: [string, string, string] = [
    `Siapa tokoh yang paling kamu sukai dalam cerita "${title}", dan sifat baik apa yang ia tunjukkan?`,
    `Menurutmu, bagaimana perasaan ${character.label} saat berhasil menyelesaikan tantangan bersama?`,
    moral.closingQuestion,
  ];

  return {
    title,
    characterLabel: character.label,
    settingLabel: setting.label,
    moralLabel: moral.label,
    paragraphs,
    discussionQuestions,
  };
}

export const LOCAL_PASSPORT_STORAGE_KEY = 'almahyra_digital_passport_v1';

export interface LocalPassportStamp {
  id: string;
  bookId: string;
  bookTitle: string;
  category: string;
  claimedAt: string;
  points: number;
}

export type RealActionTheme = 'kompos-lingkungan' | 'sains-dapur-kebun' | 'alam-dongeng';

export interface RealActionMissionSpec {
  theme: RealActionTheme;
  themeLabel: string;
  missionTitle: string;
  instruction: string;
  checklistSteps?: string[];
  observationPrompt?: string;
  observationPlaceholder?: string;
  creativeOptions?: string[];
}

export interface LocalRealActionRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  theme: RealActionTheme;
  note?: string;
  completedAt: string;
  extraStars: number;
}

export const REAL_ACTION_BADGE_NAME = 'Pahlawan Alam Grontol';

export interface LocalDigitalPassportState {
  childName: string;
  points: number;
  extraStars: number;
  stamps: LocalPassportStamp[];
  badges: string[];
  bestQuizScore: number;
  quizAttempts: number;
  realActionMissions: LocalRealActionRecord[];
}

export interface MiniQuizQuestion {
  id: string;
  storyRef: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const MINI_QUIZ_TEBAK_CERITA: MiniQuizQuestion[] = [
  {
    id: 'mq-1',
    storyRef: 'Enggang yang Istimewa (ALM-001)',
    question: 'Mengapa burung enggang disebut istimewa bagi kelestarian hutan Kalimantan?',
    options: [
      'Membantu menyebarkan biji buah hutan agar tumbuh pohon baru',
      'Memotong batang pohon tinggi dengan paruhnya',
      'Menutup aliran sungai menggunakan daun kering',
      'Tinggal di dalam dasar gua batu yang gelap',
    ],
    correctIndex: 0,
    explanation: 'Burung enggang membantu menebar biji tumbuhan hutan sehingga pepohonan terus tumbuh lestari!',
  },
  {
    id: 'mq-2',
    storyRef: 'Ting-Ting-Ting! (ALM-007)',
    question: 'Alat musik tradisional dari bambu apa yang berbunyi ting-ting-ting dalam cerita tersebut?',
    options: [
      'Calung yang disusun sesuai tinggi-rendah nadanya',
      'Gitar listrik yang memakai baterai besar',
      'Terompet tembaga dari kapal laut',
      'Drum plastik bekas kaleng cat',
    ],
    correctIndex: 0,
    explanation: 'Calung dimainkan dengan mengetuk bilah bambu yang panjang-pendeknya menghasilkan tangga nada merdu.',
  },
  {
    id: 'mq-3',
    storyRef: 'Lari! (ALM-008)',
    question: 'Apa sikap tepat ketika melihat tanda bahaya gunung berapi mulai aktif?',
    options: [
      'Tetap tenang, memakai pelindung, dan menuju titik kumpul aman bersama keluarga',
      'Mendekati puncak kawah untuk melihat asap dari dekat',
      'Mengabaikan rambu jalur evakuasi desa',
      'Bersembunyi di bawah atap rapuh tanpa memberi tahu siapa pun',
    ],
    correctIndex: 0,
    explanation: 'Ketenangan dan mengikuti jalur evakuasi aman adalah kunci keselamatan diri saat tanda bahaya muncul.',
  },
  {
    id: 'mq-4',
    storyRef: 'Penjelajahan Tiwi dan Boni (ALM-016)',
    question: 'Planet apa di tata surya yang terkenal memiliki cincin es berkilauan?',
    options: [
      'Saturnus',
      'Merkurius',
      'Mars',
      'Venus',
    ],
    correctIndex: 0,
    explanation: 'Saturnus terkenal dengan sistem cincin es dan debu ruang angkasa yang indah mengitarinya!',
  },
  {
    id: 'mq-5',
    storyRef: 'Perahu Botol (ALM-018)',
    question: 'Mengapa botol plastik bersih yang ditutup rapat bisa membuat perahu mengapung di air?',
    options: [
      'Udara terperangkap di dalam botol memberi daya apung ke atas',
      'Botol plastik berubah menjadi bongkahan besi berat',
      'Air sungai selalu membeku menjadi es di bawah botol',
      'Karena tutup botol dicat warna kuning cerah',
    ],
    correctIndex: 0,
    explanation: 'Udara ringan di dalam botol tertutup rapat menghasilkan gaya apung untuk proyek daur ulang ramah lingkungan!',
  },
];

export function getBookRealActionMission(
  book: Pick<Book, 'judul' | 'kategori' | 'zona' | 'deskripsi'> & { subtema?: string },
): RealActionMissionSpec {
  const haystack = `${book.judul} ${book.kategori} ${book.zona} ${book.subtema ?? ''} ${book.deskripsi}`.toLowerCase();

  if (
    book.kategori === 'Lingkungan dan Alam' ||
    book.zona === 'Zona Sahabat Bumi' ||
    /(kompos|pilah|sampah|daur|pohon|biji|kebun hijau|limbah)/.test(haystack)
  ) {
    return {
      theme: 'kompos-lingkungan',
      themeLabel: 'Tema Kompos & Lingkungan',
      missionTitle: 'Misi Kapten Pilah: Pilah 3 Jenis Sampah & Bahan Kompos',
      instruction:
        'Ajak ayah, ibu, atau kakak memilah sampah di rumah menjadi sampah organik dan anorganik, lalu centang 3 langkah aksimu di bawah ini:',
      checklistSteps: [
        'Mengumpulkan sampah organik rumah (kulit buah, sisa sayur, atau daun kering)',
        'Memisahkan sampah anorganik bersih (botol plastik, kardus, atau kertas bekas)',
        'Menaruh sampah organik ke wadah kompos atau area tanah kebun bersama orang tua',
      ],
    };
  }

  if (
    book.kategori === 'Sains dan Pengetahuan' ||
    book.kategori === 'Ensiklopedia Anak' ||
    book.zona === 'Zona Pengetahuan' ||
    book.zona === 'Zona Eksplorasi' ||
    /(sains|dapur|kebun|eksperimen|kecambah|sawi|kapilaritas|matahari|percobaan)/.test(haystack)
  ) {
    return {
      theme: 'sains-dapur-kebun',
      themeLabel: 'Tema Sains Dapur & Kebun',
      missionTitle: 'Misi Ilmuwan Cilik: Eksperimen Dapur & Kebun di Rumah',
      instruction:
        'Coba satu eksperimen sederhana di rumah — misalnya merendam biji kacang hijau di kapas basah hingga berkecambah atau mencelupkan batang sawi putih ke air berwarna — lalu catat hasil pengamatanmu!',
      observationPrompt: 'Catatan Pengamatan Singkatmu:',
      observationPlaceholder:
        'Contoh: Setelah beberapa jam, ujung daun sawi mulai menyerap warna merah melalui batangnya!',
    };
  }

  return {
    theme: 'alam-dongeng',
    themeLabel: 'Tema Alam & Dongeng',
    missionTitle: 'Misi Sahabat Alam & Dongeng: Gambar Tokoh atau Catat 2 Tanaman',
    instruction:
      'Pilih salah satu aksi seru di rumah: gambarlah tokoh favorit dari cerita ini, atau jalan-jalan sebentar di halaman rumah dan catat 2 jenis tanaman yang kamu temui.',
    creativeOptions: [
      'Menggambar tokoh atau adegan favorit cerita',
      'Mengamati & mencatat 2 jenis tanaman di sekitar rumah',
    ],
    observationPrompt: 'Tulis 2 Jenis Tanaman yang Ditemui atau Deskripsi Gambarmu:',
    observationPlaceholder:
      'Contoh: Di halaman rumah ada pohon mangga dan bunga melati, atau aku menggambar lentera senja!',
  };
}

export function getDefaultLocalPassportState(): LocalDigitalPassportState {
  return {
    childName: '',
    points: 0,
    extraStars: 0,
    stamps: [],
    badges: [],
    bestQuizScore: 0,
    quizAttempts: 0,
    realActionMissions: [],
  };
}

export function loadLocalPassportState(): LocalDigitalPassportState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return getDefaultLocalPassportState();
    }
    const raw = window.localStorage.getItem(LOCAL_PASSPORT_STORAGE_KEY);
    if (!raw) return getDefaultLocalPassportState();
    const parsed = JSON.parse(raw) as Partial<LocalDigitalPassportState>;
    return {
      childName: typeof parsed.childName === 'string' ? parsed.childName : '',
      points: typeof parsed.points === 'number' ? parsed.points : 0,
      extraStars: typeof parsed.extraStars === 'number' ? parsed.extraStars : 0,
      stamps: Array.isArray(parsed.stamps) ? parsed.stamps : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      bestQuizScore: typeof parsed.bestQuizScore === 'number' ? parsed.bestQuizScore : 0,
      quizAttempts: typeof parsed.quizAttempts === 'number' ? parsed.quizAttempts : 0,
      realActionMissions: Array.isArray(parsed.realActionMissions)
        ? parsed.realActionMissions
        : [],
    };
  } catch {
    return getDefaultLocalPassportState();
  }
}

export function saveLocalPassportState(state: LocalDigitalPassportState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_PASSPORT_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function deriveBadgesFromLocalPassport(
  state: LocalDigitalPassportState,
): string[] {
  const badges = new Set<string>(state.badges);
  if (state.stamps.length >= 1) badges.add('Pembaca Pemula');
  if (state.stamps.length >= 3) badges.add('Petualang Cerita');
  if (state.stamps.length >= 5) badges.add('Kutu Buku Grontol');
  if (state.stamps.some((s) => s.category.includes('Lingkungan') || s.category.includes('Komik'))) {
    badges.add('Sahabat Bumi');
  }
  if (state.stamps.some((s) => s.category.includes('Sains'))) {
    badges.add('Ilmuwan Cilik');
  }
  if (state.bestQuizScore >= 60) {
    badges.add('Bintang Kuis Tebak Cerita');
  }
  if (state.bestQuizScore === 100) {
    badges.add('Juara 100% Tebak Cerita');
  }
  if ((state.realActionMissions?.length ?? 0) >= 1) {
    badges.add(REAL_ACTION_BADGE_NAME);
  }
  return Array.from(badges);
}

export function claimBookStampInLocalPassport(
  state: LocalDigitalPassportState,
  book: Pick<Book, 'id' | 'judul' | 'kategori'>,
): { nextState: LocalDigitalPassportState; alreadyClaimed: boolean } {
  const alreadyClaimed = state.stamps.some((s) => s.bookId === book.id);
  const stampPoints = alreadyClaimed ? 0 : 5;
  const newStamp: LocalPassportStamp = {
    id: `ls-${book.id}-${Date.now()}`,
    bookId: book.id,
    bookTitle: book.judul,
    category: book.kategori,
    claimedAt: new Date().toISOString().slice(0, 10),
    points: 5,
  };
  const nextStamps = alreadyClaimed ? state.stamps : [newStamp, ...state.stamps];
  const draft: LocalDigitalPassportState = {
    ...state,
    points: state.points + stampPoints,
    stamps: nextStamps,
  };
  draft.badges = deriveBadgesFromLocalPassport(draft);
  return { nextState: draft, alreadyClaimed };
}

export function claimRealActionMissionInLocalPassport(
  state: LocalDigitalPassportState,
  book: Pick<Book, 'id' | 'judul' | 'kategori' | 'zona' | 'deskripsi'>,
  note?: string,
): {
  nextState: LocalDigitalPassportState;
  alreadyClaimed: boolean;
  missionSpec: RealActionMissionSpec;
} {
  const missionSpec = getBookRealActionMission(book);
  const existing = state.realActionMissions ?? [];
  const alreadyClaimed = existing.some((m) => m.bookId === book.id);
  const extraStarsEarned = alreadyClaimed ? 0 : 2;
  const pointsEarned = alreadyClaimed ? 0 : 2;

  const newRecord: LocalRealActionRecord = {
    id: `ram-${book.id}-${Date.now()}`,
    bookId: book.id,
    bookTitle: book.judul,
    theme: missionSpec.theme,
    note: note?.trim() || undefined,
    completedAt: new Date().toISOString().slice(0, 10),
    extraStars: 2,
  };

  const draft: LocalDigitalPassportState = {
    ...state,
    points: state.points + pointsEarned,
    extraStars: (state.extraStars ?? 0) + extraStarsEarned,
    realActionMissions: alreadyClaimed ? existing : [newRecord, ...existing],
  };
  draft.badges = deriveBadgesFromLocalPassport(draft);
  return { nextState: draft, alreadyClaimed, missionSpec };
}

export function evaluateMiniQuiz(
  questions: MiniQuizQuestion[],
  selectedAnswers: Record<number, number>,
): { correctCount: number; total: number; scorePercent: number; passed: boolean } {
  const total = questions.length;
  const correctCount = questions.reduce(
    (sum, q, idx) => sum + (selectedAnswers[idx] === q.correctIndex ? 1 : 0),
    0,
  );
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  return {
    correctCount,
    total,
    scorePercent,
    passed: scorePercent >= 60,
  };
}

export function recordQuizAttemptInLocalPassport(
  state: LocalDigitalPassportState,
  scorePercent: number,
): LocalDigitalPassportState {
  const earnedBonus = scorePercent >= 60 && state.bestQuizScore < 60 ? 5 : 2;
  const draft: LocalDigitalPassportState = {
    ...state,
    points: state.points + earnedBonus,
    bestQuizScore: Math.max(state.bestQuizScore, scorePercent),
    quizAttempts: state.quizAttempts + 1,
  };
  draft.badges = deriveBadgesFromLocalPassport(draft);
  return draft;
}

export const CREATION_CATEGORIES: CreationCategory[] = [
  'Cerita pendek',
  'Puisi',
  'Gambar',
  'Komik',
  'Resensi buku',
  'Kerajinan',
];

export interface AdventureZoneDef {
  id: string;
  name: string;
  color: string;
  accentBg: string;
  tagline: string;
  description: string;
  activities: string[];
  rewardBadge: string;
  sampleCover: string;
}

export const ADVENTURE_WORLD_ZONES: AdventureZoneDef[] = [
  {
    id: 'zona-imajinasi',
    name: 'Zona Imajinasi',
    color: '#08A9EF',
    accentBg: '#E6F7FE',
    tagline: 'Dongeng Nusantara, Fabel & Dunia Ajaib',
    description: 'Menjelajahi kisah rakyat, fabel ceria, dan cerita dunia yang membangkitkan empati serta daya khayal anak.',
    activities: ['Baca nyaring bersama keluarga', 'Tebak tokoh cerita', 'Gambar adegan favorit'],
    rewardBadge: 'Pemburu Cerita',
    sampleCover: '/images/covers/bk-02-kancil-hutan.jpg',
  },
  {
    id: 'zona-pengetahuan',
    name: 'Zona Pengetahuan',
    color: '#087C3B',
    accentBg: '#E7F6ED',
    tagline: 'Sains Dapur, Kebun & Rasa Ingin Tahu',
    description: 'Belajar konsep sains sederhana dari dapur dan halaman rumah lewat pengamatan langsung yang aman.',
    activities: ['Percobaan kapilaritas sawi', 'Catatan pengamatan cilik', 'Kuis sains harian'],
    rewardBadge: 'Ilmuwan Cilik',
    sampleCover: '/images/covers/bk-03-sains-dapur.jpg',
  },
  {
    id: 'zona-kreativitas',
    name: 'Zona Kreativitas',
    color: '#F58220',
    accentBg: '#FFF1E5',
    tagline: 'Menulis, Origami, Batik & Kerajinan',
    description: 'Ruang berkarya bebas menciptakan puisi, komik 4 panel, origami bintang, hingga pembatas buku alam.',
    activities: ['Minggu Kreasi origami & batik', 'Kirim karya ke Galeri', 'Buat resensi bergambar'],
    rewardBadge: 'Seniman Buku',
    sampleCover: '/images/covers/bk-09-batik-nusantara.jpg',
  },
  {
    id: 'zona-eksplorasi',
    name: 'Zona Eksplorasi',
    color: '#7ED321',
    accentBg: '#F1FBE5',
    tagline: 'Bintang Malam, Tubuh Hebat & Siklus Air',
    description: 'Mengamati langit malam, mengenal cara kerja tubuh manusia, dan menelusuri perjalanan tetes air di desa.',
    activities: ['Observasi fase bulan', 'Jurnal penjelajah cilik', 'Tantangan baca 5 menit'],
    rewardBadge: 'Penjelajah Kata',
    sampleCover: '/images/covers/bk-10-langit-malam.jpg',
  },
  {
    id: 'zona-sahabat-bumi',
    name: 'Zona Sahabat Bumi',
    color: '#075A32',
    accentBg: '#E3F3EA',
    tagline: 'Kompos, Pilah Sampah & Kebun Polibag',
    description: 'Aksi nyata merawat lingkungan Dusun Grontol lewat gerakan Jumat Tukar Sampah dan kebun sayur keluarga.',
    activities: ['Pilah 3 jenis sampah rumah', 'Tanam bibit di polibag', 'Misi Pahlawan Alam Grontol'],
    rewardBadge: 'Pahlawan Alam Grontol',
    sampleCover: '/images/covers/bk-05-kapten-pilah.jpg',
  },
  {
    id: 'zona-panggung-cerita',
    name: 'Zona Panggung Cerita',
    color: '#FFC51B',
    accentBg: '#FFF8DF',
    tagline: 'Sabtu Dongeng, MC Cilik & Kisah Pahlawan',
    description: 'Melatih keberanian berbicara, membaca nyaring, dan meneladani tokoh inspiratif serta pahlawan literasi.',
    activities: ['Sabtu Dongeng boneka tangan', 'Cerita lisan 2 menit', 'Berbagi kisah bersama orang tua'],
    rewardBadge: 'Pencerita Cilik',
    sampleCover: '/images/covers/bk-08-pelita-baca.jpg',
  },
];

export function filterApprovedCreations(
  creations: CreationWork[] | undefined,
  category: 'Semua' | CreationCategory = 'Semua',
): CreationWork[] {
  const list = (creations ?? []).filter(
    (c) => c.parentApproved === true && c.moderationStatus === 'approved',
  );
  if (category === 'Semua') return list;
  return list.filter((c) => c.kategori === category);
}

export function computeZoneAdventureStats(
  books: Book[],
  missions: AlmahyraDatabase['missions'],
  passportLogs: PassportLog[],
): Array<
  AdventureZoneDef & {
    bookCount: number;
    missionCount: number;
    completedCount: number;
    progressPercent: number;
  }
> {
  return ADVENTURE_WORLD_ZONES.map((zone) => {
    const key = zone.name.toLowerCase();
    const bookCount = books.filter(
      (b) => isBookActive(b) && (b.zona ?? '').toLowerCase().includes(key.replace('zona ', '')),
    ).length;
    const missionCount = missions.filter((m) =>
      (m.zona ?? '').toLowerCase().includes(key.replace('zona ', '')),
    ).length;
    const completedCount = passportLogs.filter((log) =>
      (log.zona ?? '').toLowerCase().includes(key.replace('zona ', '')),
    ).length;
    const progressPercent = Math.min(100, 25 + completedCount * 15);
    return {
      ...zone,
      bookCount,
      missionCount,
      completedCount,
      progressPercent,
    };
  });
}

export function clampValidatedReadingPoints(rawPoints: unknown): number {
  const n = Number(rawPoints);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(10, Math.floor(n));
}

export function sanitizeDatabaseForClient(
  db: AlmahyraDatabase,
  session?: Pick<AuthSession, 'role' | 'memberId' | 'nomorInduk'> | null,
): AlmahyraDatabase {
  const role = session?.role;
  const isStaff = role === 'admin' || role === 'superadmin';
  const callerInduk = session?.nomorInduk?.toUpperCase();

  const sanitizedAdmins = db.admins.map((a) => ({
    ...a,
    password: '',
  }));

  const sanitizedMembers = db.members.map((m) => {
    const isSelf = Boolean(callerInduk && m.nomorInduk.toUpperCase() === callerInduk);
    return {
      ...m,
      password: '',
      orangTua: isStaff || isSelf ? m.orangTua : 'Wali Anggota Terdaftar',
    };
  });

  const sanitizedCreations = (db.creations ?? []).filter((c) => {
    if (isStaff) return true;
    const isAuthor = Boolean(callerInduk && c.memberNomorInduk?.toUpperCase() === callerInduk);
    return (c.parentApproved && c.moderationStatus === 'approved') || isAuthor;
  });

  return {
    ...db,
    admins: isStaff ? sanitizedAdmins : [],
    members: sanitizedMembers,
    creations: sanitizedCreations,
  };
}





