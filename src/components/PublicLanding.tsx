import { useMemo, useState } from 'react';
import {
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
  MessageCircle,
  MessageSquareQuote,
  Phone,
  PlayCircle,
  Rocket,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
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
  buildWhatsAppShareHref,
  computeBookShelves,
  computeLibraryStats,
  DEFAULT_CATEGORIES,
  DEFAULT_MANAGER_WHATSAPP_DISPLAY,
  DEFAULT_READER_LEVELS,
  filterBooksAdvanced,
  SAHABAT_GALLERY_PHOTOS,
  type CreateTestimonialInput,
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
import { PWAInstallButton } from './PWAInstallButton';
import { ResilientImage } from './ResilientImage';
import { TestimonialsSection } from './TestimonialsSection';
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
  onSubmitTestimonial: (
    payload: CreateTestimonialInput,
  ) => Promise<{ ok: boolean; message: string }>;
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
  onSubmitTestimonial,
}: PublicLandingProps) {
  const { config, books, schedules, members } = db;
  const stats = useMemo(() => computeLibraryStats(db), [db]);
  const managerPhoneDisplay =
    config.whatsappNumber?.trim() || DEFAULT_MANAGER_WHATSAPP_DISPLAY;
  const managerDirectWaHref = useMemo(
    () =>
      buildWhatsAppShareHref(
        'Halo Pengelola Rumah Baca Almahyra, saya ingin bertanya tentang kegiatan dan layanan literasi di Dusun Grontol.',
        managerPhoneDisplay,
      ),
    [managerPhoneDisplay],
  );

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
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
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

  const heroSlides = useMemo(
    () => [
      {
        id: 'slide-1',
        titleLine1: 'Halo, Sahabat',
        titleLine2: 'Petualang!',
        ribbon: 'Baca, Berkarya, Bertualang, Raih Prestasi!',
        subtitle:
          'Mari jelajahi dunia literasi yang menyenangkan bersama keluarga di Dusun Grontol.',
        primaryLabel: 'Mulai Petualangan',
        primaryAction: () => onChangePage('petualangan'),
        secondaryLabel: 'Jelajahi Buku',
        secondaryAction: () => onChangePage('jelajahi-buku'),
        photoSrc: resolvedHeroPhoto,
        photoAlt: 'Suasana ceria Rumah Baca Almahyra',
        isSquareLogo: false,
      },
      {
        id: 'slide-2',
        titleLine1: 'Kumpulkan Bintang',
        titleLine2: 'E-Paspor Baca!',
        ribbon: 'Selesaikan Bacaan, Jawab Kuis, Raih Lencana!',
        subtitle:
          'Setiap cerita yang kamu baca dan kuis yang kamu jawab menambah bintang serta piagam digitalmu.',
        primaryLabel: 'Buka E-Paspor & Kuis',
        primaryAction: () => onChangePage('prestasi'),
        secondaryLabel: `Baca Cepat: ${dailyFeaturedBook?.judul ?? 'Enggang yang Istimewa'}`,
        secondaryAction: () => {
          if (dailyFeaturedBook) onReadBook(dailyFeaturedBook);
          else onChangePage('jelajahi-buku');
        },
        photoSrc: '/assets/aistudio/WhatsApp_Image_2026-11-16_at_10.49.14__2__1caa94d4.jpeg',
        photoAlt: 'Kegiatan membaca bersama Rumah Baca Almahyra',
        isSquareLogo: false,
      },
      {
        id: 'slide-3',
        titleLine1: 'Tonton Video',
        titleLine2: 'Edukasi 6 Zona!',
        ribbon: '10 Kanal Edukasi Terbaik Berbahasa Indonesia',
        subtitle:
          'Belajar sains, sejarah, dongeng Nusantara, dan budi pekerti melalui pilihan video aman untuk anak.',
        primaryLabel: 'Buka Video Edukasi',
        primaryAction: () => handleOpenVideos('all'),
        secondaryLabel: 'Dunia Keluarga & Jadwal',
        secondaryAction: () => onChangePage('keluarga'),
        photoSrc: DEFAULT_LOGO_URL,
        photoAlt: 'Logo Resmi Rumah Baca Almahyra',
        isSquareLogo: true,
      },
    ],
    [dailyFeaturedBook, onChangePage, onReadBook, resolvedHeroPhoto],
  );

  const activeSlide = heroSlides[heroSlideIdx] ?? heroSlides[0];

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
      {/* ================================================================ */}
      {/* PAGE 1: BERANDA (PERSIS KONSEP STORYBOOK RUMAH BACA ALMAHYRA)    */}
      {/* ================================================================ */}
      {activePage === 'beranda' && (
        <div className="space-y-8 pb-8">
          {/* Vibrant Sky-to-Meadow Hero Carousel Banner */}
          <section
            aria-label="Banner Utama Rumah Baca Almahyra"
            className="relative overflow-hidden bg-gradient-to-b from-[#34B6FF] via-[#70D4FF] to-[#34A853] px-4 py-8 sm:px-6 lg:px-8"
          >
            {/* Animated Drifting Storybook Clouds */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-3 flex justify-between px-8 opacity-45"
            >
              <svg
                viewBox="0 0 160 54"
                className="h-10 w-28 sm:h-12 sm:w-36 text-white animate-hero-cloud"
              >
                <path
                  fill="currentColor"
                  d="M28 46h98a18 18 0 0 0 3-35.7A26 26 0 0 0 79 4a24 24 0 0 0-43 13A15 15 0 0 0 28 46Z"
                />
              </svg>
              <svg
                viewBox="0 0 160 54"
                className="hidden sm:block h-9 w-32 text-white animate-hero-cloud-slow"
              >
                <path
                  fill="currentColor"
                  d="M28 46h98a18 18 0 0 0 3-35.7A26 26 0 0 0 79 4a24 24 0 0 0-43 13A15 15 0 0 0 28 46Z"
                />
              </svg>
            </div>

            {/* Soft Decorative Meadow Hills */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1440 160"
              preserveAspectRatio="none"
              className="pointer-events-none absolute bottom-0 left-0 h-24 w-full text-[#2A9848]/45 sm:h-32"
            >
              <path
                fill="currentColor"
                d="M0,96 C260,150 520,25 780,82 C1040,138 1260,48 1440,86 L1440,160 L0,160 Z"
              />
            </svg>

            <div className="relative mx-auto max-w-7xl">
              {/* Left & Right Carousel Buttons */}
              <button
                type="button"
                onClick={() =>
                  setHeroSlideIdx((prev) => (prev + heroSlides.length - 1) % heroSlides.length)
                }
                aria-label="Slide sebelumnya"
                className="absolute left-0 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#087C3B] shadow-md transition-transform hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setHeroSlideIdx((prev) => (prev + 1) % heroSlides.length)}
                aria-label="Slide berikutnya"
                className="absolute right-0 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#087C3B] shadow-md transition-transform hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="grid grid-cols-1 items-center gap-6 px-10 sm:px-14 lg:grid-cols-12">
                {/* Left Copy & CTAs */}
                <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                  <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_3px_0_rgba(8,90,42,0.55)]">
                    <span className="block">{activeSlide.titleLine1}</span>
                    <span className="block">{activeSlide.titleLine2}</span>
                  </h1>

                  <div className="inline-block rounded-full border-2 border-[#FFF3B0] bg-[#FFC51B] px-5 py-1.5 text-xs sm:text-sm font-extrabold text-[#10281B] shadow-sm">
                    {activeSlide.ribbon}
                  </div>

                  <p className="mx-auto max-w-xl text-sm sm:text-base font-bold text-[#09321C] lg:mx-0">
                    {activeSlide.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                    <button
                      type="button"
                      onClick={activeSlide.primaryAction}
                      className="inline-flex min-h-[46px] items-center gap-2 rounded-full border-2 border-[#7ED321] bg-[#087C3B] px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition-transform hover:scale-105 hover:bg-[#06612D]"
                    >
                      <Rocket className="h-4 w-4 text-[#FFC51B]" aria-hidden="true" />
                      <span>{activeSlide.primaryLabel}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={activeSlide.secondaryAction}
                      className="inline-flex min-h-[46px] items-center gap-2 rounded-full border-2 border-[#FFF3B0] bg-[#FFC51B] px-6 py-2.5 text-sm font-extrabold text-[#10281B] shadow-md transition-transform hover:scale-105"
                    >
                      <BookOpen className="h-4 w-4 text-[#087C3B]" aria-hidden="true" />
                      <span>{activeSlide.secondaryLabel}</span>
                    </button>
                  </div>
                </div>

                {/* Right Frameless Blended Almahyra Mascot + Motion Graphics */}
                <div className="lg:col-span-5 flex justify-center">
                  <div
                    data-testid="hero-mascot-motion"
                    className="relative flex flex-col items-center justify-center py-3 px-6"
                  >
                    {/* Slowly Rotating Soft Golden Sunburst Rays */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 260 260"
                      className="pointer-events-none absolute inset-0 m-auto h-72 w-72 sm:h-80 sm:w-80 text-[#FFF4B8]/40 animate-hero-rays"
                    >
                      <g fill="currentColor">
                        <polygon points="130,4 142,118 118,118" />
                        <polygon points="130,256 142,142 118,142" />
                        <polygon points="4,130 118,118 118,142" />
                        <polygon points="256,130 142,118 142,142" />
                        <polygon points="40,40 124,112 112,124" />
                        <polygon points="220,220 148,136 136,148" />
                        <polygon points="220,40 148,124 136,112" />
                        <polygon points="40,220 124,148 112,136" />
                      </g>
                    </svg>

                    {/* Soft Radiant Sky-Gold Ambient Halo (blends edges seamlessly with background) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 m-auto h-64 w-64 sm:h-76 sm:w-76 rounded-full bg-radial from-[#FFF7C2]/80 via-[#B9F2FF]/40 to-transparent blur-2xl animate-hero-halo"
                    />

                    {/* Motion Graphics Floating Accents */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 32 32"
                      className="pointer-events-none absolute -top-1 right-4 h-7 w-7 text-[#FFE45E] drop-shadow-[0_2px_6px_rgba(255,197,27,0.8)] animate-hero-sparkle"
                    >
                      <path
                        fill="currentColor"
                        d="M16 1l3.6 10.4L30 15l-10.4 3.6L16 29l-3.6-10.4L2 15l10.4-3.6L16 1Z"
                      />
                    </svg>

                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="pointer-events-none absolute top-9 left-0 h-5 w-5 text-white drop-shadow-[0_2px_6px_rgba(255,255,255,0.85)] animate-hero-sparkle-delayed"
                    >
                      <path
                        fill="currentColor"
                        d="M12 1l2.5 7.5L22 11l-7.5 2.5L12 21l-2.5-7.5L2 11l7.5-2.5L12 1Z"
                      />
                    </svg>

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-12 -left-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#087C3B] shadow-md animate-hero-orbit"
                    >
                      <BookOpen className="h-4 w-4" />
                    </div>

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-16 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC51B] text-[#087C3B] shadow-md animate-hero-orbit-reverse"
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </div>

                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-10 left-8 h-2.5 w-2.5 rounded-full bg-[#FFF3B0] shadow-[0_0_10px_#FFF3B0] animate-hero-mote"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-14 right-8 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_#FFFFFF] animate-hero-mote-delayed"
                    />

                    {/* Frameless Floating Almahyra App Mascot Illustration */}
                    <div className="relative z-10 animate-hero-float">
                      <div className="relative h-[255px] w-[255px] sm:h-[305px] sm:w-[305px] overflow-hidden rounded-[24%] drop-shadow-[0_18px_28px_rgba(6,82,40,0.3)]">
                        <ResilientImage
                          src="/assets/aistudio/Logo_Aplikasi_Almahyra_036c9e38.png"
                          fallbackSrc={DEFAULT_LOGO_URL}
                          alt="Ikon Aplikasi Rumah Baca Almahyra — Baca, Berkarya, Bertualang, Raih Prestasi"
                          loading="eager"
                          fetchPriority="high"
                          className="h-full w-full object-contain"
                        />
                        {/* Diagonal Sunlight Motion Sheen */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-hero-sheen"
                        />
                      </div>
                    </div>

                    {/* Soft Breathing Ground Shadow */}
                    <div
                      aria-hidden="true"
                      className="mt-1.5 h-3.5 w-40 sm:w-48 rounded-full bg-[#064D25]/35 blur-md animate-hero-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Carousel Pagination Dots */}
              <div
                className="mt-5 flex items-center justify-center gap-2"
                role="tablist"
                aria-label="Pilih slide banner utama"
              >
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={heroSlideIdx === idx}
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setHeroSlideIdx(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      heroSlideIdx === idx
                        ? 'w-7 bg-[#087C3B] ring-2 ring-white'
                        : 'w-2.5 bg-white/80 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 4 Colorful Pillars + 3 Green-Header Showcase Cards */}
          <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
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

            {/* Momen Hangat Sahabat Cilik Teras Almahyra (3 Foto Anak) */}
            <section
              aria-label="Momen Hangat Sahabat Cilik Teras Almahyra"
              className="rounded-3xl border-2 border-[#DCE8DF] bg-white p-5 sm:p-6 shadow-sm space-y-4 dark:border-[#203D30] dark:bg-[#10211A]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base sm:text-lg font-extrabold text-[#10281B] dark:text-[#EDF5F0] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F58220] shrink-0" aria-hidden="true" />
                  Momen Hangat Sahabat Cilik Teras Almahyra
                </h2>
                <span className="text-xs font-medium text-[#4A5D54] dark:text-[#A2BCB0]">
                  Dusun Grontol, Desa Tlogosari
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {SAHABAT_GALLERY_PHOTOS.map((photo) => (
                  <figure
                    key={photo.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8E5] bg-[#F8FAF9] dark:border-[#203D30] dark:bg-[#0D1C15]"
                  >
                    <div className="flex h-[320px] sm:h-[300px] lg:h-[360px] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#FFFDF6] to-[#EAF5EE] p-2 dark:from-[#132920] dark:to-[#0D1C15]">
                      <ResilientImage
                        src={photo.src}
                        fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                        alt={photo.name}
                        className="h-full w-full rounded-xl object-contain"
                      />
                    </div>
                    <figcaption className="p-3.5 space-y-1">
                      <p className="font-display text-sm font-bold text-[#111C17] dark:text-[#EDF5F0]">
                        {photo.name}
                      </p>
                      <p className="text-xs text-[#4A5D54] dark:text-[#A2BCB0] leading-relaxed">
                        {photo.caption}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DEDICATED SUB-PAGES (BUKU, PETUALANGAN, VIDEO, KELUARGA, PRESTASI, TELAGA) */}
      {/* ================================================================ */}
      {activePage !== 'beranda' && (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
          {(activePage === 'jelajahi-buku' || activePage === 'telaga-katalog') && (
            <div className="space-y-10">
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

          {activePage === 'petualangan' && (
            <div className="space-y-10">
              <section
                id="misi-hari-ini"
                aria-label="Misi Literasi Hari Ini"
                className="rounded-3xl border-2 border-[#DCE8DF] bg-white p-6 space-y-4 dark:border-[#203D30] dark:bg-[#10211A]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-[#087C3B] dark:text-[#6EE7B7]" aria-hidden="true" />
                    <h1 className="font-display text-2xl font-bold text-[#10281B] dark:text-[#EDF5F0]">
                      Misi Literasi Hari Ini
                    </h1>
                  </div>
                  <span className="rounded-full bg-[#FFF2CC] px-3 py-1 font-mono-tabular text-xs font-extrabold text-[#9A5B08]">
                    +10 Poin &amp; Stempel Harian
                  </span>
                </div>

                <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-8 space-y-3">
                    <p className="text-sm text-[#4A5D54] dark:text-[#A2BCB0] leading-relaxed">
                      Pilih salah satu buku bergambar, aktifkan fitur Bacakan Cerita bila suka, lalu klaim stempel baca dan tantangan{' '}
                      <strong className="text-[#10281B] dark:text-[#EDF5F0]">Pahlawan Alam Grontol</strong>.
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#4A5D54]">
                        <span>Progres Misi Hari Ini</span>
                        <span className="font-mono-tabular font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                          {dailyMissionDone ? '1 / 1 Selesai' : '0 / 1 Siap Dikerjakan'}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#087C3B] to-[#7ED321] transition-all duration-300"
                          style={{ width: dailyMissionDone ? '100%' : '25%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-2.5">
                    {dailyFeaturedBook && (
                      <button
                        type="button"
                        onClick={() => onReadBook(dailyFeaturedBook)}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#087C3B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#06612D]"
                      >
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        Kerjakan Misi: Baca Cerita
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onChangePage('prestasi')}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFC51B] px-5 py-2.5 text-xs font-extrabold text-[#10281B] hover:opacity-95"
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
                onJumpToTelaga={() => onChangePage('telaga-program')}
              />
            </div>
          )}

          {activePage === 'video-edukasi' && (
            <div className="space-y-10">
              <EducationalVideosSection
                initialZoneId={selectedVideoZoneId}
                initialVideoId={selectedVideoId}
              />

              <LeaderboardAndStoryStudio db={db} onOpenLogin={onOpenLogin} />
            </div>
          )}

          {activePage === 'keluarga' && (
            <div className="space-y-10">
              {/* Tentang Kami & E-Paspor */}
              <section
                id="tentang-kami"
                aria-label="Mengenal Rumah Baca Almahyra"
                className="scroll-mt-20 grid grid-cols-1 items-center gap-6 lg:grid-cols-12"
              >
                <div className="lg:col-span-7 rounded-3xl border border-[#DCE4DF] bg-white p-6 space-y-5 dark:border-[#203D30] dark:bg-[#10211A]">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                      Tentang Rumah Baca Almahyra · {config.slogan}
                    </p>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#10281B] dark:text-[#EDF5F0]">
                      {config.heroTitle}
                    </h1>
                    <p className="text-sm leading-relaxed text-[#4A5D54] dark:text-[#A2BCB0]">
                      Berpusat di {config.location} bersama koordinator{' '}
                      <strong className="text-[#10281B] dark:text-[#EDF5F0]">{config.coordinator}</strong>. {config.heroSubtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={managerDirectWaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087C3B] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#06612D] whitespace-nowrap"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      WA Pengelola: {managerPhoneDisplay}
                    </a>
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#DCE4DF] bg-[#FFF8E8] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#10281B] hover:bg-[#FFF0CC] whitespace-nowrap"
                    >
                      <Users className="h-4 w-4 text-[#087C3B]" aria-hidden="true" />
                      Masuk Portal Anggota
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#EEF3F0] pt-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold text-[#4A5D54]">Judul Aktif</p>
                      <p className="font-display text-2xl font-bold tabular-nums text-[#087C3B] dark:text-[#6EE7B7]">
                        {stats.totalTitles}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#4A5D54]">Eksemplar</p>
                      <p className="font-display text-2xl font-bold tabular-nums text-[#10281B]">
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
              </section>

              <BorrowDonationPanel db={db} defaultTab="borrow" />

              {renderScheduleSection()}

              <FamilyLiteracySection
                db={db}
                onOpenLogin={onOpenLogin}
                onReadBook={onReadBook}
              />

              <div id="testimoni-warga" className="scroll-mt-20">
                <TestimonialsSection
                  testimonials={db.testimonials ?? []}
                  onSubmitTestimonial={onSubmitTestimonial}
                />
              </div>
            </div>
          )}

          {activePage === 'prestasi' && (
            <div className="space-y-10">
              <PassportAndQuizHub
                db={db}
                passport={localPassport}
                onUpdatePassport={onUpdateLocalPassport}
                onOpenCatalog={() => onChangePage('jelajahi-buku')}
                onOpenLogin={onOpenLogin}
              />

              <PassportFlowInfographic config={config} />

              {config.showLevelsSection && (
                <div className="rounded-3xl border border-[#DCE4DF] bg-white p-6 space-y-6 dark:border-[#203D30] dark:bg-[#10211A]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#F58220]">
                        Jenjang Capaian · Apresiasi Tanpa Tekanan
                      </p>
                      <h2 className="font-display text-2xl font-bold text-[#10281B] dark:text-[#EDF5F0]">
                        Jenjang Capaian &amp; Sertifikat Digital
                      </h2>
                      <p className="mt-1 text-sm text-[#4A5D54] dark:text-[#A2BCB0]">
                        Setiap buku, kuis, dan aksi nyata dihargai dengan bintang literasi, lencana, dan piagam digital keluarga.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCertModalOpen(true)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#FFC51B] px-4 py-2.5 text-xs font-extrabold text-[#10281B] hover:opacity-95 whitespace-nowrap shrink-0"
                    >
                      <Award className="h-4 w-4" aria-hidden="true" />
                      Pratinjau Sertifikat Digital
                    </button>
                  </div>

                  <LevelProgressionInfographic config={config} />
                </div>
              )}

              <div className="rounded-3xl border border-[#DCE4DF] bg-[#E6F7ED] p-6 sm:p-8 dark:border-[#244536] dark:bg-[#132920]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl space-y-1.5">
                    <p className="text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                      Akun Anggota Rumah Baca Almahyra
                    </p>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#10281B] dark:text-[#EDF5F0]">
                      Ingin menyimpan progres baca dan jurnal anak?
                    </h2>
                    <p className="text-sm text-[#4A5D54] dark:text-[#A2BCB0]">
                      Masuk menggunakan Nomor Induk Anggota (mis. <strong>ALMA-001</strong>) untuk membuka Dasbor Anak, Dasbor Orang Tua, dan unduh sertifikat resmi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-full bg-[#087C3B] px-6 py-2.5 text-sm font-extrabold text-white hover:bg-[#06612D] shrink-0"
                  >
                    Masuk Sekarang
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePage === 'telaga-program' && (
            <div className="space-y-10">
              {config.showTelagaSection && (
                <section id="bagian-telaga" className="scroll-mt-20 space-y-6">
                  <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8 lg:grid-cols-12 dark:border-[#203D30] dark:bg-[#10211A]">
                    <div className="lg:col-span-7 space-y-2.5">
                      <p className="text-xs font-bold tracking-wide text-[#F58220]">
                        Program Komunitas TELAGA &amp; Gotong Royong Desa
                      </p>
                      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#10281B] dark:text-[#EDF5F0]">
                        {config.page1IntroTitle}
                      </h1>
                      <p className="text-sm leading-relaxed text-[#4A5D54] dark:text-[#A2BCB0]">
                        {config.page1IntroBody}
                      </p>
                    </div>
                    <div className="lg:col-span-5 flex justify-center">
                      <div className="w-full max-w-[300px] overflow-hidden rounded-2xl border border-[#DCE4DF] bg-[#FFF8E8] p-2">
                        <div className="flex h-[320px] sm:h-[350px] w-full items-center justify-center overflow-hidden rounded-xl">
                          <ResilientImage
                            src={ILLUSTRATION_TELAGA_COMMUNITY_URL}
                            fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                            alt="Ilustrasi Komunitas TELAGA Rumah Baca Almahyra"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {TELAGA_PILLARS.map((pillar) => (
                      <article
                        key={pillar.code}
                        className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-2.5 dark:border-[#203D30] dark:bg-[#10211A]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono-tabular text-xs font-semibold text-[#4A5D54]">
                            {pillar.code}. Pilar {pillar.letter}
                          </span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F7ED] font-display text-sm font-bold text-[#087C3B] dark:bg-[#163829] dark:text-[#6EE7B7]">
                            {pillar.letter}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-[#10281B] dark:text-[#EDF5F0]">
                          {pillar.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-[#4A5D54] dark:text-[#A2BCB0]">
                          {pillar.desc}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {config.showZonesSection && (
                <section className="space-y-5">
                  <div>
                    <p className="text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                      Almahyra Reading Adventure
                    </p>
                    <h2 className="font-display text-2xl font-bold text-[#10281B] dark:text-[#EDF5F0]">
                      Peta Enam Zona Petualangan Belajar
                    </h2>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#E2E8E5] bg-white p-3 space-y-3 dark:border-[#203D30] dark:bg-[#10211A]">
                    <div className="flex h-[320px] sm:h-[360px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#FFF8E8] p-2">
                      <ResilientImage
                        src={ILLUSTRATION_READING_ADVENTURE_URL}
                        fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                        alt="Peta ilustrasi enam zona petualangan belajar Rumah Baca Almahyra"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="rounded-xl bg-[#E6F7ED] px-4 py-3 text-[#10281B] dark:bg-[#152B22] dark:text-[#EDF5F0]">
                      <p className="text-xs font-semibold text-[#087C3B] dark:text-[#6EE7B7]">
                        Ekosistem Belajar Tanpa Tekanan
                      </p>
                      <p className="font-display text-sm sm:text-base font-bold">
                        Imajinasi · Pengetahuan · Kreativitas · Eksplorasi · Sahabat Bumi · Panggung Cerita
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ADVENTURE_ZONES.map((z, idx) => (
                      <div
                        key={z.zone}
                        className="rounded-2xl border border-[#E2E8E5] bg-white p-5 dark:border-[#203D30] dark:bg-[#10211A]"
                      >
                        <div className="flex items-center gap-2 text-xs font-medium text-[#4A5D54]">
                          <span className="font-mono-tabular">0{idx + 1}</span>
                          <span aria-hidden="true">·</span>
                          <span>{z.focus}</span>
                        </div>
                        <h3 className="mt-2 font-display text-base font-bold text-[#10281B] dark:text-[#EDF5F0]">
                          {z.zone}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#4A5D54] dark:text-[#A2BCB0] leading-relaxed">
                          {z.activity}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {config.showInnovationsSection && (
                <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-5 dark:border-[#203D30] dark:bg-[#10211A]">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#10281B] dark:text-[#EDF5F0]">
                      Inovasi Pendukung Komunitas
                    </h2>
                    <p className="mt-1 text-sm text-[#4A5D54] dark:text-[#A2BCB0]">
                      Gerakan literasi kolaboratif bersama orang tua, pemuda, relawan, dan warga desa.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
                    {INNOVATIONS.map((item) => (
                      <div key={item.num} className="space-y-1.5 border-t border-[#EEF3F0] pt-3.5">
                        <span className="font-mono-tabular text-xs font-semibold text-[#087C3B] dark:text-[#6EE7B7]">
                          {item.num}
                        </span>
                        <h3 className="font-display text-base font-bold text-[#10281B] dark:text-[#EDF5F0]">
                          {item.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-[#4A5D54] dark:text-[#A2BCB0]">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {renderScheduleSection()}
            </div>
          )}
        </div>
      )}

      {/* SIGNATURE LUSH GREEN WAVE FOOTER */}
      <footer className="relative mt-8 bg-[#086E34] text-white">
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 48"
          preserveAspectRatio="none"
          className="block -mt-6 h-8 w-full text-[#086E34]"
        >
          <path
            fill="currentColor"
            d="M0,32 C320,-8 720,48 1120,14 C1260,2 1360,12 1440,22 L1440,48 L0,48 Z"
          />
        </svg>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <ResilientImage
              src={config.logoUrl}
              fallbackSrc={DEFAULT_LOGO_URL}
              alt={config.appName}
              className="h-12 w-12 object-contain shrink-0 drop-shadow-sm"
            />
            <div>
              <p className="font-display text-lg font-extrabold text-white">
                {config.appName}
              </p>
              <p className="text-xs font-medium text-[#D6F5E3]">
                Bersama Menumbuhkan Generasi Literat · Dusun Grontol
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-[#E6F9EE]">
            <button
              type="button"
              onClick={() => onChangePage('keluarga', 'tentang-kami')}
              className="inline-flex items-center gap-1.5 hover:text-[#FFC51B]"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
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
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Video Edukasi
            </button>
            <button
              type="button"
              onClick={() => onChangePage('keluarga', 'testimoni-warga')}
              className="inline-flex items-center gap-1.5 hover:text-[#FFC51B]"
            >
              <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden="true" />
              Testimoni
            </button>
            <a
              href={managerDirectWaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#FFF2B2] hover:text-white"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Kontak: {managerPhoneDisplay}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFF3B0] bg-[#FFC51B] px-5 py-2.5 text-xs font-extrabold text-[#10281B] shadow-md transition-transform hover:scale-105 whitespace-nowrap"
            >
              <Star className="h-4 w-4 fill-current text-[#087C3B]" aria-hidden="true" />
              <span>Ayo bergabung menjadi keluarga Almahyra!</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
