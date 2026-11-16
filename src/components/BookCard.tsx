import { BookOpen, Clock, Heart, Sparkles, Star } from 'lucide-react';
import type { Book, LandingConfig, ReadingProgress } from '../types/almahyra';

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

  return (
    <article className="book-3d-card flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white p-4 transition-colors hover:border-[#BFD0C7]">
      <div>
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-[#EEF3F0] bg-[#F2F6F4]">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={`Sampul ${book.judul}`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col justify-between p-4 text-white"
              style={{
                background: `linear-gradient(145deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`,
              }}
            >
              <span className="font-mono-tabular text-[11px] text-white/80">
                {book.kodeBuku}
              </span>
              <div className="space-y-1">
                <BookOpen className="h-5 w-5 text-white/85" aria-hidden="true" />
                <p className="font-display text-sm font-bold leading-snug line-clamp-2">
                  {book.judul}
                </p>
              </div>
            </div>
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRead(book)}
            style={{ backgroundColor: config.primaryColor }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {hasBookmark ? 'Lanjut Baca' : 'Baca Sekarang'}
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(book)}
            aria-pressed={isFav}
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
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
