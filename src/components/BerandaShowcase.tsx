import { useMemo, useState } from 'react';
import { BookOpen, ArrowRight, Award, Clock, Flame, Sparkles, Star, Target } from 'lucide-react';
import type {
  AlmahyraDatabase,
  Book,
  ReadingProgress,
} from '../types/almahyra';
import { computeBookShelves } from '../utils/almahyra';
import { BookCard } from './BookCard';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { ResilientImage } from './ResilientImage';

interface BerandaShowcaseProps {
  db: AlmahyraDatabase;
  viewerKey: string;
  onReadBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  onOpenCatalog: () => void;
}

type ShelfKey =
  | 'pilihanAlmahyra'
  | 'terbaru'
  | 'terbanyakDibaca'
  | 'rekomendasi'
  | 'ceritaNusantara'
  | 'komikEdukasi'
  | 'bacaanSingkat5Menit';

const SHELF_DEFS: { key: ShelfKey; label: string; subtitle: string }[] = [
  {
    key: 'pilihanAlmahyra',
    label: 'Rak Buku Pilihan ALMAHYRA',
    subtitle: 'Kurasi utama pendamping Rumah Baca untuk membangkitkan minat baca anak.',
  },
  {
    key: 'terbaru',
    label: 'Buku Terbaru',
    subtitle: 'Koleksi terbaru yang baru saja diterbitkan dan siap dibaca bersama.',
  },
  {
    key: 'terbanyakDibaca',
    label: 'Buku Paling Banyak Dibaca',
    subtitle: 'Bacaan paling digemari adik-adik dan keluarga di Teras Almahyra.',
  },
  {
    key: 'rekomendasi',
    label: 'Rekomendasi Bacaan',
    subtitle: 'Dipilih khusus sesuai jenjang usia SD, PAUD, dan minat petualangan literasi.',
  },
  {
    key: 'ceritaNusantara',
    label: 'Cerita Rakyat Nusantara',
    subtitle: 'Dongeng klasik daerah, legenda, dan kekayaan budaya Indonesia.',
  },
  {
    key: 'komikEdukasi',
    label: 'Komik Edukasi',
    subtitle: 'Cerita bergambar penuh dialog interaktif yang ringan dan mendidik.',
  },
  {
    key: 'bacaanSingkat5Menit',
    label: 'Bacaan Singkat 5 Menit',
    subtitle: 'Cerita singkat berdurasi <= 5 menit yang pas dibaca sebelum tidur atau istirahat.',
  },
];

