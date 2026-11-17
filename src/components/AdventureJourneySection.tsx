import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  HeartHandshake,
  HelpCircle,
  Library,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react';
import { DEFAULT_HERO_IMAGE_URL } from '../data/defaultDb';
import type { AlmahyraDatabase, Book } from '../types/almahyra';
import {
  ADVENTURE_JOURNEY_STEPS,
  buildSahabatInvitationText,
  calculateLevelInfo,
  computeJourneyStepStatuses,
  DEFAULT_CATEGORIES,
  DEFAULT_READER_LEVELS,
  filterBooksAdvanced,
  SAHABAT_GALLERY_PHOTOS,
} from '../utils/almahyra';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { ResilientImage } from './ResilientImage';

interface AdventureJourneySectionProps {
  db: AlmahyraDatabase;
  viewerKey: string;
  activeStep: number;
  onChangeStep: (step: number) => void;
  onReadBook: (book: Book) => void;
  onOpenCatalog: () => void;
  onOpenLogin: () => void;
  onJumpToTelaga: () => void;
}

export function AdventureJourneySection({
  db,
  viewerKey,
  activeStep,
  onChangeStep,
  onReadBook,
  onOpenCatalog,
  onOpenLogin,
  onJumpToTelaga,
}: AdventureJourneySectionProps) {
  const activeStepDef =
    ADVENTURE_JOURNEY_STEPS.find((s) => s.stepNumber === activeStep) ??
    ADVENTURE_JOURNEY_STEPS[0];

  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(activeStepDef.photoIndex);
  const [forestCategory, setForestCategory] = useState<string>('Semua');
  const [forestLevel, setForestLevel] = useState<string>('Semua');
  const [selectedStoryBookId, setSelectedStoryBookId] = useState<string>(
    db.books[0]?.id ?? 'alm-001',
  );
  const [friendSenderName, setFriendSenderName] = useState<string>('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const stepStatuses = useMemo(
    () => computeJourneyStepStatuses(db, viewerKey),
    [db, viewerKey],
  );

  const activePhoto =
    SAHABAT_GALLERY_PHOTOS[selectedPhotoIdx] ?? SAHABAT_GALLERY_PHOTOS[0];

  const activeBooks = useMemo(
    () => db.books.filter((b) => b.aktif !== false),
    [db.books],
  );

  const forestBooks = useMemo(
    () =>
      filterBooksAdvanced(activeBooks, {
        category: forestCategory,
        readerLevel: forestLevel,
        onlyActive: true,
      }).slice(0, 4),
    [activeBooks, forestCategory, forestLevel],
  );

  const spotlightBook = useMemo(
    () => activeBooks.find((b) => b.id === selectedStoryBookId) ?? activeBooks[0],
    [activeBooks, selectedStoryBookId],
  );

  const viewerProgressList = useMemo(
    () => (db.readingProgress ?? []).filter((p) => p.viewerKey === viewerKey),
    [db.readingProgress, viewerKey],
  );

  const completedBooksCount = useMemo(
    () => viewerProgressList.filter((p) => p.completedCount > 0).length,
    [viewerProgressList],
  );

  const activeMember = useMemo(
    () =>
      db.members.find(
        (m) => m.nomorInduk.toLowerCase() === viewerKey.toLowerCase(),
      ) ?? null,
    [db.members, viewerKey],
  );

  const displayPoints = activeMember
    ? activeMember.poin
    : completedBooksCount * 5;
  const levelInfo = calculateLevelInfo(displayPoints);

  const invitationText = useMemo(
    () =>
      buildSahabatInvitationText({
        senderName: friendSenderName || activeMember?.nama,
        appName: db.config.appName,
        booksReadCount: completedBooksCount,
        favoriteBookTitle: spotlightBook?.judul,
      }),
    [activeMember?.nama, completedBooksCount, db.config.appName, friendSenderName, spotlightBook?.judul],
  );

  const handleSelectStep = (stepNum: number) => {
    const found = ADVENTURE_JOURNEY_STEPS.find((s) => s.stepNumber === stepNum);
    onChangeStep(stepNum);
    if (found) {
      setSelectedPhotoIdx(found.photoIndex);
    }
  };

  const handleCopyInvitation = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(invitationText);
      }
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2600);
    } catch {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2600);
    }
  };

  const categories = useMemo(() => {
    const base =
      db.categories && db.categories.length > 0 ? db.categories : [...DEFAULT_CATEGORIES];
    return ['Semua', ...base.slice(0, 6)];
  }, [db.categories]);

  const readerLevels = useMemo(() => {
    const base =
      db.readerLevels && db.readerLevels.length > 0
        ? db.readerLevels
        : [...DEFAULT_READER_LEVELS];
    return ['Semua', ...base];
  }, [db.readerLevels]);

  return (
    <section
      id="petualangan-almahyra"
      aria-label="Peta Petualangan Almahyra 7 Tahap"
      className="scroll-mt-20 rounded-2xl border border-[#E2E8E5] bg-white p-5 sm:p-7 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#EEF3F0] pb-4">
        <div className="space-y-1">
          <p
            className="text-xs font-semibold tracking-wide flex items-center gap-1.5"
            style={{ color: 'var(--brand-accent-ink)' }}
          >
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Alur Pengalaman Pengunjung · 7 Langkah Interaktif
          </p>
          <h2
            className="font-display text-2xl font-bold tracking-tight text-[#111C17]"
            style={{ textWrap: 'balance' }}
          >
            Petualangan Almahyra: Dari Pintu Masuk ke Sahabat Literasi
          </h2>
        </div>
        <span className="font-mono-tabular text-xs font-semibold text-[#4A5D54] whitespace-nowrap shrink-0">
          Tahap {activeStepDef.stepNumber} dari 7
        </span>
      </div>

      {/* 7-Step Path Selector */}
      <div
        role="tablist"
        aria-label="Pilih tahap petualangan Almahyra"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
      >
        {ADVENTURE_JOURNEY_STEPS.map((step) => {
          const isCurrent = step.stepNumber === activeStepDef.stepNumber;
          const isDone = stepStatuses[step.id];
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => handleSelectStep(step.stepNumber)}
              style={isCurrent ? { backgroundColor: db.config.primaryColor } : undefined}
              className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-colors ${
                isCurrent
                  ? 'border-transparent text-white shadow-xs'
                  : 'border-[#DCE4DF] bg-[#F8FAF9] text-[#111C17] hover:bg-[#F2F6F4]'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <span
                  className={`font-mono-tabular text-[11px] font-bold ${
                    isCurrent ? 'text-white/90' : 'text-[#4A5D54]'
                  }`}
                >
                  0{step.stepNumber}
                </span>
                {isDone && (
                  <CheckCircle2
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isCurrent ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="font-display text-xs font-bold leading-snug line-clamp-2">
                {step.shortTitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Two-Zone Interactive Stage + Sahabat Photo Showcase */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left/Main Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#E7EEEA] bg-[#F8FAF9] p-5 sm:p-6 space-y-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span style={{ color: 'var(--brand-primary-ink)' }}>
                Tahap {activeStepDef.stepNumber}
              </span>
              <span className="text-[#4A5D54]" aria-hidden="true">
                ·
              </span>
              <span className="text-[#4A5D54]">Alur Petualangan Almahyra</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#111C17]">
              {activeStepDef.stepNumber}. {activeStepDef.title}
            </h3>
            <p className="text-sm leading-relaxed text-[#4A5D54]">
              {activeStepDef.description}
            </p>
          </div>

          {/* Step-Specific Interactive Experience */}
          {activeStepDef.stepNumber === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#DCE4DF] bg-white p-4 space-y-2">
                <p className="font-display text-sm font-bold text-[#111C17]">
                  Sapaan Hangat dari Teras Almahyra
                </p>
                <p className="text-xs leading-relaxed text-[#4A5D54]">
                  &ldquo;{activePhoto.greeting}&rdquo; Pilih salah satu kartu foto sahabat di sebelah kanan untuk mendengarkan sapaan mereka atau tekan tombol di bawah untuk melanjutkan petualangan.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectStep(2)}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  Mulai Petualangan
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => spotlightBook && onReadBook(spotlightBook)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Langsung Baca Buku Pilihan
                </button>
              </div>
            </div>
          )}

          {activeStepDef.stepNumber === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#DCE4DF] bg-white p-3.5">
                  <p className="text-[11px] font-medium text-[#4A5D54]">Koleksi Aktif</p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#111C17]">
                    {activeBooks.length} Judul
                  </p>
                  <p className="text-[11px] text-[#4A5D54]">10+ Kategori Bacaan</p>
                </div>
                <div className="rounded-xl border border-[#DCE4DF] bg-white p-3.5">
                  <p className="text-[11px] font-medium text-[#4A5D54]">Agenda Teras</p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums text-[#111C17]">
                    {db.schedules.length} Program
                  </p>
                  <p className="text-[11px] text-[#4A5D54]">Jadwal Senin–Minggu</p>
                </div>
                <div className="rounded-xl border border-[#DCE4DF] bg-white p-3.5">
                  <p className="text-[11px] font-medium text-[#4A5D54]">Kerangka Belajar</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#111C17]">
                    TELAGA
                  </p>
                  <p className="text-[11px] text-[#4A5D54]">6 Zona Aksi & Karya</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectStep(3)}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  Lanjut ke Hutan Buku
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onJumpToTelaga}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
                >
                  Pelajari Pilar TELAGA
                </button>
              </div>
            </div>
          )}

          {activeStepDef.stepNumber === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter kategori hutan buku"
                  value={forestCategory}
                  onChange={(e) => setForestCategory(e.target.value)}
                  className="rounded-xl border border-[#DCE4DF] bg-white px-3 py-2 text-xs font-semibold text-[#111C17]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      Kategori: {cat}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter usia pembaca hutan buku"
                  value={forestLevel}
                  onChange={(e) => setForestLevel(e.target.value)}
                  className="rounded-xl border border-[#DCE4DF] bg-white px-3 py-2 text-xs font-semibold text-[#111C17]"
                >
                  {readerLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Jenjang: {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {forestBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => {
                      setSelectedStoryBookId(book.id);
                      handleSelectStep(4);
                    }}
                    className="flex items-center gap-3 rounded-xl border border-[#DCE4DF] bg-white p-2.5 text-left transition-colors hover:border-[#BFD0C7]"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-[#EDF3EF] p-0.5 shrink-0">
                      {book.coverUrl ? (
                        <ResilientImage
                          src={book.coverUrl}
                          alt={book.judul}
                          className="h-full w-full object-contain"
                          renderFallback={() => <CustomBookCoverSvg book={book} />}
                        />
                      ) : (
                        <CustomBookCoverSvg book={book} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--brand-primary-ink)' }}>
                        {book.kategori} · {book.jenjangPembaca ?? 'SD Awal'}
                      </p>
                      <p className="font-display text-xs font-bold text-[#111C17] truncate">
                        {book.judul}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onOpenCatalog}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  <Library className="h-3.5 w-3.5" aria-hidden="true" />
                  Buka Semua 10+ Kategori di Katalog
                </button>
              </div>
            </div>
          )}

          {activeStepDef.stepNumber === 4 && spotlightBook && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-[#DCE4DF] bg-white p-4 sm:flex-row sm:items-center">
                <div className="h-24 w-24 overflow-hidden rounded-xl bg-[#EDF3EF] p-1 shrink-0">
                  {spotlightBook.coverUrl ? (
                    <ResilientImage
                      src={spotlightBook.coverUrl}
                      alt={spotlightBook.judul}
                      className="h-full w-full object-contain"
                      renderFallback={() => <CustomBookCoverSvg book={spotlightBook} />}
                    />
                  ) : (
                    <CustomBookCoverSvg book={spotlightBook} />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                    {spotlightBook.kategori} · {spotlightBook.estimasiMenit ?? 5} menit · {spotlightBook.lokasiRak}
                  </p>
                  <h4 className="font-display text-base font-bold text-[#111C17]">
                    {spotlightBook.judul}
                  </h4>
                  <p className="text-xs text-[#4A5D54] line-clamp-2">
                    {spotlightBook.deskripsi}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#DCE4DF] bg-white p-3.5 text-xs text-[#4A5D54] space-y-1">
                <p className="font-semibold text-[#111C17]">Cara Meminjam Buku Fisik di Teras:</p>
                <p>1. Pilih buku di rak atau katalog → 2. Tunjukkan QR E-Kartu Anggota → 3. Catat pinjaman 7 hari bersama pendamping.</p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onReadBook(spotlightBook)}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Buka Pintu Cerita (Baca Sekarang)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectStep(5)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
                >
                  Lanjut ke Misi Literasi
                </button>
              </div>
            </div>
          )}

          {activeStepDef.stepNumber === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {(db.challenges ?? []).slice(0, 2).map((ch) => (
                  <div
                    key={ch.id}
                    className="rounded-xl border border-[#DCE4DF] bg-white p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#4A5D54]">{ch.periode}</span>
                      <span className="font-mono-tabular font-bold" style={{ color: 'var(--brand-primary-ink)' }}>
                        +{ch.bonusPoin} Poin
                      </span>
                    </div>
                    <p className="font-display text-sm font-bold text-[#111C17]">{ch.judul}</p>
                    <p className="text-xs text-[#4A5D54] line-clamp-2">{ch.deskripsi}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => spotlightBook && onReadBook(spotlightBook)}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Buka Buku & Kerjakan Kuis / Ulasan
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectStep(6)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
                >
                  Lihat Bintang Literasi
                </button>
              </div>
            </div>
          )}

          {activeStepDef.stepNumber === 6 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#DCE4DF] bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-[#4A5D54]">Jenjang Petualang Saat Ini</p>
                    <p className="font-display text-lg font-bold text-[#111C17]">
                      {levelInfo.currentLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-tabular text-lg font-bold" style={{ color: 'var(--brand-accent-ink)' }}>
                      {displayPoints} Poin
                    </p>
                    <p className="text-[11px] text-[#4A5D54]">
                      {completedBooksCount} buku selesai dibaca
                    </p>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E7EEEA]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(8, levelInfo.progressPercent)}%`,
                      backgroundColor: db.config.accentColor,
                    }}
                  />
                </div>
                <p className="text-xs text-[#4A5D54]">
                  {levelInfo.nextLevel
                    ? `Butuh ${levelInfo.pointsToNext} poin lagi untuk naik ke jenjang ${levelInfo.nextLevel}.`
                    : 'Selamat! Kamu mencapai puncak Duta Literasi Almahyra.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  Buka E-Paspor & Lencana Saya
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectStep(7)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
                >
                  Jadi Sahabat Almahyra
                </button>
              </div>
            </div>
          )}

          {activeStepDef.stepNumber === 7 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#DCE4DF] bg-white p-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label
                    htmlFor="sahabat-sender-name"
                    className="text-xs font-semibold text-[#111C17] flex items-center gap-1.5"
                  >
                    <HeartHandshake className="h-3.5 w-3.5" style={{ color: 'var(--brand-accent-ink)' }} />
                    Kartu Ajakan Sahabat Almahyra
                  </label>
                  <input
                    id="sahabat-sender-name"
                    type="text"
                    value={friendSenderName}
                    onChange={(e) => setFriendSenderName(e.target.value)}
                    placeholder="Tulis namamu (opsional)..."
                    className="rounded-lg border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-1.5 text-xs text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#136B36] focus:outline-none"
                  />
                </div>
                <p className="rounded-lg bg-[#F8FAF9] p-3 text-xs leading-relaxed text-[#4A5D54]">
                  {invitationText}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyInvitation}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Teks Ajakan Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Bagikan & Ajak Teman Membaca
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onOpenCatalog}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Petualangan Berikutnya
                </button>
              </div>
            </div>
          )}

          {/* Step Prev/Next Bar */}
          <div className="flex items-center justify-between border-t border-[#E2E8E5] pt-3.5">
            <button
              type="button"
              disabled={activeStepDef.stepNumber <= 1}
              onClick={() => handleSelectStep(Math.max(1, activeStepDef.stepNumber - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] disabled:opacity-40 whitespace-nowrap"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Tahap Sebelumnya
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectStep(
                  activeStepDef.stepNumber >= 7 ? 1 : activeStepDef.stepNumber + 1,
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
            >
              {activeStepDef.stepNumber >= 7 ? 'Ulangi dari Tahap 1' : 'Tahap Berikutnya'}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right Interactive Photo Showcase: All 3 Uploaded Photos (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="mx-auto max-w-[330px] overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white p-2 spatial-depth-shadow">
            <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-[#EEF3F0]">
              <ResilientImage
                src={activePhoto.src}
                fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                alt={activePhoto.name}
                loading="eager"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white space-y-1">
                <p className="text-[11px] font-semibold text-white/85 flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-current text-amber-300" aria-hidden="true" />
                  {activePhoto.name}
                </p>
                <p className="font-display text-sm font-bold leading-snug">
                  &ldquo;{activePhoto.greeting}&rdquo;
                </p>
                <p className="text-[11px] text-white/80">{activePhoto.caption}</p>
              </div>
            </div>
          </div>

          {/* 3 Clickable Portrait Thumbnails so all 3 real photos are always visible & interactive */}
          <div className="mx-auto grid max-w-[330px] grid-cols-3 gap-2.5">
            {SAHABAT_GALLERY_PHOTOS.map((photo, idx) => {
              const active = idx === selectedPhotoIdx;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(idx)}
                  aria-pressed={active}
                  className={`group overflow-hidden rounded-xl border p-1 text-left transition-all ${
                    active
                      ? 'border-[#136B36] dark:border-emerald-400 bg-[#F2F6F4] ring-2 ring-[#136B36]/25 dark:ring-emerald-400/25'
                      : 'border-[#DCE4DF] bg-white hover:border-[#BFD0C7]'
                  }`}
                >
                  <div className="aspect-3/4 w-full overflow-hidden rounded-lg bg-[#EEF3F0]">
                    <ResilientImage
                      src={photo.src}
                      fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                      alt={photo.name}
                      className="h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-1.5 px-1 pb-0.5 font-display text-[11px] font-bold text-[#111C17] truncate">
                    Sahabat {idx + 1}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#4A5D54]">
            <Share2 className="h-3 w-3" aria-hidden="true" />
            Ketuk foto untuk berganti sapaan Sahabat Almahyra
          </p>
        </div>
      </div>
    </section>
  );
}
