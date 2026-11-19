import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Heart,
  Home,
  MapPin,
  MessageSquareQuote,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  DEFAULT_HERO_IMAGE_URL,
  DEFAULT_LOGO_URL,
  ILLUSTRATION_READING_ADVENTURE_URL,
  ILLUSTRATION_TELAGA_COMMUNITY_URL,
} from '../data/defaultDb';
import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  CreationCategory,
  Member,
  ReadingProgress,
} from '../types/almahyra';
import {
  computeBookShelves,
  computeLibraryStats,
  DEFAULT_CATEGORIES,
  DEFAULT_READER_LEVELS,
  filterBooksAdvanced,
  type LocalDigitalPassportState,
} from '../utils/almahyra';
import { AdventureJourneySection } from './AdventureJourneySection';
import { AdventureZonesMapSection } from './AdventureZonesMapSection';
import {
  CollectionZoneInfographic,
  LevelProgressionInfographic,
  PassportFlowInfographic,
} from './AlmahyraInfographics';
import { BerandaShowcase } from './BerandaShowcase';
import { BookCard } from './BookCard';
import { BorrowDonationPanel } from './BorrowDonationPanel';
import { Card3DPassport } from './Card3DPassport';
import { DigitalCertificateModal } from './DigitalCertificateModal';
import { EducationalVideosSection } from './EducationalVideosSection';
import { FamilyLiteracySection } from './FamilyLiteracySection';
import { FourPillarsSection } from './FourPillarsSection';
import { HomepageShowcaseStage } from './HomepageShowcaseStage';
import { LeaderboardAndStoryStudio } from './LeaderboardAndStoryStudio';
import { PassportAndQuizHub } from './PassportAndQuizHub';
import { ResilientImage } from './ResilientImage';
import type { PublicPageId, PublicRoleMode } from './TopBar';

