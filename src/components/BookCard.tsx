import { useEffect, useState } from 'react';
import { BookOpen, Clock, Heart, Sparkles, Square, Star, Volume2 } from 'lucide-react';
import type { Book, LandingConfig, ReadingProgress } from '../types/almahyra';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { ResilientImage } from './ResilientImage';

interface BookCardProps {
  book: Book;
  config: LandingConfig;
  progress?: ReadingProgress;
  onRead: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  compact?: boolean;
}

export function BookCard({
  book,
  config,
  progress,
  onRead,
  onToggleFavorite,
  compact = false,
}: BookCardProps) {
  const isFav = Boolean(progress?.isFavorite);
  const hasBookmark = Boolean(progress && progress.lastPage > 0);
  const readingMinutes = book.estimasiMenit ?? 5;
  const readerLevel = book.jenjangPembaca ?? 'Semua Usia';
  const [speakingSummary, setSpeakingSummary] = useState(false);

  useEffect(() => {
    return () => {
      if (speakingSummary && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speakingSummary]);

  const handleToggleReadSummary = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingSummary) {
      window.speechSynthesis.cancel();
      setSpeakingSummary(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      `${book.judul}. Ditulis oleh ${book.penulis}. ${book.deskripsi}`,
    );
    utter.lang = 'id-ID';
    utter.rate = 0.94;
    utter.onend = () => setSpeakingSummary(false);
    utter.onerror = () => setSpeakingSummary(false);
    setSpeakingSummary(true);
    window.speechSynthesis.speak(utter);
  };

  const hasCustomUploadCover = Boolean(book.coverUrl?.startsWith('data:image/'));

  return (
    <article className="book-3d-card flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white p-4 transition-colors hover:border-[#BFD0C7]">
      <div>
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-[#EEF3F0] bg-[#F2F6F4]">
          {hasCustomUploadCover && book.coverUrl ? (
            <ResilientImage
              src={book.coverUrl}
              alt={`Sampul ${book.judul}`}
              className="h-full w-full object-cover"
              renderFallback={() => <CustomBookCoverSvg book={book} />}
            />
          ) : (
            <CustomBookCoverSvg book={book} />
          )}

          {book.pilihanAlmahyra && (
            <span
              className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-white shadow-xs"
              style={{ backgroundColor: config.accentColor }}
            >
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              Pilihan
            </span>
          )}

          <button
            type="button"
            onClick={() => onToggleFavorite(book)}
            aria-pressed={isFav}
            aria-label={isFav ? `Hapus ${book.judul} dari favorit` : `Tandai ${book.judul} sebagai favorit`}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              isFav
                ? 'border-rose-300 bg-rose-50 text-rose-600'
                : 'border-[#DCE4DF] bg-white/95 text-[#4A5D54] hover:text-rose-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3.5 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#4A5D54]">
            <span className="font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
              {book.kategori}
            </span>
            <span aria-hidden="true">·</span>
            <span>{readerLevel}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono-tabular">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {readingMinutes} mnt
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                book.status === 'Tersedia'
                  ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                  : 'font-semibold text-amber-700 dark:text-amber-300'
              }
            >
              {book.status}
            </span>
          </div>

          <h3 className="font-display text-base font-bold leading-snug text-[#111C17] line-clamp-2">
            {book.judul}
          </h3>
          <p className="text-xs font-medium text-[#4A5D54] truncate">
            {book.penulis}
          </p>

          {!compact && (
            <p className="text-xs leading-relaxed text-[#4A5D54] line-clamp-2">
              {book.deskripsi}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-[#EEF3F0] pt-3">
        {hasBookmark && progress && (
          <p className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--brand-accent-ink)' }}>
            <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
            Penanda terakhir: Halaman {progress.lastPage + 1} dari {progress.totalPages}
          </p>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRead(book)}
            style={{ backgroundColor: config.primaryColor }}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-95 whitespace-nowrap"
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{hasBookmark ? 'Lanjut Baca' : 'Baca Sekarang'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleReadSummary}
            aria-pressed={speakingSummary}
            aria-label={
              speakingSummary
                ? `Hentikan suara ringkasan ${book.judul}`
                : `Dengarkan ringkasan ${book.judul}`
            }
            title="Dengar Ringkasan (Read-Aloud)"
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              speakingSummary
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#F2F6F4]'
            }`}
          >
            {speakingSummary ? (
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(book)}
            aria-pressed={isFav}
            className={`inline-flex h-9 items-center gap-1 rounded-xl border px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isFav
                ? 'border-rose-300 bg-rose-50 text-rose-700'
                : 'border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#F2F6F4]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} aria-hidden="true" />
            Favorit
          </button>
        </div>
      </div>
    </article>
  );
}
