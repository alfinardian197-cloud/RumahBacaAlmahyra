import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  ILLUSTRATION_READING_ADVENTURE_URL,
  ILLUSTRATION_TELAGA_COMMUNITY_URL,
} from '../data/defaultDb';
import type { AlmahyraDatabase, Book, ReadingProgress } from '../types/almahyra';
import {
  computeLibraryStats,
  DEFAULT_CATEGORIES,
  DEFAULT_READER_LEVELS,
  filterBooksAdvanced,
} from '../utils/almahyra';
import {
  CollectionZoneInfographic,
  LevelProgressionInfographic,
  PassportFlowInfographic,
} from './AlmahyraInfographics';
import { BerandaShowcase } from './BerandaShowcase';
import { BookCard } from './BookCard';
import { Card3DPassport } from './Card3DPassport';

interface PublicLandingProps {
  db: AlmahyraDatabase;
  viewerKey: string;
  activePage: 'page1' | 'page2';
  onChangePage: (page: 'page1' | 'page2') => void;
  onOpenLogin: () => void;
  onReadBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
}

const TELAGA_PILLARS = [
  {
    code: '01',
    letter: 'T',
    title: 'Teras Almahyra Ramah Anak',
    desc: 'Ruang lesehan, rak rendah yang mudah dijangkau anak, pojok dongeng, papan interaktif, dan suasana santai yang aman.',
  },
  {
    code: '02',
    letter: 'E',
    title: 'Ekosistem Jemput Bola',
    desc: 'Koleksi dekat dengan keseharian anak, Duta Baca Cilik, serta kotak buku titip di titik komunitas yang disepakati.',
  },
  {
    code: '03',
    letter: 'L',
    title: 'Literasi Berbasis Aksi',
    desc: 'Read aloud, membaca lalu praktik, eksperimen sederhana, origami, berkebun, dan kegiatan kreatif.',
  },
  {
    code: '04',
    letter: 'A',
    title: 'Ajang Kreasi Mingguan',
    desc: 'Ritme kegiatan tematik yang konsisten dari Senin sampai Minggu sesuai minat dan usia anak.',
  },
  {
    code: '05',
    letter: 'G',
    title: 'Gotong Royong Desa',
    desc: 'Gerakan donasi Satu Rumah Satu Buku, relawan, kolaborasi pemuda, mahasiswa, orang tua, dan mitra.',
  },
  {
    code: '06',
    letter: 'A',
    title: 'Apresiasi Paspor Baca',
    desc: 'Paspor fisik dan E-Paspor, poin, lencana, jenjang capaian, serta penghargaan yang mendidik.',
  },
];

const ADVENTURE_ZONES = [
  {
    zone: 'Zona Imajinasi',
    focus: 'Cerita dan sastra anak',
    activity: 'Dongeng, fabel, membaca nyaring, dan menceritakan ulang.',
  },
  {
    zone: 'Zona Pengetahuan',
    focus: 'Sains dan pengetahuan umum',
    activity: 'Ensiklopedia, kuis pengetahuan, dan eksperimen sederhana.',
  },
  {
    zone: 'Zona Kreativitas',
    focus: 'Seni dan ekspresi',
    activity: 'Menggambar, origami, menulis cerita, dan kerajinan.',
  },
  {
    zone: 'Zona Eksplorasi',
    focus: 'Belajar melalui praktik',
    activity: 'Percobaan sederhana, proyek kecil, dan observasi.',
  },
  {
    zone: 'Zona Sahabat Bumi',
    focus: 'Lingkungan dan keberlanjutan',
    activity: 'Menanam, memilah sampah bersih, dan daur ulang.',
  },
  {
    zone: 'Zona Panggung Cerita',
    focus: 'Komunikasi dan percaya diri',
    activity: 'Mendongeng, membaca puisi, dan presentasi karya.',
  },
];

const INNOVATIONS = [
  {
    num: '01',
    title: 'Buku Berjalan',
    desc: 'Kotak buku di titik komunitas yang disepakati; sirkulasi dicatat dengan nomor buku atau QR.',
  },
  {
    num: '02',
    title: 'Panggung Almahyra',
    desc: 'Ajang bulanan untuk mendongeng, membaca puisi, atau mempresentasikan karya di hadapan warga.',
  },
  {
    num: '03',
    title: 'Kebun Literasi',
    desc: 'Membaca buku tentang tanaman lalu praktik menanam dan merawat kebun mini di sekitar teras.',
  },
  {
    num: '04',
    title: 'Satu Anak Satu Karya',
    desc: 'Setiap anak didorong menghasilkan satu karya kreatif per bulan untuk dokumentasi galeri.',
  },
  {
    num: '05',
    title: 'Satu Rumah Satu Buku',
    desc: 'Gerakan donasi buku layak baca dari warga desa, alumni, dan mitra komunitas.',
  },
];

