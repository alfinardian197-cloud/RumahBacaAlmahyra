import { ArrowRight, BookOpen, Image as ImageIcon, Star, Target, Trophy } from 'lucide-react';
import { DEFAULT_HERO_IMAGE_URL } from '../data/defaultDb';
import type { Book, CreationWork } from '../types/almahyra';
import { isBookActive } from '../utils/almahyra';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { ResilientImage } from './ResilientImage';

interface HomepageShowcaseStageProps {
  books: Book[];
  creations: CreationWork[];
  featuredBook?: Book;
  dailyMissionDone: boolean;
  onReadBook: (book: Book) => void;
  onOpenAllBooks: () => void;
  onOpenPassportQuiz: () => void;
  onOpenGallery: () => void;
}

const SAMPLE_RATINGS = ['4.8', '4.7', '4.9'];

export function HomepageShowcaseStage({
  books,
  creations,
  featuredBook,
  dailyMissionDone,
  onReadBook,
  onOpenAllBooks,
  onOpenPassportQuiz,
  onOpenGallery,
}: HomepageShowcaseStageProps) {
  const activeBooks = books.filter(isBookActive);
  const topThreeBooks = [
    ...activeBooks.filter((b) => b.pilihanAlmahyra),
    ...activeBooks.filter((b) => !b.pilihanAlmahyra),
  ].slice(0, 3);

  const approvedCreations = creations
    .filter((c) => c.moderationStatus === 'approved' && c.parentApproved !== false && c.imageUrl)
    .slice(0, 3);

  const polaroids =
    approvedCreations.length >= 3
      ? approvedCreations
      : [
          ...approvedCreations,
          {
            id: 'fallback-1',
            judul: 'Teras Membaca Almahyra',
            imageUrl: DEFAULT_HERO_IMAGE_URL,
            namaSamaran: 'Sahabat Grontol',
          },
          {
            id: 'fallback-2',
            judul: 'Komik Kebun Hijau',
            imageUrl: '/images/book_cover_comic_1794800547189.jpg',
            namaSamaran: 'Tim Komik',
          },
          {
            id: 'fallback-3',
            judul: 'Eksperimen Sains Dapur',
            imageUrl: '/images/book_cover_science_1794800525915.jpg',
            namaSamaran: 'Klub Sains',
          },
        ].slice(0, 3);

  return (
    <section
      aria-label="Ringkasan Dunia Almahyra"
      className="grid grid-cols-1 gap-4 lg:grid-cols-12"
    >
      {/* Card 1: Jelajahi Buku Pilihan (4 cols on lg) */}
      <div className="lg:col-span-4 flex flex-col overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 bg-[#087C3B] px-4 py-2.5 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-[#FFC51B] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-sm sm:text-base font-bold truncate">
              Jelajahi Buku Pilihan
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenAllBooks}
            className="inline-flex items-center gap-1 text-xs font-bold text-white/95 hover:text-[#FFC51B] whitespace-nowrap shrink-0"
          >
            Lihat Semua
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-2.5 p-3.5">
          {topThreeBooks.map((book, idx) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onReadBook(book)}
              className="group flex flex-col justify-between rounded-xl border border-[#E7DEC6] bg-[#FFFDF6] p-2 text-left transition-all hover:-translate-y-0.5 hover:border-[#087C3B]/45 hover:shadow-xs"
            >
              <div>
                <div
                  className={`aspect-4/3 w-full overflow-hidden rounded-lg ${
                    book.coverUrl ? 'bg-[#EDF3EF] p-1' : 'bg-[#E7EEEA]'
                  }`}
                >
                  {book.coverUrl ? (
                    <ResilientImage
                      src={book.coverUrl}
                      alt={`Sampul ${book.judul}`}
                      className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                      renderFallback={() => <CustomBookCoverSvg book={book} />}
                    />
                  ) : (
                    <CustomBookCoverSvg
                      book={book}
                      className="h-full w-full transition-transform duration-200 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-2 font-display text-[11px] sm:text-xs font-bold leading-snug text-[#111C17] line-clamp-2">
                  {book.judul}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between gap-1 text-[10px]">
                <span className="inline-flex items-center gap-0.5 font-mono-tabular font-bold text-[#B45309] dark:text-[#FCD34D]">
                  <Star className="h-3 w-3 fill-[#FFC51B] text-[#FFC51B]" aria-hidden="true" />
                  {SAMPLE_RATINGS[idx] ?? '4.8'}
                </span>
                <span className="rounded-md bg-[#E4F7EA] px-1.5 py-0.5 font-bold text-[#087C3B] dark:bg-emerald-950/60 dark:text-[#6EE7B7] truncate">
                  {book.status === 'Tersedia' ? 'Tersedia' : 'Baca'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: Misi Hari Ini (4 cols on lg) */}
      <div className="lg:col-span-4 flex flex-col overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 bg-[#087C3B] px-4 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#FFC51B] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-sm sm:text-base font-bold">Misi Hari Ini</h2>
          </div>
          <span className="font-mono-tabular text-[11px] font-bold text-[#FFC51B]">
            +10 Poin
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
          <div className="flex items-center gap-3.5">
            {/* Illustrated Open Book + Ascending Stars SVG */}
            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#E7DEC6] bg-gradient-to-b from-[#E6F7FE] to-[#FFF8DF] p-2 preserve-light">
              <svg
                viewBox="0 0 96 76"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="bookGlow" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#FFE67A" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#FFE67A" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="48" cy="34" r="28" fill="url(#bookGlow)" />
                {/* 3 Ascending Stars */}
                <path
                  d="M48 8 L51.2 14.5 L58.4 15.5 L53.2 20.6 L54.4 27.8 L48 24.4 L41.6 27.8 L42.8 20.6 L37.6 15.5 L44.8 14.5 Z"
                  fill="#FFC51B"
                  stroke="#B45309"
                  strokeWidth="1.2"
                />
                <path
                  d="M28 19 L30.2 23.4 L35 24.1 L31.5 27.5 L32.3 32.3 L28 30 L23.7 32.3 L24.5 27.5 L21 24.1 L25.8 23.4 Z"
                  fill="#FFD54F"
                />
                <path
                  d="M68 19 L70.2 23.4 L75 24.1 L71.5 27.5 L72.3 32.3 L68 30 L63.7 32.3 L64.5 27.5 L61 24.1 L65.8 23.4 Z"
                  fill="#FFD54F"
                />
                {/* Open Book */}
                <path
                  d="M14 42 C24 38, 38 40, 48 46 C58 40, 72 38, 82 42 L82 64 C72 60, 58 62, 48 68 C38 62, 24 60, 14 64 Z"
                  fill="#087C3B"
                />
                <path
                  d="M18 40 C27 36, 39 38, 48 44 C57 38, 69 36, 78 40 L78 60 C69 56, 57 58, 48 64 C39 58, 27 56, 18 60 Z"
                  fill="#FFFDF6"
                  stroke="#D4C7A7"
                  strokeWidth="1.2"
                />
                <line x1="48" y1="44" x2="48" y2="64" stroke="#CBD6D0" strokeWidth="1.4" />
              </svg>
            </div>

            <div className="space-y-1.5 min-w-0">
              <h3 className="font-display text-base font-extrabold text-[#111C17] leading-snug">
                Baca satu cerita favoritmu!
              </h3>
              <p className="text-xs text-[#4A5D54] leading-snug">
                Selesaikan bacaan dan jawab kuisnya.
              </p>
              <div className="inline-flex items-center gap-1 rounded-lg bg-[#FFC51B] px-2.5 py-0.5 text-xs font-extrabold text-[#10281B]">
                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                +10 Poin
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E7EEEA]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: dailyMissionDone ? '100%' : '35%',
                    background: 'linear-gradient(90deg, #087C3B 0%, #7ED321 75%, #FFC51B 100%)',
                  }}
                />
              </div>
              <span className="font-mono-tabular text-xs font-bold text-[#111C17]">
                {dailyMissionDone ? '1 / 1' : '0 / 1'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!dailyMissionDone && featuredBook) {
                  onReadBook(featuredBook);
                } else {
                  onOpenPassportQuiz();
                }
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#0C9448] to-[#075A32] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:opacity-95"
            >
              <Trophy className="h-4 w-4 text-[#FFC51B]" aria-hidden="true" />
              {dailyMissionDone ? 'Lanjut Main Mini Kuis' : 'Selesaikan Misi'}
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Galeri Karya Sahabat (4 cols on lg) */}
      <div className="lg:col-span-4 flex flex-col overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 bg-[#087C3B] px-4 py-2.5 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon className="h-4 w-4 text-[#FFC51B] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-sm sm:text-base font-bold truncate">
              Galeri Karya Sahabat
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenGallery}
            className="inline-flex items-center gap-1 text-xs font-bold text-white/95 hover:text-[#FFC51B] whitespace-nowrap shrink-0"
          >
            Lihat Semua
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center bg-[#FFF8E8]/60 p-4">
          {/* Decorative floating stars */}
          <Star
            className="pointer-events-none absolute left-4 top-4 h-4 w-4 fill-[#FFC51B] text-[#FFC51B]"
            aria-hidden="true"
          />
          <Star
            className="pointer-events-none absolute right-5 top-5 h-3.5 w-3.5 fill-[#08A9EF] text-[#08A9EF]"
            aria-hidden="true"
          />
          <Star
            className="pointer-events-none absolute bottom-3 left-1/3 h-3.5 w-3.5 fill-[#F58220] text-[#F58220]"
            aria-hidden="true"
          />

          <div className="grid w-full grid-cols-3 items-center gap-2 sm:gap-3">
            {polaroids.map((item, idx) => {
              const tiltClass =
                idx === 0
                  ? 'sm:-rotate-3'
                  : idx === 1
                    ? 'sm:rotate-1 sm:-translate-y-1 z-10'
                    : 'sm:rotate-3';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={onOpenGallery}
                  title={`${item.judul} · ${item.namaSamaran}`}
                  className={`preserve-light group rounded-xl border border-[#E7DEC6] bg-white p-1.5 pb-3 text-left shadow-md transition-transform hover:scale-105 ${tiltClass}`}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-[#E7EEEA]">
                    <ResilientImage
                      src={item.imageUrl || DEFAULT_HERO_IMAGE_URL}
                      fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                      alt={item.judul}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-1.5 truncate text-[10px] font-bold text-[#10281B]">
                    {item.judul}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