export function BerandaShowcase({
  db,
  viewerKey,
  onReadBook,
  onToggleFavorite,
  onOpenCatalog,
}: BerandaShowcaseProps) {
  const [activeShelf, setActiveShelf] = useState<ShelfKey>('pilihanAlmahyra');

  const shelves = useMemo(() => computeBookShelves(db.books, 'SD'), [db.books]);

  const progressMap = useMemo(() => {
    const map = new Map<string, ReadingProgress>();
    for (const p of db.readingProgress ?? []) {
      if (p.viewerKey === viewerKey) {
        map.set(p.bookId, p);
      }
    }
    return map;
  }, [db.readingProgress, viewerKey]);

  const currentShelfDef =
    SHELF_DEFS.find((s) => s.key === activeShelf) ?? SHELF_DEFS[0];
  const currentShelfBooks = shelves[activeShelf];

  const challenges = db.challenges ?? [];

  return (
    <section className="space-y-8" aria-label="Etalase Rumah Baca Digital ALMAHYRA">
      {/* Section Header + Shelf Switcher */}
      <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-semibold tracking-wide"
              style={{ color: 'var(--brand-accent-ink)' }}
            >
              Rumah Baca Digital Keluarga
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#111C17]">
              Rak Buku Digital & Petualangan Baca Minggu Ini
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenCatalog}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-4 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
          >
            Lihat Semua 10+ Kategori
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* 7 Book Shelves Explorer */}
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#EEF3F0] p-1.5">
          {SHELF_DEFS.map((def) => {
            const active = activeShelf === def.key;
            return (
              <button
                key={def.key}
                type="button"
                onClick={() => setActiveShelf(def.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'text-white shadow-xs'
                    : 'text-[#4A5D54] hover:text-[#111C17]'
                }`}
                style={active ? { backgroundColor: db.config.primaryColor } : undefined}
              >
                {def.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF3F0] pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-[#111C17]">
              {currentShelfDef.label}
            </h3>
            <p className="text-xs text-[#4A5D54]">{currentShelfDef.subtitle}</p>
          </div>
          <span className="font-mono-tabular text-xs font-semibold text-[#4A5D54]">
            {currentShelfBooks.length} judul pilihan
          </span>
        </div>

        <div
          className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${
            currentShelfBooks.length % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          }`}
        >
          {currentShelfBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              config={db.config}
              progress={progressMap.get(book.id)}
              onRead={onReadBook}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>

      {/* Direct Highlight Rows so Cerita Nusantara, Komik Edukasi, Bacaan 5 Menit & Misi Mingguan are always visible */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Highlight: Cerita Rakyat Nusantara */}
        <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-accent-ink)' }} />
              Cerita Rakyat Nusantara
            </h3>
            <button
              type="button"
              onClick={() => setActiveShelf('ceritaNusantara')}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--brand-primary-ink)' }}
            >
              Semua
            </button>
          </div>
          <div className="space-y-3">
            {shelves.ceritaNusantara.slice(0, 2).map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-[#EEF3F0] bg-[#F8FAF9] p-3"
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg shrink-0 bg-[#F2F6F4]">
                  {b.coverUrl ? (
                    <ResilientImage
                      src={b.coverUrl}
                      alt={`Sampul ${b.judul}`}
                      loading="eager"
                      className="h-full w-full object-cover object-[50%_28%]"
                      renderFallback={() => <CustomBookCoverSvg book={b} />}
                    />
                  ) : (
                    <CustomBookCoverSvg book={b} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                    {b.jenjangPembaca ?? 'SD Awal'} · {b.estimasiMenit ?? 5} mnt
                  </p>
                  <p className="font-display text-sm font-bold text-[#111C17] truncate">
                    {b.judul}
                  </p>
                  <button
                    type="button"
                    onClick={() => onReadBook(b)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--brand-accent-ink)' }}
                  >
                    <BookOpen className="h-3 w-3" />
                    Baca Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight: Komik Edukasi */}
        <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
              <Star className="h-4 w-4" style={{ color: 'var(--brand-primary-ink)' }} />
              Komik Edukasi
            </h3>
            <button
              type="button"
              onClick={() => setActiveShelf('komikEdukasi')}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--brand-primary-ink)' }}
            >
              Semua
            </button>
          </div>
          <div className="space-y-3">
            {shelves.komikEdukasi.slice(0, 2).map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-[#EEF3F0] bg-[#F8FAF9] p-3"
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg shrink-0 bg-[#F2F6F4]">
                  {b.coverUrl ? (
                    <ResilientImage
                      src={b.coverUrl}
                      alt={`Sampul ${b.judul}`}
                      loading="eager"
                      className="h-full w-full object-cover object-[50%_28%]"
                      renderFallback={() => <CustomBookCoverSvg book={b} />}
                    />
                  ) : (
                    <CustomBookCoverSvg book={b} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                    {b.jenjangPembaca ?? 'SD Awal'} · {b.estimasiMenit ?? 4} mnt
                  </p>
                  <p className="font-display text-sm font-bold text-[#111C17] truncate">
                    {b.judul}
                  </p>
                  <button
                    type="button"
                    onClick={() => onReadBook(b)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--brand-accent-ink)' }}
                  >
                    <BookOpen className="h-3 w-3" />
                    Baca Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight: Bacaan Singkat 5 Menit & Populer */}
        <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: 'var(--brand-accent-ink)' }} />
              Bacaan Singkat 5 Menit
            </h3>
            <button
              type="button"
              onClick={() => setActiveShelf('bacaanSingkat5Menit')}
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--brand-primary-ink)' }}
            >
              Semua
            </button>
          </div>
          <div className="space-y-3">
            {shelves.bacaanSingkat5Menit.slice(0, 2).map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-[#EEF3F0] bg-[#F8FAF9] p-3"
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg shrink-0 bg-[#F2F6F4]">
                  {b.coverUrl ? (
                    <ResilientImage
                      src={b.coverUrl}
                      alt={`Sampul ${b.judul}`}
                      loading="eager"
                      className="h-full w-full object-cover object-[50%_28%]"
                      renderFallback={() => <CustomBookCoverSvg book={b} />}
                    />
                  ) : (
                    <CustomBookCoverSvg book={b} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--brand-accent-ink)' }}>
                    <Flame className="h-3 w-3" />
                    {b.estimasiMenit ?? 5} menit · {b.dibacaCount ?? 0}x dibaca
                  </p>
                  <p className="font-display text-sm font-bold text-[#111C17] truncate">
                    {b.judul}
                  </p>
                  <button
                    type="button"
                    onClick={() => onReadBook(b)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--brand-primary-ink)' }}
                  >
                    <BookOpen className="h-3 w-3" />
                    Baca Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 8: Misi Literasi Mingguan */}
      <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-[#111C17] flex items-center gap-2">
              <Target className="h-5 w-5" style={{ color: 'var(--brand-accent-ink)' }} />
              Misi Literasi Mingguan & Lencana Prestasi
            </h3>
            <p className="text-xs text-[#4A5D54]">
              Selesaikan tantangan membaca mingguan, jawab kuis pemahaman, dan kumpulkan stempel E-Paspor Baca.
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
            {challenges.length} Misi Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {challenges.map((ch) => (
            <div
              key={ch.id}
              className="flex flex-col justify-between rounded-xl border border-[#E2E8E5] bg-[#F8FAF9] p-4 space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#4A5D54]">{ch.periode}</span>
                  <span className="font-mono-tabular font-bold" style={{ color: 'var(--brand-primary-ink)' }}>
                    +{ch.bonusPoin} Poin
                  </span>
                </div>
                <h4 className="font-display text-base font-bold text-[#111C17]">
                  {ch.judul}
                </h4>
                <p className="text-xs leading-relaxed text-[#4A5D54]">{ch.deskripsi}</p>
              </div>
              <div className="flex items-center justify-between border-t border-[#E7EEEA] pt-2.5 text-[11px] text-[#4A5D54]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#111C17]">
                  <Award className="h-3.5 w-3.5" style={{ color: 'var(--brand-accent-ink)' }} />
                  {ch.lencanaHadiah}
                </span>
                <span className="font-mono-tabular">Target: {ch.targetBuku} buku</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