export function PublicLanding({
  db,
  viewerKey,
  activePage,
  onChangePage,
  onOpenLogin,
  onReadBook,
  onToggleFavorite,
}: PublicLandingProps) {
  const { config, books, schedules, members } = db;
  const stats = useMemo(() => computeLibraryStats(db), [db]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedLevel, setSelectedLevel] = useState('Semua');
  const [quick5MinOnly, setQuick5MinOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const progressMap = useMemo(() => {
    const map = new Map<string, ReadingProgress>();
    for (const p of db.readingProgress ?? []) {
      if (p.viewerKey === viewerKey) {
        map.set(p.bookId, p);
      }
    }
    return map;
  }, [db.readingProgress, viewerKey]);

  const favoriteBookIds = useMemo(() => {
    const ids = new Set<string>();
    progressMap.forEach((p, bookId) => {
      if (p.isFavorite) ids.add(bookId);
    });
    return ids;
  }, [progressMap]);

  const categories = useMemo(() => {
    const base =
      db.categories && db.categories.length > 0 ? db.categories : [...DEFAULT_CATEGORIES];
    const fromBooks = books.filter((b) => b.aktif !== false).map((b) => b.kategori);
    return ['Semua', ...Array.from(new Set([...base, ...fromBooks]))];
  }, [books, db.categories]);

  const readerLevels = useMemo(() => {
    const base =
      db.readerLevels && db.readerLevels.length > 0
        ? db.readerLevels
        : [...DEFAULT_READER_LEVELS];
    return ['Semua', ...base];
  }, [db.readerLevels]);

  const filteredBooks = useMemo(
    () =>
      filterBooksAdvanced(books, {
        query: searchQuery,
        category: selectedCategory,
        readerLevel: selectedLevel,
        maxMinutes: quick5MinOnly ? 5 : undefined,
        favoriteBookIds,
        onlyFavorites: favoritesOnly,
        onlyActive: true,
      }),
    [books, searchQuery, selectedCategory, selectedLevel, quick5MinOnly, favoriteBookIds, favoritesOnly],
  );

  const featuredMember = members[0] ?? {
    id: 'preview',
    nomorInduk: 'ALMA-001',
    nama: 'Nadia Putri Azzahra',
    jenjangUsia: 'SD',
    orangTua: 'Ibu Siti Aminah',
    poin: 34,
    lencana: ['Pemburu Cerita', 'Pencerita Cilik'],
    status: 'Aktif',
    bergabungSejak: '2026-08-12',
    password: '123',
  };

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      {/* Optional Announcement Strip */}
      {config.showAnnouncement && config.announcementText && (
        <div
          className="border-b border-[#E2E8E5] px-4 py-2.5 text-center text-xs font-medium text-white"
          style={{ backgroundColor: config.primaryColor }}
        >
          <div className="mx-auto max-w-7xl">{config.announcementText}</div>
        </div>
      )}

      {activePage === 'page1' ? (
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9 space-y-12">
          {/* PAGE 1: HERO SPLIT + 3D SPATIAL SHOWCASE */}
          <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-7 space-y-6">
              <div className="space-y-3.5">
                <p
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: 'var(--brand-accent-ink)' }}
                >
                  {config.tagline} · {config.slogan}
                </p>
                <h1
                  className="font-display font-extrabold tracking-tight text-[#111C17] leading-[1.1]"
                  style={{
                    fontSize: 'clamp(2.15rem, 3.8vw, 3.35rem)',
                    textWrap: 'balance',
                  }}
                >
                  {config.heroTitle}
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-[#4A5D54]">
                  {config.heroSubtitle}
                </p>
              </div>

              <dl className="grid grid-cols-3 gap-4 border-y border-[#E2E8E5] py-3.5 text-xs">
                <div>
                  <dt className="text-[#4A5D54]">Metode</dt>
                  <dd className="mt-0.5 font-semibold text-[#111C17]">Kerangka TELAGA</dd>
                </div>
                <div>
                  <dt className="text-[#4A5D54]">Apresiasi</dt>
                  <dd className="mt-0.5 font-semibold text-[#111C17]">E-Paspor 4 Jenjang</dd>
                </div>
                <div>
                  <dt className="text-[#4A5D54]">Koleksi Digital</dt>
                  <dd className="mt-0.5 font-semibold text-[#111C17]">
                    {categories.length - 1} Kategori Bacaan
                  </dd>
                </div>
              </dl>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onChangePage('page2')}
                    style={{ backgroundColor: config.primaryColor }}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 whitespace-nowrap shrink-0"
                  >
                    {config.heroCtaLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-5 py-3 text-sm font-semibold text-[#111C17] transition-colors hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
                  >
                    Buka E-Paspor Anggota
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4A5D54]">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {config.location}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Koordinator: {config.coordinator}</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Spatial Layered Visual + Interactive 3D E-Paspor */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="card-3d-tilt relative overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white p-2 spatial-depth-shadow">
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-[#E7EEEA]">
                  <img
                    src={config.heroImageUrl}
                    alt="Suasana membaca di Teras Rumah Baca Almahyra"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                    <p className="text-xs font-medium text-white/85">
                      Teras Almahyra · Dusun Grontol
                    </p>
                    <p className="font-display text-sm font-bold">
                      Membaca, Bercerita, Bereksperimen & Merawat Bumi
                    </p>
                  </div>
                </div>
              </div>

              <Card3DPassport member={featuredMember} config={config} compact />
            </div>
          </section>

          {/* 4-COLUMN KPI STRIP BELOW HERO SPLIT */}
          <section
            aria-label="Ringkasan statistik perpustakaan"
            className="grid grid-cols-2 gap-4 rounded-2xl border border-[#E2E8E5] bg-white p-6 lg:grid-cols-4"
          >
            <div className="space-y-1 border-r border-[#EEF3F0] pr-4 last:border-r-0">
              <p className="text-xs font-medium text-[#4A5D54]">Koleksi Digital & Cetak</p>
              <p
                className="font-display text-3xl font-bold tabular-nums"
                style={{ color: 'var(--brand-primary-ink)' }}
              >
                {stats.totalTitles}
              </p>
              <p className="text-xs text-[#4A5D54]">
                {stats.totalBooks} eksemplar di {categories.length - 1} kategori
              </p>
            </div>
            <div className="space-y-1 lg:border-r lg:border-[#EEF3F0] lg:pr-4">
              <p className="text-xs font-medium text-[#4A5D54]">Anggota Aktif</p>
              <p
                className="font-display text-3xl font-bold tabular-nums"
                style={{ color: 'var(--brand-primary-ink)' }}
              >
                {stats.activeMembers}
              </p>
              <p className="text-xs text-[#4A5D54]">PAUD, SD & SMP Dusun Grontol</p>
            </div>
            <div className="space-y-1 border-r border-[#EEF3F0] pr-4 lg:border-r">
              <p className="text-xs font-medium text-[#4A5D54]">Misi Tervalidasi</p>
              <p
                className="font-display text-3xl font-bold tabular-nums"
                style={{ color: 'var(--brand-accent-ink)' }}
              >
                {stats.verifiedMissions}
              </p>
              <p className="text-xs text-[#4A5D54]">
                {stats.totalPointsAwarded} poin literasi tercatat
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#4A5D54]">Basis Data</p>
              <p className="font-display text-lg font-bold text-[#111C17] truncate">
                {config.spreadsheetId ? 'Spreadsheet Terhubung' : 'Siap Sinkron Sheet'}
              </p>
              <p className="font-mono-tabular text-xs text-[#4A5D54] truncate">
                {config.spreadsheetId
                  ? `ID: ${config.spreadsheetId.slice(0, 14)}...`
                  : 'Mode Database Terpadu'}
              </p>
            </div>
          </section>

          {/* SECTION A: BERANDA RAK BUKU DIGITAL & MISI MINGGUAN (8 BAGIAN) */}
          <BerandaShowcase
            db={db}
            viewerKey={viewerKey}
            onReadBook={onReadBook}
            onToggleFavorite={onToggleFavorite}
            onOpenCatalog={() => onChangePage('page2')}
          />

          {/* SECTION: KERANGKA PENGELOLAAN TELAGA + ILLUSTRATION */}
          {config.showTelagaSection && (
            <section className="space-y-8">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-2">
                  <p
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--brand-accent-ink)' }}
                  >
                    Fondasi Operasional
                  </p>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-[#111C17] sm:text-3xl">
                    {config.page1IntroTitle}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#4A5D54] sm:text-base">
                    {config.page1IntroBody}
                  </p>
                </div>
                <div className="lg:col-span-5">
                  <div className="card-3d-tilt overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white p-2 spatial-depth-shadow">
                    <div className="aspect-4/3 w-full overflow-hidden rounded-xl bg-[#EEF3F0]">
                      <img
                        src={ILLUSTRATION_TELAGA_COMMUNITY_URL}
                        alt="Ilustrasi komunitas Rumah Baca Almahyra: dongeng teras, kotak buku keliling, dan berkebun bersama"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {TELAGA_PILLARS.map((pillar) => (
                  <article
                    key={pillar.code}
                    className="card-3d-tilt flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white p-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tabular text-xs font-semibold text-[#4A5D54]">
                          {pillar.code}. Pilar {pillar.letter}
                        </span>
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-bold text-white"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          {pillar.letter}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#111C17]">
                        {pillar.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#4A5D54]">
                        {pillar.desc}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: 6 ZONA READING ADVENTURE + PANORAMIC ILLUSTRATION */}
          {config.showZonesSection && (
            <section className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: 'var(--brand-accent-ink)' }}
                  >
                    Almahyra Reading Adventure
                  </p>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-[#111C17]">
                    Peta Enam Zona Petualangan Belajar
                  </h2>
                </div>
                <p className="text-xs text-[#4A5D54]">
                  Anak memilih misi sesuai minat dan usia tanpa tekanan kecepatan membaca.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white p-2 spatial-depth-shadow">
                <div className="relative aspect-16/9 max-h-[420px] w-full overflow-hidden rounded-xl bg-[#EEF3F0]">
                  <img
                    src={ILLUSTRATION_READING_ADVENTURE_URL}
                    alt="Peta ilustrasi enam zona petualangan belajar Rumah Baca Almahyra"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1 text-white sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/85">
                        Peta Visual Ekosistem Belajar
                      </p>
                      <p className="font-display text-lg font-bold">
                        Imajinasi · Pengetahuan · Kreativitas · Eksplorasi · Sahabat Bumi · Panggung Cerita
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ADVENTURE_ZONES.map((z, idx) => (
                  <div
                    key={z.zone}
                    className="rounded-2xl border border-[#E2E8E5] bg-white p-5 transition-colors hover:border-[#BFD0C7]"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-[#4A5D54]">
                      <span className="font-mono-tabular">0{idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{z.focus}</span>
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold text-[#111C17]">
                      {z.zone}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#4A5D54] leading-relaxed">
                      {z.activity}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: INFOGRAFIS ALUR E-PASPOR BACA */}
          <PassportFlowInfographic config={config} />

          {/* SECTION: SISTEM POIN & JENJANG (INFOGRAFIS TANGGA PETUALANGAN) */}
          {config.showLevelsSection && (
            <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 sm:p-8 space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#111C17]">
                    Infografis Jenjang Capaian & Apresiasi E-Paspor Baca
                  </h2>
                  <p className="mt-1 text-sm text-[#4A5D54]">
                    Poin diberikan setelah aktivitas diverifikasi pendamping secara lisan, tulisan, karya, atau praktik.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChangePage('page2')}
                  style={{ backgroundColor: config.primaryColor }}
                  className="inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  Lanjut ke Halaman 2: Katalog & Jadwal
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <LevelProgressionInfographic config={config} />
            </section>
          )}
        </div>
      ) : (
        /* PAGE 2: KATALOG DIGITAL 10+ KATEGORI, JADWAL MINGGUAN & INOVASI */
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12 space-y-14">
          <div className="flex flex-col gap-4 border-b border-[#E2E8E5] pb-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-2">
              <p
                className="text-xs font-semibold"
                style={{ color: 'var(--brand-accent-ink)' }}
              >
                Halaman 2 dari 2 · Layanan Publik {config.appName}
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#111C17]">
                {config.page2Title}
              </h1>
              <p className="text-sm leading-relaxed text-[#4A5D54] sm:text-base">
                {config.page2Subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangePage('page1')}
              className="self-start rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
            >
              Kembali ke Halaman 1: Profil & Rak Pilihan
            </button>
          </div>

          {/* LIVE COLLECTION & SCHEDULE INFOGRAPHICS */}
          <CollectionZoneInfographic
            books={books}
            schedules={schedules}
            config={config}
          />

          {/* KATALOG DIGITAL (10+ KATEGORI, JENJANG PEMBACA, BACA SEKARANG & FAVORIT) */}
          {config.showCatalogSection && (
            <section className="space-y-6">
              <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7D74]"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari judul buku, penulis, sinopsis, atau kode..."
                      aria-label="Cari buku di katalog"
                      className="w-full rounded-xl border border-[#DCE4DF] bg-white py-2.5 pl-10 pr-4 text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#136B36] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Filter jenjang pembaca"
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="rounded-xl border border-[#DCE4DF] bg-white px-3 py-2 text-xs font-semibold text-[#111C17]"
                    >
                      {readerLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Jenjang: {lvl}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setQuick5MinOnly((v) => !v)}
                      aria-pressed={quick5MinOnly}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        quick5MinOnly
                          ? 'text-white border-transparent'
                          : 'border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#F2F6F4]'
                      }`}
                      style={quick5MinOnly ? { backgroundColor: config.primaryColor } : undefined}
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Bacaan &lt;= 5 Menit
                    </button>

                    <button
                      type="button"
                      onClick={() => setFavoritesOnly((v) => !v)}
                      aria-pressed={favoritesOnly}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        favoritesOnly
                          ? 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#F2F6F4]'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                      Favorit ({favoriteBookIds.size})
                    </button>
                  </div>
                </div>

                {/* Category Selector Grid */}
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EEF3F0] p-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-white text-[#111C17] shadow-xs'
                          : 'text-[#4A5D54] hover:text-[#111C17]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredBooks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#CBD6D0] bg-white p-10 text-center space-y-2">
                  <p className="font-display text-base font-semibold text-[#111C17]">
                    Buku tidak ditemukan
                  </p>
                  <p className="text-sm text-[#4A5D54]">
                    Coba ubah kata kunci pencarian, kategori, atau nonaktifkan filter tambahan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      config={config}
                      progress={progressMap.get(book.id)}
                      onRead={onReadBook}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* JADWAL MINGGUAN */}
          {config.showScheduleSection && (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#111C17]">
                    Jadwal Kegiatan Mingguan
                  </h2>
                  <p className="mt-1 text-sm text-[#4A5D54]">
                    Ritme tematik Senin–Minggu di Teras Rumah Baca Almahyra.
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-[#4A5D54]" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="rounded-2xl border border-[#E2E8E5] bg-white p-5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[#4A5D54]">
                      <span className="font-semibold text-[#111C17]">
                        {sch.hari} · {sch.waktu}
                      </span>
                      <span className="font-mono-tabular">
                        {sch.pesertaTerdaftar}/{sch.kuota} anak
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold text-[#111C17]">
                      {sch.program}
                    </h3>
                    <p className="mt-1 text-sm text-[#4A5D54] leading-relaxed">
                      {sch.aktivitas}
                    </p>
                    <p className="mt-3 text-xs font-medium" style={{ color: 'var(--brand-primary-ink)' }}>
                      {sch.zona}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5 INOVASI PENDUKUNG */}
          {config.showInnovationsSection && (
            <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 sm:p-8 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#111C17]">
                    Inovasi Pendukung Komunitas
                  </h2>
                  <p className="mt-1 text-sm text-[#4A5D54]">
                    Gerakan literasi kolaboratif bersama orang tua, pemuda, relawan, dan warga desa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  style={{ backgroundColor: config.accentColor }}
                  className="inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Masuk Portal Anggota / Pengelola
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
                {INNOVATIONS.map((item) => (
                  <div key={item.num} className="space-y-2 border-t border-[#EEF3F0] pt-4">
                    <span className="font-mono-tabular text-xs font-semibold text-[#4A5D54]">
                      {item.num}
                    </span>
                    <h3 className="font-display text-base font-bold text-[#111C17]">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[#4A5D54]">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-[#E2E8E5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-[#4A5D54] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--brand-accent-ink)' }} aria-hidden="true" />
            <span>
              {config.appName} — {config.slogan}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onChangePage('page1')}
              className="hover:text-[#111C17] underline-offset-2 hover:underline"
            >
              Halaman 1: Profil & Beranda
            </button>
            <button
              type="button"
              onClick={() => onChangePage('page2')}
              className="hover:text-[#111C17] underline-offset-2 hover:underline"
            >
              Halaman 2: Katalog & Jadwal
            </button>
            <span>{config.coordinator}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
