import {
  ArrowRight,
  BookOpen,
  Play,
  PlayCircle,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import {
  EDUCATIONAL_VIDEOS,
  getYouTubeThumbnailUrl,
} from '../data/educationalVideos';
import type { Book } from '../types/almahyra';
import { isBookActive } from '../utils/almahyra';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { ResilientImage } from './ResilientImage';

interface HomepageShowcaseStageProps {
  books: Book[];
  featuredBook?: Book;
  dailyMissionDone: boolean;
  onReadBook: (book: Book) => void;
  onOpenAllBooks: () => void;
  onOpenPassportQuiz: () => void;
  onOpenVideos: (zoneId?: string, videoId?: string) => void;
}

export function HomepageShowcaseStage({
  books,
  featuredBook,
  dailyMissionDone,
  onReadBook,
  onOpenAllBooks,
  onOpenPassportQuiz,
  onOpenVideos,
}: HomepageShowcaseStageProps) {
  const topBooks = books
    .filter((b) => isBookActive(b) && b.pilihanAlmahyra)
    .slice(0, 3);
  const displayBooks = topBooks.length >= 3 ? topBooks : books.filter(isBookActive).slice(0, 3);

  // Pick 3 diverse featured videos from different channels
  const previewVideos = [
    EDUCATIONAL_VIDEOS.find((v) => v.channelId === 'kok-bisa') ?? EDUCATIONAL_VIDEOS[0],
    EDUCATIONAL_VIDEOS.find((v) => v.channelId === 'nussa-official') ?? EDUCATIONAL_VIDEOS[1],
    EDUCATIONAL_VIDEOS.find((v) => v.channelId === 'sisi-terang') ?? EDUCATIONAL_VIDEOS[2],
  ].filter(Boolean);

  return (
    <section
      aria-label="Sorotan Buku, Misi Hari Ini, dan Video Edukasi"
      className="grid grid-cols-1 gap-5 lg:grid-cols-3"
    >
      {/* Card 1: Jelajahi Buku Pilihan */}
      <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#DCE8DF] bg-[#FFFDF8] shadow-sm dark:border-[#213E31] dark:bg-[#10211A]">
        <div className="flex items-center justify-between gap-2 bg-[#087C3B] px-5 py-3 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 shrink-0 text-[#FFC51B]" aria-hidden="true" />
            <h2 className="font-display text-base font-bold truncate">
              Jelajahi Buku Pilihan
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenAllBooks}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FFF2B2] hover:text-white whitespace-nowrap shrink-0"
          >
            Lihat Semua
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-2.5 p-4">
          {displayBooks.map((book, idx) => (
            <button
              key={book.id}
              type="button"
              onClick={() => onReadBook(book)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E5EAE6] bg-white p-2 text-left transition-transform hover:-translate-y-1 hover:border-[#087C3B] dark:border-[#223F32] dark:bg-[#132920]"
            >
              <div className="aspect-3/4 w-full overflow-hidden rounded-xl bg-[#F4F8F5] p-1">
                {book.coverUrl ? (
                  <ResilientImage
                    src={book.coverUrl}
                    alt={`Sampul ${book.judul}`}
                    className="h-full w-full object-contain"
                    renderFallback={() => <CustomBookCoverSvg book={book} />}
                  />
                ) : (
                  <CustomBookCoverSvg book={book} />
                )}
              </div>
              <p className="mt-2 font-display text-xs font-bold leading-snug text-[#10281B] line-clamp-2 group-hover:text-[#087C3B] dark:text-[#EDF5F0]">
                {book.judul}
              </p>
              <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                <span className="inline-flex items-center gap-0.5 font-mono-tabular text-[10px] font-bold text-[#D97706]">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  {(4.9 - idx * 0.1).toFixed(1)}
                </span>
                <span className="rounded-md bg-[#E4F7EA] px-1.5 py-0.5 text-[9px] font-extrabold text-[#087C3B] dark:bg-[#153526] dark:text-[#6EE7B7]">
                  Tersedia
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: Misi Hari Ini */}
      <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#DCE8DF] bg-[#FFFBF0] shadow-sm dark:border-[#213E31] dark:bg-[#10211A]">
        <div className="flex items-center justify-between gap-2 bg-[#087C3B] px-5 py-3 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="h-4 w-4 shrink-0 text-[#FFC51B]" aria-hidden="true" />
            <h2 className="font-display text-base font-bold truncate">Misi Hari Ini</h2>
          </div>
          <span className="rounded-full bg-[#FFC51B] px-2.5 py-0.5 font-mono-tabular text-[11px] font-extrabold text-[#10281B]">
            +10 Poin
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF3C4] via-[#FFE28A] to-[#D6F5E3] border border-[#F5D67B] shadow-xs">
              <div className="relative flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-[#087C3B]" aria-hidden="true" />
                <Star className="absolute -top-2 -right-2 h-5 w-5 fill-[#FFC51B] text-[#D97706]" aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-extrabold leading-tight text-[#10281B] dark:text-white">
                Baca satu cerita favoritmu!
              </h3>
              <p className="text-xs font-medium text-[#4A5D54] dark:text-[#A2BCB0]">
                Selesaikan bacaan dan jawab kuis singkatnya untuk stempel E-Paspor.
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF2CC] px-2.5 py-0.5 font-mono-tabular text-xs font-extrabold text-[#9A5B08]">
                <Star className="h-3.5 w-3.5 fill-[#FFC51B] text-[#D97706]" aria-hidden="true" />
                +10 Poin Bintang
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#E5EDE8] dark:bg-[#193328]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#087C3B] to-[#7ED321] transition-all duration-300"
                  style={{ width: dailyMissionDone ? '100%' : '35%' }}
                />
              </div>
              <span className="font-mono-tabular text-xs font-extrabold text-[#10281B] dark:text-[#EDF5F0]">
                {dailyMissionDone ? '1 / 1' : '0 / 1'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (featuredBook ? onReadBook(featuredBook) : onOpenPassportQuiz())}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#087C3B] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#06612D]"
              >
                <Trophy className="h-4 w-4 text-[#FFC51B]" aria-hidden="true" />
                Selesaikan Misi
              </button>
              <button
                type="button"
                onClick={onOpenPassportQuiz}
                className="inline-flex items-center justify-center rounded-full border border-[#DCE4DF] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[#10281B] hover:bg-[#FFF8E8] dark:border-[#244536] dark:bg-[#142C22] dark:text-white"
              >
                Kuis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Video Edukasi 6 Zona */}
      <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#DCE8DF] bg-[#FFFDF8] shadow-sm dark:border-[#213E31] dark:bg-[#10211A]">
        <div className="flex items-center justify-between gap-2 bg-[#087C3B] px-5 py-3 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <PlayCircle className="h-4 w-4 shrink-0 text-[#FFC51B]" aria-hidden="true" />
            <h2 className="font-display text-base font-bold truncate">
              Video Edukasi 6 Zona
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenVideos('all')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FFF2B2] hover:text-white whitespace-nowrap shrink-0"
          >
            Lihat Semua
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {previewVideos.map((vid, idx) => (
              <button
                key={vid.id}
                type="button"
                onClick={() => onOpenVideos(vid.zoneId, vid.id)}
                className={`group flex flex-col overflow-hidden rounded-2xl border-2 border-white bg-white p-1.5 text-left shadow-sm transition-transform hover:-translate-y-1 hover:border-[#087C3B] dark:border-[#223F32] dark:bg-[#132920] ${
                  idx === 0 ? '-rotate-1' : idx === 2 ? 'rotate-1' : ''
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#10281B]">
                  <ResilientImage
                    src={getYouTubeThumbnailUrl(vid.youtubeId)}
                    alt={vid.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" aria-hidden="true" />
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] font-extrabold text-[#087C3B] truncate dark:text-[#6EE7B7]">
                  {vid.channelName}
                </p>
                <p className="text-[11px] font-bold leading-tight text-[#10281B] line-clamp-2 dark:text-[#EDF5F0]">
                  {vid.title}
                </p>
              </button>
            ))}
          </div>

          <p className="text-center text-[11px] font-semibold text-[#4A5D54] dark:text-[#A2BCB0]">
            10 kanal edukasi Indonesia pilihan terbagi dalam 6 zona petualangan.
          </p>
        </div>
      </div>
    </section>
  );
}
