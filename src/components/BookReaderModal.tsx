import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Award,
  BookOpen,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  HelpCircle,
  Music,
  NotebookPen,
  Pause,
  Play,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  ReadingProgress,
} from '../types/almahyra';
import {
  getBookQuizQuestions,
  getBookReadablePages,
  isBookActive,
} from '../utils/almahyra';
import {
  getStorySoundtrackProfile,
  storyAudioEngine,
} from '../utils/storyAudioEngine';

interface BookReaderModalProps {
  book: Book | null;
  db: AlmahyraDatabase;
  session: AuthSession | null;
  progress?: ReadingProgress;
  onClose: () => void;
  onSwitchBook: (book: Book) => void;
  onOpenLogin: () => void;
  onRecordReading: (params: {
    bookId: string;
    lastPage: number;
    totalPages: number;
    completed?: boolean;
    quizScore?: number;
    journalNote?: string;
    starRating?: number;
    toggleFavorite?: boolean;
    awardPoints?: number;
  }) => Promise<void>;
}

type ReaderTab = 'read' | 'pdf' | 'quiz' | 'journal';

export function BookReaderModal({
  book,
  db,
  session,
  progress,
  onClose,
  onSwitchBook,
  onOpenLogin,
  onRecordReading,
}: BookReaderModalProps) {
  const pages = useMemo(() => (book ? getBookReadablePages(book) : []), [book]);
  const quizQuestions = useMemo(() => (book ? getBookQuizQuestions(book) : []), [book]);
  const soundtrack = useMemo(
    () =>
      book
        ? getStorySoundtrackProfile(book.kategori, book.judul, book.deskripsi)
        : null,
    [book],
  );

  const [activeTab, setActiveTab] = useState<ReaderTab>('read');
  const [pageIdx, setPageIdx] = useState(0);
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechMessage, setSpeechMessage] = useState('');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.28);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Journal & Stamp state
  const [journalNote, setJournalNote] = useState('');
  const [starRating, setStarRating] = useState(5);
  const [completedNotice, setCompletedNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!book) {
      storyAudioEngine.stop();
      setIsMusicPlaying(false);
      return;
    }
    const savedPage = Math.max(0, Math.min(pages.length - 1, progress?.lastPage ?? 0));
    setPageIdx(savedPage);
    setActiveTab('read');
    setAnswers({});
    setQuizSubmitted(false);
    setJournalNote('');
    setStarRating(5);
    setCompletedNotice('');
    setSpeechMessage('');
    stopSpeech();
    if (isMusicPlaying && soundtrack) {
      storyAudioEngine.start(soundtrack);
    }
  }, [book?.id]);

  useEffect(() => {
    storyAudioEngine.setDucked(isSpeaking);
  }, [isSpeaking]);

  useEffect(() => {
    return () => {
      stopSpeech();
      storyAudioEngine.stop();
    };
  }, []);

  function stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  const handleToggleMusic = () => {
    if (!soundtrack) return;
    if (isMusicPlaying) {
      storyAudioEngine.stop();
      setIsMusicPlaying(false);
    } else {
      storyAudioEngine.setVolume(musicVolume);
      storyAudioEngine.setDucked(isSpeaking);
      storyAudioEngine.start(soundtrack);
      setIsMusicPlaying(true);
    }
  };

  if (!book) return null;

  const currentPageData = pages[pageIdx] ?? pages[0];
  const isComic = book.kategori === 'Komik Edukasi';
  const isFavorite = Boolean(progress?.isFavorite);

  const recommendedBooks = db.books
    .filter(
      (b) =>
        isBookActive(b) &&
        b.id !== book.id &&
        (b.kategori === book.kategori || b.jenjangPembaca === book.jenjangPembaca),
    )
    .slice(0, 2);

  const quizCorrectCount = quizQuestions.reduce(
    (sum, q, idx) => sum + (answers[idx] === q.jawabanBenar ? 1 : 0),
    0,
  );
  const quizPercent =
    quizQuestions.length > 0 ? Math.round((quizCorrectCount / quizQuestions.length) * 100) : 100;

  const handleTurnPage = async (nextIdx: number) => {
    stopSpeech();
    const clamped = Math.max(0, Math.min(pages.length - 1, nextIdx));
    setPageIdx(clamped);
    await onRecordReading({
      bookId: book.id,
      lastPage: clamped,
      totalPages: pages.length,
    });
  };

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechMessage('Peramban ini belum mendukung audio narasi otomatis.');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const narrationText = `${book.judul}. ${currentPageData.judulBab}. ${currentPageData.isi} ${
      currentPageData.pesanMoral ? `Pesan cerita: ${currentPageData.pesanMoral}` : ''
    }`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = 'id-ID';
    utterance.rate = speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechMessage('Audio narasi selesai atau perangkat suara sedang tidak aktif.');
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setSpeechMessage('');
  };

  const handleCompleteReading = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onRecordReading({
        bookId: book.id,
        lastPage: pages.length - 1,
        totalPages: pages.length,
        completed: true,
        quizScore: quizSubmitted ? quizPercent : undefined,
        journalNote:
          journalNote.trim() ||
          `Selesai membaca "${book.judul}" (${book.kategori}) dengan gembira.`,
        starRating,
        awardPoints: 5,
      });
      setCompletedNotice(
        session?.role === 'anggota'
          ? `Selamat ${session.displayName}! Stempel E-Paspor Baca (+5 poin) & Jurnal Membaca berhasil dicatat.`
          : 'Bacaan ditandai selesai & penanda tersimpan! Masuk dengan Nomor Induk Anggota untuk mengumpulkan +5 poin dan stempel E-Paspor.',
      );
    } finally {
      setSaving(false);
    }
  };

  const fontSizeClass =
    fontScale === 'xlarge'
      ? 'text-lg sm:text-xl leading-relaxed'
      : fontScale === 'large'
        ? 'text-base sm:text-lg leading-relaxed'
        : 'text-sm sm:text-base leading-relaxed';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white shadow-2xl">
        {/* Top Modal Header */}
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8E5] bg-[#F8FAF9] px-5 py-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D54]">
              <span className="font-mono-tabular font-semibold">{book.kodeBuku}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                {book.kategori}
              </span>
              <span aria-hidden="true">·</span>
              <span>{book.jenjangPembaca ?? 'Semua Usia'}</span>
              <span aria-hidden="true">·</span>
              <span>{book.estimasiMenit ?? 5} menit</span>
            </div>
            <h2
              id="reader-modal-title"
              className="font-display text-lg font-bold text-[#111C17] sm:text-xl"
            >
              {book.judul}
            </h2>
            <p className="text-xs text-[#4A5D54]">
              Penulis: {book.penulis} {book.lisensi ? `· ${book.lisensi}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onRecordReading({
                  bookId: book.id,
                  lastPage: pageIdx,
                  totalPages: pages.length,
                  toggleFavorite: true,
                })
              }
              aria-pressed={isFavorite}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                isFavorite
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#F2F6F4]'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Difavoritkan' : 'Favorit'}
            </button>

            <button
              type="button"
              onClick={() => {
                stopSpeech();
                storyAudioEngine.stop();
                setIsMusicPlaying(false);
                onClose();
              }}
              aria-label="Tutup pembaca buku"
              className="rounded-xl border border-[#DCE4DF] bg-white p-2 text-[#4A5D54] hover:bg-[#F2F6F4] hover:text-[#111C17]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Story-Matched Background Music & Instrument Strip */}
        {soundtrack && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8E5] bg-[#F2F6F4] px-5 py-2.5 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white shrink-0"
                style={{ backgroundColor: db.config.accentColor }}
              >
                <Music className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[#111C17] truncate">
                  Musik Cerita: {soundtrack.title}
                </p>
                <p className="text-[11px] text-[#4A5D54] truncate">
                  Instrumen: {soundtrack.instrumentsLabel} · {soundtrack.moodLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <label className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[#4A5D54]">
                <span>Volume</span>
                <input
                  type="range"
                  min={0.08}
                  max={0.55}
                  step={0.05}
                  value={musicVolume}
                  onChange={(e) => {
                    const nextVol = Number(e.target.value);
                    setMusicVolume(nextVol);
                    storyAudioEngine.setVolume(nextVol);
                  }}
                  aria-label="Atur volume musik cerita"
                  className="w-20 accent-[#136B36]"
                />
              </label>

              <button
                type="button"
                onClick={handleToggleMusic}
                aria-pressed={isMusicPlaying}
                style={isMusicPlaying ? { backgroundColor: db.config.accentColor } : { backgroundColor: db.config.primaryColor }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-95 whitespace-nowrap"
              >
                {isMusicPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    Jeda Musik Cerita
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Putar Musik Cerita
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sub-Navigation Tabs inside Reader */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8E5] bg-white px-5 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('read')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'read'
                  ? 'text-white'
                  : 'bg-[#F2F6F4] text-[#4A5D54] hover:text-[#111C17]'
              }`}
              style={activeTab === 'read' ? { backgroundColor: db.config.primaryColor } : undefined}
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Baca Buku ({pageIdx + 1}/{pages.length})
            </button>

            {book.pdfUrl && (
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === 'pdf'
                    ? 'text-white'
                    : 'bg-[#F2F6F4] text-[#4A5D54] hover:text-[#111C17]'
                }`}
                style={activeTab === 'pdf' ? { backgroundColor: db.config.primaryColor } : undefined}
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Materi PDF
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'quiz'
                  ? 'text-white'
                  : 'bg-[#F2F6F4] text-[#4A5D54] hover:text-[#111C17]'
              }`}
              style={activeTab === 'quiz' ? { backgroundColor: db.config.primaryColor } : undefined}
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Kuis Bacaan ({quizQuestions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'journal'
                  ? 'text-white'
                  : 'bg-[#F2F6F4] text-[#4A5D54] hover:text-[#111C17]'
              }`}
              style={activeTab === 'journal' ? { backgroundColor: db.config.accentColor } : undefined}
            >
              <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
              Jurnal & Stempel E-Paspor
            </button>
          </div>

          {/* Font size & Audio controls when in Reading tab */}
          {activeTab === 'read' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-[#DCE4DF] bg-[#F8FAF9] p-0.5 text-[11px]">
                {(
                  [
                    { id: 'normal', label: 'A' },
                    { id: 'large', label: 'A+' },
                    { id: 'xlarge', label: 'A++' },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setFontScale(sz.id)}
                    className={`rounded-md px-2 py-1 font-semibold ${
                      fontScale === sz.id
                        ? 'bg-white text-[#111C17] shadow-xs'
                        : 'text-[#4A5D54]'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleToggleSpeech}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    Hentikan Audio
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" style={{ color: 'var(--brand-primary-ink)' }} aria-hidden="true" />
                    Audio Narasi
                  </>
                )}
              </button>

              <select
                aria-label="Kecepatan suara narasi"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="rounded-lg border border-[#DCE4DF] bg-white px-2 py-1 text-[11px] font-semibold text-[#111C17]"
              >
                <option value={0.9}>0.9x Santai</option>
                <option value={1}>1.0x Normal</option>
                <option value={1.15}>1.15x Cepat</option>
              </select>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {speechMessage && (
            <p className="rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-4 py-2.5 text-xs text-[#4A5D54]">
              {speechMessage}
            </p>
          )}

          {activeTab === 'read' && currentPageData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
                {book.coverUrl && (
                  <div className="md:col-span-4 space-y-2.5">
                    <div className="overflow-hidden rounded-2xl border border-[#E2E8E5] bg-[#F2F6F4]">
                      <img
                        src={book.coverUrl}
                        alt={`Ilustrasi ${book.judul}`}
                        referrerPolicy="no-referrer"
                        className="aspect-4/3 w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-[#E2E8E5] bg-[#F8FAF9] px-3 py-2 text-[11px] text-[#4A5D54]">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <BookmarkCheck className="h-3.5 w-3.5" style={{ color: 'var(--brand-primary-ink)' }} />
                        Penanda otomatis
                      </span>
                      <span className="font-mono-tabular font-semibold text-[#111C17]">
                        Hal {pageIdx + 1}/{pages.length}
                      </span>
                    </div>
                  </div>
                )}

                <div className={book.coverUrl ? 'md:col-span-8 space-y-4' : 'md:col-span-12 space-y-4'}>
                  <div
                    className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
                      isComic
                        ? 'border-2 border-[#DCE4DF] bg-[#F8FAF9]'
                        : 'border-[#E2E8E5] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[#EEF3F0] pb-3">
                      <h3 className="font-display text-base font-bold text-[#111C17] sm:text-lg">
                        {currentPageData.judulBab}
                      </h3>
                      {isComic && (
                        <span
                          className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
                          style={{ backgroundColor: db.config.accentColor }}
                        >
                          Adegan Komik
                        </span>
                      )}
                    </div>

                    <p className={`text-[#111C17] whitespace-pre-line ${fontSizeClass}`}>
                      {currentPageData.isi}
                    </p>

                    {currentPageData.pesanMoral && (
                      <div className="rounded-xl border border-[#DCE4DF] bg-[#F2F6F4] p-4">
                        <p className="text-xs font-bold" style={{ color: 'var(--brand-primary-ink)' }}>
                          Pesan Petualangan Literasi
                        </p>
                        <p className="mt-1 text-sm text-[#111C17]">
                          {currentPageData.pesanMoral}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Page Turning Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={pageIdx === 0}
                      onClick={() => handleTurnPage(pageIdx - 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] disabled:opacity-45"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      Halaman Sebelumnya
                    </button>

                    <div className="flex items-center gap-1.5">
                      {pages.map((p, idx) => (
                        <button
                          key={p.judulBab}
                          type="button"
                          onClick={() => handleTurnPage(idx)}
                          aria-label={`Buka halaman ${idx + 1}`}
                          className={`h-7 min-w-7 rounded-lg px-2 font-mono-tabular text-xs font-bold transition-colors ${
                            idx === pageIdx
                              ? 'text-white'
                              : 'border border-[#DCE4DF] bg-white text-[#4A5D54] hover:text-[#111C17]'
                          }`}
                          style={idx === pageIdx ? { backgroundColor: db.config.primaryColor } : undefined}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    {pageIdx < pages.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => handleTurnPage(pageIdx + 1)}
                        style={{ backgroundColor: db.config.primaryColor }}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                      >
                        Halaman Berikutnya
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab('quiz')}
                        style={{ backgroundColor: db.config.accentColor }}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                      >
                        Lanjut ke Kuis & E-Paspor
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && book.pdfUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#111C17]">
                  Dokumen Materi Bacaan: {book.pdfNamaFile || book.judul}
                </p>
                <a
                  href={book.pdfUrl}
                  download={book.pdfNamaFile || `${book.kodeBuku}.pdf`}
                  className="rounded-lg border border-[#DCE4DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
                >
                  Unduh PDF Berizin
                </a>
              </div>
              <iframe
                title={`PDF ${book.judul}`}
                src={book.pdfUrl}
                className="h-[460px] w-full rounded-xl border border-[#DCE4DF] bg-white"
              />
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#111C17]">
                    Kuis Pemahaman Bacaan
                  </h3>
                  <p className="text-xs text-[#4A5D54]">
                    Jawab pertanyaan berikut untuk menguji pemahamanmu sebelum mencatat E-Paspor Baca.
                  </p>
                </div>
                {quizSubmitted && (
                  <span
                    className="rounded-xl px-3.5 py-1.5 font-mono-tabular text-xs font-bold text-white"
                    style={{ backgroundColor: db.config.primaryColor }}
                  >
                    Skor Kamu: {quizPercent}% ({quizCorrectCount}/{quizQuestions.length})
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={q.pertanyaan}
                    className="rounded-2xl border border-[#E2E8E5] bg-[#F8FAF9] p-4 space-y-3"
                  >
                    <p className="text-sm font-bold text-[#111C17]">
                      {qIdx + 1}. {q.pertanyaan}
                    </p>
                    <div className="space-y-2">
                      {q.pilihan.map((opt, optIdx) => {
                        const selected = answers[qIdx] === optIdx;
                        const isCorrectChoice = optIdx === q.jawabanBenar;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                            }
                            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-colors ${
                              quizSubmitted && isCorrectChoice
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                                : quizSubmitted && selected && !isCorrectChoice
                                  ? 'border-red-300 bg-red-50 text-red-800'
                                  : selected
                                    ? 'border-[#136B36] bg-white font-semibold text-[#111C17]'
                                    : 'border-[#DCE4DF] bg-white text-[#4A5D54] hover:text-[#111C17]'
                            }`}
                          >
                            <span>{opt}</span>
                            {selected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <p className="text-xs text-[#4A5D54]">
                        <strong className="text-[#111C17]">Penjelasan:</strong> {q.penjelasan}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setQuizSubmitted(true)}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="rounded-xl px-5 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                >
                  Periksa Jawaban Kuis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('journal')}
                  style={{ backgroundColor: db.config.accentColor }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                >
                  Isi Jurnal & Klaim Stempel E-Paspor
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'journal' && (
            <form onSubmit={handleCompleteReading} className="space-y-5">
              <div className="rounded-2xl border border-[#E2E8E5] bg-[#F8FAF9] p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#111C17]">
                      Jurnal Membaca & Stempel Digital E-Paspor Baca
                    </h3>
                    <p className="text-xs text-[#4A5D54]">
                      Catat bagian favorit atau pesan cerita yang kamu tangkap untuk mendapatkan stempel digital E-Paspor Baca.
                    </p>
                  </div>
                  <Award className="h-6 w-6 shrink-0" style={{ color: 'var(--brand-accent-ink)' }} />
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-[#111C17]">
                    Penilaian Cerita (Bintang)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setStarRating(star)}
                        aria-label={`Beri ${star} bintang`}
                        className="rounded-lg p-1 hover:bg-white"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= starRating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-[#CBD6D0]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="journal-note" className="block text-xs font-semibold text-[#111C17]">
                    Catatan atau Kesan Pembaca
                  </label>
                  <textarea
                    id="journal-note"
                    rows={3}
                    value={journalNote}
                    onChange={(e) => setJournalNote(e.target.value)}
                    placeholder="Contoh: Bagian favoritku adalah saat tokoh bekerja sama menolong sahabatnya!"
                    className="mt-1.5 w-full rounded-xl border border-[#DCE4DF] bg-white px-3.5 py-2.5 text-sm text-[#111C17] focus:border-[#136B36] focus:outline-none"
                  />
                </div>

                {completedNotice ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-900 space-y-2">
                    <p>{completedNotice}</p>
                    {!session && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLogin();
                        }}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] border border-[#DCE4DF]"
                      >
                        Masuk Akun Anggota Sekarang
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {!session && (
                      <p className="text-xs text-[#4A5D54]">
                        Sedang membaca sebagai tamu. Masuk akun anggota agar +5 poin langsung masuk ke E-Paspor.
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      style={{ backgroundColor: db.config.primaryColor }}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                    >
                      <Award className="h-4 w-4" aria-hidden="true" />
                      {saving
                        ? 'Menyimpan...'
                        : 'Selesaikan & Dapatkan Stempel E-Paspor (+5 Poin)'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Contextual Book Recommendations inside Reader */}
          {recommendedBooks.length > 0 && (
            <section className="border-t border-[#E2E8E5] pt-5 space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#111C17]">
                <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--brand-accent-ink)' }} />
                Rekomendasi Bacaan Berikutnya Untukmu
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {recommendedBooks.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => onSwitchBook(rec)}
                    className="flex items-center gap-3 rounded-xl border border-[#E2E8E5] bg-[#F8FAF9] p-3 text-left transition-colors hover:border-[#BFD0C7]"
                  >
                    {rec.coverUrl && (
                      <img
                        src={rec.coverUrl}
                        alt={rec.judul}
                        referrerPolicy="no-referrer"
                        className="h-14 w-16 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                        {rec.kategori} · {rec.estimasiMenit ?? 5} mnt
                      </p>
                      <p className="font-display text-sm font-bold text-[#111C17] truncate">
                        {rec.judul}
                      </p>
                      <p className="text-xs text-[#4A5D54] truncate">{rec.penulis}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