interface PublicLandingProps {
  db: AlmahyraDatabase;
  session: AuthSession | null;
  viewerKey: string;
  activePage: PublicPageId;
  audienceMode: PublicRoleMode;
  localPassport: LocalDigitalPassportState;
  onUpdateLocalPassport: (next: LocalDigitalPassportState) => void;
  onChangePage: (page: PublicPageId, anchorId?: string) => void;
  onOpenLogin: () => void;
  onReadBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  onSubmitCreation: (payload: {
    judul: string;
    kategori: CreationCategory;
    namaSamaran: string;
    jenjangUsia: string;
    ringkasan: string;
    konten: string;
  }) => Promise<{ ok: boolean; message: string }>;
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

const WORKSPACE_LEVEL_CHIPS = ['Semua', 'PAUD', 'TK', 'SD Awal', 'SD Lanjut'] as const;

export function PublicLanding({
  db,
  session,
  viewerKey,
  activePage,
  audienceMode,
  localPassport,
  onUpdateLocalPassport,
  onChangePage,
  onOpenLogin,
  onReadBook,
  onToggleFavorite,
  onSubmitCreation,
}: PublicLandingProps) {
  const { config, books, schedules, members } = db;
  const stats = useMemo(() => computeLibraryStats(db), [db]);

  const resolvedHeroPhoto =
    config.heroImageUrl && !config.heroImageUrl.includes('hero_reading_terrace_')
      ? config.heroImageUrl
      : DEFAULT_HERO_IMAGE_URL;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedLevel, setSelectedLevel] = useState('Semua');
  const [selectedZona, setSelectedZona] = useState('Semua');
  const [selectedSumber, setSelectedSumber] = useState('Semua');
  const [quick5MinOnly, setQuick5MinOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showAllBooksInline, setShowAllBooksInline] = useState(false);
  const [visibleBookCount, setVisibleBookCount] = useState(24);
  const [journeyStep, setJourneyStep] = useState(1);
  const [heroSlide, setHeroSlide] = useState(0);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedVideoZoneId, setSelectedVideoZoneId] = useState<string>('all');
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(undefined);

  const handleOpenVideos = (zoneId: string = 'all', videoId?: string) => {
    setSelectedVideoZoneId(zoneId);
    setSelectedVideoId(videoId);
    onChangePage('video-edukasi');
  };

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

  const zoneOptions = useMemo(() => {
    const set = new Set(books.filter((b) => b.aktif !== false).map((b) => b.zona));
    return ['Semua', ...Array.from(set)];
  }, [books]);

  const sumberOptions = useMemo(() => {
    const set = new Set(
      books
        .filter((b) => b.aktif !== false && b.sumberKatalog)
        .map((b) => b.sumberKatalog as string),
    );
    return ['Semua', ...Array.from(set)];
  }, [books]);

  const filteredBooks = useMemo(
    () =>
      filterBooksAdvanced(books, {
        query: searchQuery,
        category: selectedCategory,
        readerLevel: selectedLevel,
        zona: selectedZona,
        sumberKatalog: selectedSumber,
        maxMinutes: quick5MinOnly ? 5 : undefined,
        favoriteBookIds,
        onlyFavorites: favoritesOnly,
        onlyAvailable: availableOnly,
        onlyActive: true,
      }),
    [
      books,
      searchQuery,
      selectedCategory,
      selectedLevel,
      selectedZona,
      selectedSumber,
      quick5MinOnly,
      favoriteBookIds,
      favoritesOnly,
      availableOnly,
    ],
  );

  const shelves = useMemo(() => computeBookShelves(books, 'SD'), [books]);

  const hasActiveFilter =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'Semua' ||
    selectedLevel !== 'Semua' ||
    selectedZona !== 'Semua' ||
    selectedSumber !== 'Semua' ||
    quick5MinOnly ||
    favoritesOnly ||
    availableOnly ||
    showAllBooksInline;

  const displayedWorkspaceBooks = hasActiveFilter ? filteredBooks : shelves.pilihanAlmahyra;
  const visibleWorkspaceBooks = displayedWorkspaceBooks.slice(0, visibleBookCount);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setSelectedLevel('Semua');
    setSelectedZona('Semua');
    setSelectedSumber('Semua');
    setQuick5MinOnly(false);
    setFavoritesOnly(false);
    setAvailableOnly(false);
    setShowAllBooksInline(false);
    setVisibleBookCount(24);
  };

  const featuredMember: Member = useMemo(() => {
    if (localPassport.childName.trim() || localPassport.points > 0) {
      return {
        id: 'local-guest',
        nomorInduk: 'ALMA-PETUALANG',
        nama: localPassport.childName.trim() || 'Sahabat Cilik Almahyra',
        jenjangUsia: 'SD',
        orangTua: 'Keluarga Dusun Grontol',
        poin: localPassport.points,
        lencana: localPassport.badges,
        status: 'Aktif',
        bergabungSejak: new Date().toISOString().slice(0, 10),
        password: '',
      };
    }
    return (
      members[0] ?? {
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
      }
    );
  }, [localPassport, members]);

  const dailyFeaturedBook = shelves.pilihanAlmahyra[0] ?? books[0];
  const dailyMissionDone = localPassport.stamps.length > 0;

  const renderPageHeader = (eyebrow: string, title: string, subtitle: string) => (
    <div className="flex flex-col gap-4 border-b border-[#E2E8E5] pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-1.5">
        <p className="text-xs font-bold tracking-wide text-[#087C3B] dark:text-[#6EE7B7]">
          {eyebrow}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111C17]">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-[#4A5D54]">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={() => onChangePage('beranda')}
        className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#DCE4DF] bg-white px-4 py-2 text-xs font-bold text-[#111C17] hover:bg-[#FFF2D6] whitespace-nowrap shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Kembali ke Beranda
      </button>
    </div>
  );

  const renderCatalogSection = () => (
    <section
      id="rak-pilihan-workspace"
      aria-label="Jelajahi Dunia Buku Rumah Baca Almahyra"
      className="scroll-mt-20 space-y-6"
    >
      <div className="rounded-3xl border border-[#DCE4DF] bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-[#08A9EF]">
              Pilar Baca · Katalog Resmi Batch 1 ({stats.totalTitles} Judul Terkurasi)
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#111C17]">
              {hasActiveFilter
                ? `Hasil Pencarian & Filter Katalog (${filteredBooks.length} Buku)`
                : 'Jelajahi Buku Pilihan Rumah Baca Almahyra (6 Judul Utama)'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset Filter
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowAllBooksInline((v) => !v);
                setVisibleBookCount(24);
              }}
              style={{
                backgroundColor: showAllBooksInline ? '#F58220' : '#087C3B',
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white hover:opacity-95 whitespace-nowrap"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {showAllBooksInline
                ? 'Tampilkan 6 Buku Pilihan'
                : `Lihat Semua (${stats.totalTitles} Buku)`}
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-3 border-t border-[#EEF3F0] pt-4">
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
                placeholder="Cari judul buku, penulis, zona, atau kata kunci..."
                aria-label="Cari buku di katalog"
                className="w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] py-2.5 pl-10 pr-4 text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#087C3B] focus:outline-none"
              />
            </div>

            <div
              role="group"
              aria-label="Filter jenjang pembaca"
              className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EEF3F0] p-1"
            >
              <span className="inline-flex items-center gap-1 px-2 text-xs font-bold text-[#4A5D54]">
                <Filter className="h-3 w-3" aria-hidden="true" />
                Jenjang:
              </span>
              {WORKSPACE_LEVEL_CHIPS.map((lvl) => {
                const active = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    aria-pressed={active}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#087C3B] text-white shadow-xs'
                        : 'text-[#4A5D54] hover:text-[#111C17]'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter kategori koleksi"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setVisibleBookCount(24);
              }}
              className="rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-semibold text-[#111C17]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Kategori: {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter zona petualangan"
              value={selectedZona}
              onChange={(e) => {
                setSelectedZona(e.target.value);
                setVisibleBookCount(24);
              }}
              className="rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-semibold text-[#111C17]"
            >
              {zoneOptions.map((z) => (
                <option key={z} value={z}>
                  Zona: {z}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter sumber katalog"
              value={selectedSumber}
              onChange={(e) => {
                setSelectedSumber(e.target.value);
                setVisibleBookCount(24);
              }}
              className="rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-semibold text-[#111C17]"
            >
              {sumberOptions.map((src) => (
                <option key={src} value={src}>
                  Sumber: {src}
                </option>
              ))}
            </select>

            <select
              aria-label="Semua jenjang pembaca"
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setVisibleBookCount(24);
              }}
              className="rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-semibold text-[#111C17]"
            >
              {readerLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  Jenjang Lengkap: {lvl}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setAvailableOnly((v) => !v)}
              aria-pressed={availableOnly}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                availableOnly
                  ? 'border-transparent bg-[#087C3B] text-white'
                  : 'border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#F2F6F4]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Tersedia di Rak
            </button>

            <button
              type="button"
              onClick={() => setQuick5MinOnly((v) => !v)}
              aria-pressed={quick5MinOnly}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                quick5MinOnly
                  ? 'border-transparent bg-[#087C3B] text-white'
                  : 'border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#F2F6F4]'
              }`}
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
      </div>

      {/* Book Grid */}
      {displayedWorkspaceBooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CBD6D0] bg-white p-10 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[#111C17]">
            Buku tidak ditemukan untuk filter ini
          </p>
          <p className="text-sm text-[#4A5D54]">
            Coba ubah kata kunci pencarian, jenjang pembaca, atau klik Reset Filter untuk kembali melihat semua buku.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#087C3B] px-4 py-2 text-xs font-bold text-white hover:opacity-95"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Tampilkan 6 Buku Pilihan
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleWorkspaceBooks.map((book) => (
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

          {displayedWorkspaceBooks.length > visibleBookCount && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-xs font-medium text-[#4A5D54]">
                Menampilkan {visibleWorkspaceBooks.length} dari {displayedWorkspaceBooks.length} bahan bacaan
              </p>
              <button
                type="button"
                onClick={() => setVisibleBookCount((c) => c + 24)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#087C3B]/30 bg-white px-5 py-2.5 text-xs font-bold text-[#087C3B] hover:bg-[#E4F7EA] transition-colors"
              >
                Tampilkan 24 Buku Berikutnya ({displayedWorkspaceBooks.length - visibleWorkspaceBooks.length} Tersisa)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const renderScheduleSection = () =>
    config.showScheduleSection ? (
      <section id="jadwal-grontol" className="scroll-mt-20 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-bold"
              style={{ color: 'var(--brand-accent-ink)' }}
            >
              Kegiatan &amp; Agenda Mingguan · Dusun Grontol, Desa Tlogosari
            </p>
            <h2 className="font-display text-2xl font-bold text-[#111C17]">
              Jadwal Kegiatan Literasi Teras Almahyra
            </h2>
            <p className="mt-1 text-sm text-[#4A5D54]">
              Ritme tematik Senin–Minggu yang ramah anak bersama pendamping di Teras Rumah Baca Almahyra.
            </p>
          </div>
          <Calendar className="h-6 w-6 text-[#4A5D54] shrink-0" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="rounded-2xl border border-[#E2E8E5] bg-white p-5"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-[#4A5D54]">
                <span className="font-bold text-[#111C17]">
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
              <p className="mt-3 text-xs font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                {sch.zona}
              </p>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div>
        {/* Optional Announcement Strip */}
        {config.showAnnouncement && config.announcementText && (
          <div className="border-b border-[#075A32]/20 bg-[#087C3B] px-4 py-2 text-center text-xs font-bold text-white">
            <div className="mx-auto max-w-7xl">{config.announcementText}</div>
          </div>
        )}

        {/* PAGE 1 (HOMEPAGE MURNI — PERSIS SEPERTI CONTOH) */}
        {audienceMode === 'petualang' && activePage === 'beranda' && (
          <div>
            {/* ILLUSTRATED SKY-TO-MEADOW HERO CAROUSEL */}
            <section
              id="beranda-hero"
              aria-label="Beranda Dunia Literasi Almahyra"
              className="relative overflow-hidden border-b-4 border-[#5AB82E] bg-gradient-to-b from-[#1CA5F2] via-[#74D7FF] to-[#5FBE2C] dark:from-[#0C3554] dark:via-[#0F4C5C] dark:to-[#0A4F2B]"
            >
              {/* Storybook Clouds & Rolling Green Meadow Backdrop SVG */}
              <svg
                viewBox="0 0 1440 360"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <ellipse cx="140" cy="68" rx="115" ry="34" fill="#FFFFFF" fillOpacity="0.28" />
                <ellipse cx="220" cy="54" rx="75" ry="28" fill="#FFFFFF" fillOpacity="0.28" />
                <ellipse cx="1280" cy="62" rx="130" ry="36" fill="#FFFFFF" fillOpacity="0.25" />
                <ellipse cx="760" cy="48" rx="95" ry="26" fill="#FFFFFF" fillOpacity="0.2" />
                <path
                  d="M0 285 Q 240 230 520 275 T 1060 260 T 1440 280 L 1440 360 L 0 360 Z"
                  fill="#3FA128"
                  fillOpacity="0.45"
                />
                <path
                  d="M0 315 Q 360 270 760 305 T 1440 295 L 1440 360 L 0 360 Z"
                  fill="#087C3B"
                  fillOpacity="0.35"
                />
              </svg>

              {/* Carousel Prev/Next Controls */}
              <button
                type="button"
                onClick={() => setHeroSlide((prev) => (prev + 2) % 3)}
                aria-label="Slide beranda sebelumnya"
                className="absolute left-2 sm:left-4 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 text-[#087C3B] shadow-md transition-transform hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setHeroSlide((prev) => (prev + 1) % 3)}
                aria-label="Slide beranda berikutnya"
                className="absolute right-2 sm:right-4 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 text-[#087C3B] shadow-md transition-transform hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="relative z-10 mx-auto max-w-7xl px-10 pt-6 pb-11 sm:px-14 sm:pt-7 sm:pb-12 lg:px-16">
                {heroSlide === 0 && (
                  <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
                    {/* Left Hero Copy & Ribbon */}
                    <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
                      <h1
                        className="font-display font-extrabold tracking-tight text-white leading-[1.04]"
                        style={{
                          fontSize: 'clamp(2.15rem, 4.1vw, 3.6rem)',
                          textShadow: '0 4px 0 #075A32, 0 10px 22px rgba(7,90,50,0.28)',
                          textWrap: 'balance',
                        }}
                      >
                        {config.heroTitle &&
                        config.heroTitle !== 'Selamat Datang di Dunia Literasi Almahyra!'
                          ? config.heroTitle
                          : 'Halo, Sahabat Petualang!'}
                      </h1>

                      <div className="inline-block rounded-2xl border-2 border-[#FFF4B8] bg-gradient-to-r from-[#FFD633] via-[#FFC51B] to-[#F5A614] px-5 py-2 shadow-md">
                        <p className="font-display text-sm sm:text-base font-extrabold text-[#10281B]">
                          {config.tagline.includes('Baca, Berkarya')
                            ? 'Baca, Berkarya, Bertualang, Raih Prestasi!'
                            : config.tagline}
                        </p>
                      </div>

                      <p className="mx-auto lg:mx-0 max-w-lg text-sm sm:text-base font-bold text-[#0D2E1B] dark:text-[#EEF7F2] leading-snug">
                        Mari jelajahi dunia literasi yang menyenangkan bersama {config.appName}!
                      </p>

                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => onChangePage('petualangan')}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-gradient-to-b from-[#0E9C4D] to-[#075A32] px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                        >
                          <Sparkles className="h-4 w-4 text-[#FFC51B]" aria-hidden="true" />
                          Mulai Petualangan
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangePage('jelajahi-buku')}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFF3B0] bg-gradient-to-b from-[#FFD633] to-[#F4A615] px-6 py-2.5 text-sm font-extrabold text-[#10281B] shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                        >
                          <BookOpen className="h-4 w-4" aria-hidden="true" />
                          Jelajahi Buku
                        </button>
                      </div>
                    </div>

                    {/* Right Mascot + Illustrated Rumah Baca Almahyra Cottage Scene (Zero Empty Card!) */}
                    <div className="lg:col-span-6 flex items-center justify-center">
                      <div className="relative flex items-end justify-center gap-3 sm:gap-5">
                        {/* Decorative Floating Storybook */}
                        <motion.div
                          animate={{ y: [-4, 4, -4], rotate: [-6, -2, -6] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                          aria-hidden="true"
                          className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-[#E6F7FE]/95 text-[#08A9EF] shadow-lg self-start mt-3"
                        >
                          <BookOpen className="h-6 w-6" />
                        </motion.div>

                        {/* Official 3D Mascot Emblem */}
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                          className="relative"
                        >
                          <div className="overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl">
                            <ResilientImage
                              src={DEFAULT_LOGO_URL}
                              fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                              alt="Maskot Resmi Rumah Baca Almahyra"
                              loading="eager"
                              fetchPriority="high"
                              className="h-44 w-44 sm:h-56 sm:w-56 object-cover"
                            />
                          </div>
                          <motion.div
                            animate={{ rotate: [-5, 5, -5], y: [0, -3, 0] }}
                            transition={{ duration: 2.8, repeat: Infinity }}
                            className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-white bg-[#FFC51B] text-[#10281B] shadow-md"
                          >
                            <Star className="h-6 w-6 fill-current" aria-hidden="true" />
                          </motion.div>
                        </motion.div>

                        {/* Illustrated Rumah Baca Almahyra Wooden Cottage Vector */}
                        <div className="hidden sm:flex flex-col items-center pb-1" aria-hidden="true">
                          <svg
                            viewBox="0 0 180 155"
                            className="h-36 w-44 drop-shadow-xl"
                          >
                            {/* Trees behind cottage */}
                            <circle cx="28" cy="78" r="24" fill="#2E8B22" />
                            <circle cx="152" cy="82" r="22" fill="#2E8B22" />
                            <rect x="24" y="96" width="8" height="38" rx="3" fill="#6D4C2F" />
                            <rect x="148" y="98" width="8" height="36" rx="3" fill="#6D4C2F" />
                            {/* Cottage wall & warm timber base */}
                            <rect x="34" y="64" width="112" height="72" rx="8" fill="#FFFDF6" stroke="#D9C598" strokeWidth="3" />
                            {/* Pitched Wooden Roof */}
                            <path d="M20 70 L90 22 L160 70 Z" fill="#C97E2C" stroke="#8F5114" strokeWidth="3" strokeLinejoin="round" />
                            <path d="M36 66 L90 30 L144 66" fill="none" stroke="#F8D285" strokeWidth="3" strokeLinecap="round" />
                            {/* Wooden Signboard */}
                            <rect x="52" y="48" width="76" height="24" rx="5" fill="#FDE6A6" stroke="#9D611D" strokeWidth="2" />
                            <text x="90" y="59" textAnchor="middle" fontSize="8" fontWeight="800" fill="#4A2A08">
                              Rumah Baca
                            </text>
                            <text x="90" y="68" textAnchor="middle" fontSize="8" fontWeight="800" fill="#087C3B">
                              Almahyra
                            </text>
                            {/* Double Teal/Green Doors & Sunny Windows */}
                            <rect x="74" y="92" width="32" height="44" rx="4" fill="#0E8A47" stroke="#075A32" strokeWidth="2.5" />
                            <line x1="90" y1="92" x2="90" y2="136" stroke="#075A32" strokeWidth="2" />
                            <rect x="44" y="90" width="22" height="22" rx="4" fill="#7DD3FC" stroke="#8F5114" strokeWidth="2" />
                            <rect x="114" y="90" width="22" height="22" rx="4" fill="#7DD3FC" stroke="#8F5114" strokeWidth="2" />
                            {/* Golden Trophy Beside Porch */}
                            <path d="M138 118 H154 L151 130 H141 Z" fill="#FFC51B" stroke="#B45309" strokeWidth="1.5" />
                            <rect x="144" y="130" width="4" height="5" fill="#B45309" />
                            <rect x="140" y="135" width="12" height="3" rx="1" fill="#92400E" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {heroSlide === 1 && (
                  <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                      <h1
                        className="font-display font-extrabold tracking-tight text-white leading-[1.06]"
                        style={{
                          fontSize: 'clamp(2rem, 3.8vw, 3.3rem)',
                          textShadow: '0 4px 0 #075A32, 0 10px 22px rgba(7,90,50,0.28)',
                          textWrap: 'balance',
                        }}
                      >
                        {config.heroTitle}
                      </h1>
                      <p className="mx-auto lg:mx-0 max-w-xl text-sm sm:text-base font-bold text-[#0D2E1B] dark:text-[#EEF7F2]">
                        {config.heroSubtitle}
                      </p>
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                        <button
                          type="button"
                          onClick={() => onChangePage('prestasi')}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-gradient-to-b from-[#0E9C4D] to-[#075A32] px-6 py-2.5 text-sm font-extrabold text-white shadow-md"
                        >
                          <Award className="h-4 w-4 text-[#FFC51B]" aria-hidden="true" />
                          Buka E-Paspor &amp; Kuis
                        </button>
                        {dailyFeaturedBook && (
                          <button
                            type="button"
                            onClick={() => onReadBook(dailyFeaturedBook)}
                            className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFF3B0] bg-gradient-to-b from-[#FFD633] to-[#F4A615] px-5 py-2.5 text-sm font-extrabold text-[#10281B] shadow-md"
                          >
                            <BookOpen className="h-4 w-4" aria-hidden="true" />
                            Baca Cepat: {dailyFeaturedBook.judul}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-5 flex justify-center">
                      <div className="overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl w-full max-w-sm preserve-light">
                        <div className="aspect-16/10 w-full overflow-hidden">
                          <ResilientImage
                            src={resolvedHeroPhoto}
                            fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                            alt="Suasana Teras Rumah Baca Almahyra"
                            className="h-full w-full object-cover object-top"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {heroSlide === 2 && (
                  <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                      <h1
                        className="font-display font-extrabold tracking-tight text-white leading-[1.06]"
                        style={{
                          fontSize: 'clamp(2rem, 3.8vw, 3.3rem)',
                          textShadow: '0 4px 0 #075A32, 0 10px 22px rgba(7,90,50,0.28)',
                          textWrap: 'balance',
                        }}
                      >
                        Program TELAGA &amp; Aksi Nyata!
                      </h1>
                      <p className="mx-auto lg:mx-0 max-w-xl text-sm sm:text-base font-bold text-[#0D2E1B] dark:text-[#EEF7F2]">
                        Kolaborasi warga Dusun Grontol menghadirkan pojok dongeng, pinjam buku cetak, donasi Satu Rumah Satu Buku, dan video edukasi 6 zona belajar.
                      </p>
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                        <button
                          type="button"
                          onClick={() => onChangePage('keluarga', 'bagian-telaga')}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-gradient-to-b from-[#0E9C4D] to-[#075A32] px-6 py-2.5 text-sm font-extrabold text-white shadow-md"
                        >
                          Kenali Program TELAGA
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenVideos('all')}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFF3B0] bg-gradient-to-b from-[#FFD633] to-[#F4A615] px-5 py-2.5 text-sm font-extrabold text-[#10281B] shadow-md"
                        >
                          Tonton Video Edukasi
                        </button>
                      </div>
                    </div>
                    <div className="lg:col-span-5 flex justify-center">
                      <div className="overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl w-full max-w-sm preserve-light">
                        <div className="aspect-16/10 w-full overflow-hidden">
                          <ResilientImage
                            src="/assets/aistudio/WhatsApp_Image_2026-11-16_at_10.49.14__2__1caa94d4.jpeg"
                            fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                            alt="Kegiatan literasi anak-anak Dusun Grontol"
                            className="h-full w-full object-cover object-top"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Slide Pagination Dots */}
                <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Pilih slide beranda">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={heroSlide === idx}
                      aria-label={`Slide ${idx + 1}`}
                      onClick={() => setHeroSlide(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        heroSlide === idx
                          ? 'w-7 bg-[#087C3B] ring-2 ring-white'
                          : 'w-2.5 bg-white/80 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* FOUR PASTEL PILLARS + 3-CARD BENTO SHOWCASE (CLEAN HOMEPAGE ONLY) */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20 -mt-5 pb-4 space-y-5">
              <FourPillarsSection
                onExploreRead={() => onChangePage('jelajahi-buku')}
                onExploreVideos={() => handleOpenVideos('all')}
                onExploreAdventure={() => onChangePage('petualangan')}
                onExploreAchievement={() => onChangePage('prestasi')}
              />

              <HomepageShowcaseStage
                books={books}
                featuredBook={dailyFeaturedBook}
                dailyMissionDone={dailyMissionDone}
                onReadBook={onReadBook}
                onOpenAllBooks={() => {
                  setShowAllBooksInline(true);
                  onChangePage('jelajahi-buku');
                }}
                onOpenPassportQuiz={() => onChangePage('prestasi')}
                onOpenVideos={handleOpenVideos}
              />
            </div>
          </div>
        )}

        {/* PAGE 2: JELAJAHI BUKU (KATALOG LENGKAP 252+ BUKU & RAK KURASI) */}
        {audienceMode === 'petualang' && activePage === 'jelajahi-buku' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
            {renderPageHeader(
              'Pilar Baca · Katalog Digital & Cetak Almahyra',
              'Jelajahi Dunia Buku Rumah Baca Almahyra',
              `Temukan ${stats.totalTitles} judul buku bergambar, cerita Nusantara, sains, dan komik edukasi lengkap dengan pembaca Flipbook Interaktif.`,
            )}

            {renderCatalogSection()}

            <BerandaShowcase
              db={db}
              viewerKey={viewerKey}
              onReadBook={onReadBook}
              onToggleFavorite={onToggleFavorite}
              onOpenCatalog={() => {
                setShowAllBooksInline(true);
                document.getElementById('rak-pilihan-workspace')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <CollectionZoneInfographic
              books={books}
              schedules={schedules}
              config={config}
            />
          </div>
        )}

        {/* PAGE 3: PETUALANGAN (6 ZONA, 7 LANGKAH, MISI LITERASI) */}
        {audienceMode === 'petualang' && activePage === 'petualangan' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
            {renderPageHeader(
              'Pilar Bertualang · 6 Zona & 7 Langkah Almahyra',
              'Peta Petualangan & Misi Literasi Almahyra',
              'Pilih zona kesukaanmu, ikuti 7 langkah petualangan membaca, dan selesaikan misi hari ini untuk meraih bintang literasi.',
            )}

            {/* Misi Literasi Hari Ini Card */}
            <section
              id="misi-hari-ini"
              aria-label="Misi Literasi Hari Ini"
              className="overflow-hidden rounded-3xl border-2 border-[#087C3B]/25 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#087C3B] px-6 py-3.5 text-white">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-[#FFC51B]" aria-hidden="true" />
                  <h2 className="font-display text-lg font-bold">Misi Literasi Hari Ini</h2>
                </div>
                <span className="rounded-lg bg-[#FFC51B] px-3 py-1 font-mono-tabular text-xs font-extrabold text-[#10281B]">
                  +10 Poin &amp; Stempel Harian
                </span>
              </div>

              <div className="grid grid-cols-1 items-center gap-6 p-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-3">
                  <h3 className="font-display text-xl font-bold text-[#111C17]">
                    Baca satu cerita favoritmu &amp; selesaikan kuis atau aksi nyatanya!
                  </h3>
                  <p className="text-sm text-[#4A5D54] leading-relaxed">
                    Pilih salah satu buku bergambar, aktifkan fitur Bacakan Cerita bila suka, lalu klaim stempel baca dan tantangan{' '}
                    <strong className="text-[#111C17]">Pahlawan Alam Grontol</strong> di tab Misi &amp; Paspor.
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#4A5D54]">
                      <span>Progres Misi Hari Ini (Perangkat Ini)</span>
                      <span className="font-mono-tabular text-[#087C3B] dark:text-[#6EE7B7]">
                        {dailyMissionDone ? '1 / 1 Selesai!' : '0 / 1 Siap Dikerjakan'}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: dailyMissionDone ? '100%' : '25%',
                          background: 'linear-gradient(90deg, #087C3B 0%, #7ED321 70%, #FFC51B 100%)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-2.5">
                  {dailyFeaturedBook && (
                    <button
                      type="button"
                      onClick={() => onReadBook(dailyFeaturedBook)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#087C3B] px-5 py-3 text-sm font-bold text-white hover:opacity-95"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      Kerjakan Misi: Baca Cerita
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onChangePage('prestasi')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC51B] px-5 py-2.5 text-xs font-extrabold text-[#10281B] hover:opacity-95"
                  >
                    <Award className="h-4 w-4" aria-hidden="true" />
                    Mainkan Mini Kuis Tebak Cerita
                  </button>
                </div>
              </div>
            </section>

            <AdventureZonesMapSection
              db={db}
              onReadBook={onReadBook}
              onFilterByZone={(zoneName) => {
                setSelectedZona(zoneName);
                setVisibleBookCount(24);
                onChangePage('jelajahi-buku');
              }}
              onWatchZoneVideos={(zoneId) => handleOpenVideos(zoneId)}
            />

            <AdventureJourneySection
              db={db}
              viewerKey={viewerKey}
              activeStep={journeyStep}
              onChangeStep={setJourneyStep}
              onReadBook={onReadBook}
              onOpenCatalog={() => {
                setShowAllBooksInline(true);
                onChangePage('jelajahi-buku');
              }}
              onOpenLogin={onOpenLogin}
              onJumpToTelaga={() => onChangePage('keluarga', 'bagian-telaga')}
            />
          </div>
        )}

        {/* PAGE 4: VIDEO EDUKASI (KURASI 10 KANAL EDUKASI BERDASARKAN 6 ZONA ALMAHIRA) */}
        {audienceMode === 'petualang' && activePage === 'video-edukasi' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
            {renderPageHeader(
              'Video Edukasi · 10 Kanal Pilihan Indonesia (TK – SMA)',
              'Video Edukasi 6 Zona Belajar Almahyra',
              'Tonton video pilihan dari Kok Bisa?, Hujan Tanda Tanya, Neuron, Sepulang Sekolah, Kejarcita, Ruangguru, Marbel, Nussa Official, Riri, dan SISI TERANG yang diklasifikasikan sesuai 6 zona petualangan.',
            )}

            <EducationalVideosSection
              initialZoneId={selectedVideoZoneId}
              initialVideoId={selectedVideoId}
            />

            <LeaderboardAndStoryStudio db={db} onOpenLogin={onOpenLogin} />
          </div>
        )}

        {/* PAGE 5: DUNIA KELUARGA (TENTANG KAMI, AGENDA, TELAGA, PINJAM & DONASI, TESTIMONI) */}
        {audienceMode === 'petualang' && activePage === 'keluarga' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
            {renderPageHeader(
              'Dunia Keluarga & Komunitas · Dusun Grontol, Desa Tlogosari',
              'Mengenal Rumah Baca Almahyra, Jadwal & TELAGA',
              'Pusat informasi keluarga, jadwal kegiatan mingguan, program komunitas TELAGA, serta layanan pinjam buku fisik & donasi Satu Rumah Satu Buku.',
            )}

            {/* Mengenal Rumah Baca Almahyra + 3D E-Paspor + KPI Strip */}
            <section
              id="tentang-kami"
              aria-label="Mengenal Rumah Baca Almahyra"
              className="scroll-mt-20 space-y-6"
            >
              <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7 rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8 space-y-5">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                      Tentang Rumah Baca Almahyra · {config.slogan}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-[#111C17]">
                      {config.heroTitle}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#4A5D54]">
                      Berpusat di {config.location} bersama koordinator{' '}
                      <strong className="text-[#111C17]">{config.coordinator}</strong>, {config.heroSubtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-[#FFF8E8] px-4 py-2.5 text-xs font-bold text-[#111C17] hover:bg-[#FFF2D6] whitespace-nowrap"
                    >
                      <Users className="h-4 w-4 text-[#087C3B]" aria-hidden="true" />
                      Masuk Portal Anggota / Pengelola
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangePage('prestasi')}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FFC51B] px-4 py-2.5 text-xs font-extrabold text-[#10281B] hover:opacity-95 whitespace-nowrap"
                    >
                      <Award className="h-4 w-4" aria-hidden="true" />
                      E-Paspor &amp; Kuis ({localPassport.points} Poin)
                    </button>
                  </div>

                  {/* 4-COLUMN KPI STRIP */}
                  <div className="grid grid-cols-2 gap-4 border-t border-[#EEF3F0] pt-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold text-[#4A5D54]">Judul Aktif</p>
                      <p className="font-display text-2xl font-bold tabular-nums text-[#087C3B] dark:text-[#6EE7B7]">
                        {stats.totalTitles}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A5D54]">Eksemplar</p>
                      <p className="font-display text-2xl font-bold tabular-nums text-[#111C17]">
                        {stats.totalBooks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A5D54]">Anggota Aktif</p>
                      <p className="font-display text-2xl font-bold tabular-nums text-[#087C3B] dark:text-[#6EE7B7]">
                        {stats.activeMembers}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A5D54]">Misi Selesai</p>
                      <p className="font-display text-2xl font-bold tabular-nums text-[#F58220]">
                        {stats.verifiedMissions}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <Card3DPassport member={featuredMember} config={config} compact />
                </div>
              </div>
            </section>

            <FamilyLiteracySection
              db={db}
              onOpenLogin={onOpenLogin}
              onReadBook={onReadBook}
            />

            {renderScheduleSection()}

            {config.showTelagaSection && (
              <section id="bagian-telaga" className="scroll-mt-20 space-y-6">
                <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8 lg:grid-cols-12">
                  <div className="lg:col-span-7 space-y-2.5">
                    <p className="text-xs font-bold tracking-wide text-[#F58220]">
                      Program Komunitas TELAGA &amp; Gotong Royong Desa
                    </p>
                    <h2 className="font-display text-2xl font-bold text-[#111C17]">
                      {config.page1IntroTitle}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#4A5D54]">
                      {config.page1IntroBody}
                    </p>
                  </div>
                  <div className="lg:col-span-5">
                    <div className="overflow-hidden rounded-2xl border border-[#DCE4DF] bg-[#EEF3F0]">
                      <ResilientImage
                        src={ILLUSTRATION_TELAGA_COMMUNITY_URL}
                        fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                        alt="Ilustrasi Komunitas TELAGA Rumah Baca Almahyra"
                        className="aspect-4/3 w-full object-cover object-top"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {TELAGA_PILLARS.map((pillar) => (
                    <article
                      key={pillar.code}
                      className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tabular text-xs font-semibold text-[#4A5D54]">
                          {pillar.code}. Pilar {pillar.letter}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087C3B] font-display text-sm font-bold text-white">
                          {pillar.letter}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#111C17]">
                        {pillar.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#4A5D54]">{pillar.desc}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <BorrowDonationPanel db={db} defaultTab="borrow" />

            {(db.testimonials?.length ?? 0) > 0 && (
              <section aria-label="Testimoni Orang Tua, Relawan, dan Anak" className="space-y-5">
                <div>
                  <p className="text-xs font-bold tracking-wide text-[#087C3B] dark:text-[#6EE7B7] flex items-center gap-1.5">
                    <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
                    Suara Hangat Warga &amp; Keluarga Dusun Grontol
                  </p>
                  <h2 className="font-display text-2xl font-bold text-[#111C17]">
                    Cerita Mereka Bersama Rumah Baca Almahyra
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {(db.testimonials ?? []).map((t) => (
                    <article
                      key={t.id}
                      className="flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-1" aria-label={`Rating ${t.rating} dari 5`}>
                          {Array.from({ length: Math.min(5, Math.max(1, t.rating)) }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-[#FFC51B] text-[#B45309]"
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="text-sm leading-relaxed text-[#4A5D54]">
                          &ldquo;{t.kutipan}&rdquo;
                        </p>
                      </div>

                      <div className="border-t border-[#EEF3F0] pt-3">
                        <p className="font-display text-sm font-bold text-[#111C17]">{t.nama}</p>
                        <p className="text-xs text-[#4A5D54]">
                          {t.peran} · {t.komunitas}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* PAGE 6: PRESTASI (E-PASPOR BACA, MINI KUIS, JENJANG CAPAIAN & SERTIFIKAT) */}
        {audienceMode === 'petualang' && activePage === 'prestasi' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
            {renderPageHeader(
              'Pilar Raih Prestasi · Apresiasi Literasi Anak',
              'E-Paspor Baca, Mini Kuis & Jenjang Prestasi',
              'Kumpulkan stempel buku, jawab kuis tebak cerita, pantau kenaikan jenjang capaian, dan unduh sertifikat digital keluarga.',
            )}

            <PassportAndQuizHub
              db={db}
              passport={localPassport}
              onUpdatePassport={onUpdateLocalPassport}
              onOpenCatalog={() => onChangePage('jelajahi-buku')}
              onOpenLogin={onOpenLogin}
            />

            <PassportFlowInfographic config={config} />

            {config.showLevelsSection && (
              <div className="rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#B45309]">
                      Jenjang Capaian · Apresiasi Tanpa Tekanan
                    </p>
                    <h2 className="font-display text-2xl font-bold text-[#111C17]">
                      Jenjang Capaian, E-Paspor Baca &amp; Sertifikat Digital
                    </h2>
                    <p className="mt-1 text-sm text-[#4A5D54]">
                      Setiap buku, kuis, dan aksi nyata dihargai dengan bintang literasi, lencana, dan piagam digital keluarga.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC51B] px-4 py-2.5 text-xs font-extrabold text-[#10281B] hover:opacity-95 whitespace-nowrap shrink-0"
                  >
                    <Award className="h-4 w-4" aria-hidden="true" />
                    Pratinjau Sertifikat Digital
                  </button>
                </div>

                <LevelProgressionInfographic config={config} />
              </div>
            )}

            {/* Warm Join Family Banner */}
            <div className="rounded-3xl border-2 border-[#FFC51B] bg-gradient-to-r from-[#087C3B] via-[#087C3B] to-[#075A32] p-6 sm:p-8 text-white preserve-light">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#FFC51B]">
                    Gerakan Literasi Keluarga &amp; Sahabat Anak
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                    Ayo Bergabung Menjadi Keluarga Almahyra!
                  </h2>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Masuk menggunakan Nomor Induk Anggota (mis. <strong>ALMA-001</strong>) untuk membuka Dasbor Anak, Dasbor Orang Tua, jurnal bersama, dan unduh sertifikat literasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-2 self-start rounded-xl bg-[#FFC51B] px-5 py-3 text-sm font-extrabold text-[#10281B] shadow-md hover:opacity-95 shrink-0"
                >
                  Masuk Sekarang
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE SAHABAT TELAGA VIEWS */}
        {audienceMode === 'telaga' && activePage === 'telaga-program' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10 space-y-12">
            <section className="rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-2.5">
                  <p
                    className="text-xs font-bold tracking-wide"
                    style={{ color: 'var(--brand-accent-ink)' }}
                  >
                    Mode Sahabat TELAGA · Donatur, Orang Tua &amp; Informasi Kegiatan
                  </p>
                  <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#111C17]">
                    Kolaborasi Literasi Dusun Grontol, Desa Tlogosari
                  </h1>
                  <p className="text-sm sm:text-base leading-relaxed text-[#4A5D54]">
                    Temukan kerangka kerja TELAGA, jadwal kegiatan literasi mingguan anak-anak Dusun Grontol, serta akses cepat formulir pinjam buku fisik dan donasi Gerakan Satu Rumah Satu Buku ke WhatsApp pengurus.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href="#formulir-pinjam-donasi"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-5 py-3 text-sm font-bold text-white hover:opacity-95 whitespace-nowrap"
                  >
                    Kirim Pinjam / Donasi WA
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onChangePage('telaga-katalog')}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-5 py-3 text-sm font-bold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
                  >
                    Cek Katalog Ketersediaan
                  </button>
                </div>
              </div>
            </section>

            <BorrowDonationPanel db={db} defaultTab="donate" />

            {renderScheduleSection()}

            {config.showTelagaSection && (
              <section id="bagian-telaga" className="scroll-mt-20 space-y-8">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-7 space-y-2">
                    <p
                      className="text-xs font-bold tracking-wide"
                      style={{ color: 'var(--brand-accent-ink)' }}
                    >
                      Fondasi Operasional Program TELAGA
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
                        <ResilientImage
                          src={ILLUSTRATION_TELAGA_COMMUNITY_URL}
                          fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                          alt="Ilustrasi komunitas Rumah Baca Almahyra"
                          className="h-full w-full object-cover object-top"
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
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087C3B] font-display text-sm font-bold text-white">
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

            {config.showZonesSection && (
              <section className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--brand-accent-ink)' }}>
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
                  <div className="relative aspect-16/9 max-h-[380px] w-full overflow-hidden rounded-xl bg-[#EEF3F0]">
                    <ResilientImage
                      src={ILLUSTRATION_READING_ADVENTURE_URL}
                      fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                      alt="Peta ilustrasi enam zona petualangan belajar Rumah Baca Almahyra"
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs font-medium text-white/85">Peta Visual Ekosistem Belajar</p>
                      <p className="font-display text-lg font-bold">
                        Imajinasi · Pengetahuan · Kreativitas · Eksplorasi · Sahabat Bumi · Panggung Cerita
                      </p>
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
                    className="inline-flex items-center gap-2 self-start rounded-xl bg-[#087C3B] px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                  >
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Masuk Portal Pengelola
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

        {audienceMode === 'telaga' && activePage === 'telaga-katalog' && (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10 space-y-12">
            <div className="flex flex-col gap-4 border-b border-[#E2E8E5] pb-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-2">
                <p className="text-xs font-bold" style={{ color: 'var(--brand-accent-ink)' }}>
                  Sahabat TELAGA · Katalog &amp; Layanan Pinjaman
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
                onClick={() => onChangePage('telaga-program')}
                className="self-start rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-bold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
              >
                Kembali ke Program TELAGA &amp; Jadwal
              </button>
            </div>

            <CollectionZoneInfographic
              books={books}
              schedules={schedules}
              config={config}
            />

            {renderCatalogSection()}

            <BorrowDonationPanel db={db} defaultTab="borrow" />
          </div>
        )}
      </div>

      {/* CURVED WAVE GREEN FOOTER (MATCHING MOCKUP) */}
      <footer className="mt-10 relative text-white preserve-light">
        <div className="overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 48"
            preserveAspectRatio="none"
            className="block h-7 w-full sm:h-10"
            aria-hidden="true"
          >
            <path
              d="M0 32 Q 360 -8 720 22 T 1440 16 L 1440 48 L 0 48 Z"
              fill="#087C3B"
            />
          </svg>
        </div>

        <div className="bg-gradient-to-b from-[#087C3B] to-[#06522C] pb-7 pt-2">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3.5">
              <ResilientImage
                src={config.logoUrl}
                fallbackSrc={DEFAULT_LOGO_URL}
                alt={config.appName}
                className="h-12 w-12 rounded-2xl border-2 border-[#FFC51B] object-cover bg-white shrink-0 shadow-md"
              />
              <div>
                <p className="font-display text-lg font-extrabold">{config.appName}</p>
                <p className="text-xs text-white/90">
                  Bersama Menumbuhkan Generasi Literat
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/95">
              <button
                type="button"
                onClick={() => onChangePage('keluarga', 'tentang-kami')}
                className="inline-flex items-center gap-1.5 hover:text-[#FFC51B]"
              >
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                Tentang Kami
              </button>
              <button
                type="button"
                onClick={() => onChangePage('keluarga', 'jadwal-grontol')}
                className="inline-flex items-center gap-1.5 hover:text-[#FFC51B]"
              >
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Agenda Kegiatan
              </button>
              <button
                type="button"
                onClick={() => handleOpenVideos('all')}
                className="inline-flex items-center gap-1.5 hover:text-[#FFC51B]"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Video Edukasi
              </button>
              <button
                type="button"
                onClick={() => onChangePage('keluarga', 'formulir-pinjam-donasi')}
                className="inline-flex items-center gap-1.5 hover:text-[#FFC51B]"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Kontak
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 self-start rounded-full border-2 border-[#FFF3B0] bg-gradient-to-b from-[#FFD633] to-[#F4A615] px-5 py-2.5 text-xs font-extrabold text-[#10281B] shadow-md hover:opacity-95 whitespace-nowrap shrink-0 lg:self-auto"
            >
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              Ayo bergabung menjadi keluarga Almahyra!
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>

      <DigitalCertificateModal
        open={certModalOpen}
        recipientName={featuredMember.nama}
        memberCode={featuredMember.nomorInduk}
        points={featuredMember.poin}
        stampsCount={localPassport.stamps.length}
        badges={featuredMember.lencana}
        config={config}
        onClose={() => setCertModalOpen(false)}
      />
    </main>
  );
}
