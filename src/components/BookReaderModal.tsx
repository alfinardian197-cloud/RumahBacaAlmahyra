import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
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
} from 'lucide-react';
import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  ReadingProgress,
} from '../types/almahyra';
import {
  buildFlipbookPages,
  getBookQuizQuestions,
  getFlipbookSpreadNarrationText,
  isBookActive,
  type LocalDigitalPassportState,
} from '../utils/almahyra';
import {
  getStorySoundtrackProfile,
  storyAudioEngine,
} from '../utils/storyAudioEngine';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { RealActionMissionCard } from './RealActionMissionCard';
import { ResilientImage } from './ResilientImage';
import {
  StoryFlipbookReader,
  type StoryFlipbookHandle,
} from './StoryFlipbookReader';

interface BookReaderModalProps {
  book: Book | null;
  db: AlmahyraDatabase;
  session: AuthSession | null;
  progress?: ReadingProgress;
  localPassport?: LocalDigitalPassportState;
  onClose: () => void;
  onSwitchBook: (book: Book) => void;
  onOpenLogin: () => void;
  onQuickClaimStamp?: (book: Book) => { alreadyClaimed: boolean };
  onClaimRealAction?: (book: Book, note?: string) => { alreadyClaimed: boolean };
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
  localPassport,
  onClose,
  onSwitchBook,
  onOpenLogin,
  onQuickClaimStamp,
  onClaimRealAction,
  onRecordReading,
}: BookReaderModalProps) {
  const flipPages = useMemo(() => (book ? buildFlipbookPages(book) : []), [book]);
  const quizQuestions = useMemo(() => (book ? getBookQuizQuestions(book) : []), [book]);
  const soundtrack = useMemo(
    () =>
      book
        ? getStorySoundtrackProfile(book.kategori, book.judul, book.deskripsi)
        : null,
    [book],
  );

  const modalRootRef = useRef<HTMLDivElement | null>(null);
  const flipbookRef = useRef<StoryFlipbookHandle | null>(null);

  const [activeTab, setActiveTab] = useState<ReaderTab>('read');
  const [pageIdx, setPageIdx] = useState(0);
  const [isFlipbookPortrait, setIsFlipbookPortrait] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('large');
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
  const [quickClaimNotice, setQuickClaimNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const handleExitReader = useCallback(() => {
    stopSpeech();
    storyAudioEngine.stop();
    setIsMusicPlaying(false);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    onClose();
  }, [onClose, stopSpeech]);

  useEffect(() => {
    if (!book) {
      storyAudioEngine.stop();
      setIsMusicPlaying(false);
      return;
    }
    // Selalu buka dari Sampul Depan tertutup sesuai konsep Flipbook Interaktif
    setPageIdx(0);
    setActiveTab('read');
    setAnswers({});
    setQuizSubmitted(false);
    setJournalNote('');
    setStarRating(5);
    setCompletedNotice('');
    setQuickClaimNotice('');
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
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
      storyAudioEngine.stop();
    };
  }, [stopSpeech]);

  const handleFlipPageChange = useCallback(
    async (nextIdx: number, portraitFlag: boolean) => {
      if (!book) return;
      stopSpeech();
      setIsFlipbookPortrait(portraitFlag);
      const clamped = Math.max(0, Math.min(flipPages.length - 1, nextIdx));
      setPageIdx(clamped);
      await onRecordReading({
        bookId: book.id,
        lastPage: clamped,
        totalPages: flipPages.length,
      });
    },
    [book, flipPages.length, onRecordReading, stopSpeech],
  );

  const handleToggleFullscreen = useCallback(() => {
    const targetEl = modalRootRef.current;
    if (typeof document === 'undefined' || !targetEl) {
      setIsFullscreen((prev) => !prev);
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => setIsFullscreen(false));
    } else if (typeof targetEl.requestFullscreen === 'function') {
      void targetEl
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen((prev) => !prev));
    } else {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    if (!book) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => setIsFullscreen(false));
          return;
        }
        handleExitReader();
        return;
      }
      if (isTyping || activeTab !== 'read') return;
      if (e.key === 'ArrowRight' && pageIdx < flipPages.length - 1) {
        flipbookRef.current?.flipNext();
      } else if (e.key === 'ArrowLeft' && pageIdx > 0) {
        flipbookRef.current?.flipPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, book, flipPages.length, handleExitReader, pageIdx]);

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

  const isFavorite = Boolean(progress?.isFavorite);
  const existingRealActionRecord = localPassport?.realActionMissions?.find(
    (m) => m.bookId === book.id,
  );

  const handleRealActionClaim = (targetBook: Book, note?: string) => {
    if (onClaimRealAction) {
      return onClaimRealAction(targetBook, note);
    }
    return { alreadyClaimed: false };
  };

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

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechMessage('Peramban ini belum mendukung audio narasi otomatis.');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const narrationText = getFlipbookSpreadNarrationText(
      book,
      flipPages,
      pageIdx,
      isFlipbookPortrait,
    );
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

  const handleQuickClaimButton = async () => {
    setSaving(true);
    try {
      const localRes = onQuickClaimStamp
        ? onQuickClaimStamp(book)
        : { alreadyClaimed: false };
      await onRecordReading({
        bookId: book.id,
        lastPage: flipPages.length - 1,
        totalPages: flipPages.length,
        completed: true,
        quizScore: quizSubmitted ? quizPercent : undefined,
        journalNote:
          journalNote.trim() ||
          `Selesai membaca "${book.judul}" (${book.kategori}) dengan gembira.`,
        starRating,
        awardPoints: 5,
      });
      setQuickClaimNotice(
        localRes.alreadyClaimed
          ? `Stempel buku "${book.judul}" sudah tersimpan di Paspor Baca Digitalmu!`
          : `Hore! Stempel "${book.judul}" (+5 poin) berhasil diklaim dan tersimpan di Paspor Baca Digital!`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteReading = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (onQuickClaimStamp) {
        onQuickClaimStamp(book);
      }
      await onRecordReading({
        bookId: book.id,
        lastPage: flipPages.length - 1,
        totalPages: flipPages.length,
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
          : 'Stempel & catatan baca tersimpan ke Paspor Baca Digital! Buka tab Paspor & Kuis untuk melihat koleksimu.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={modalRootRef}
      className="fixed inset-0 z-50 flex h-dvh w-screen flex-col overflow-hidden bg-[#FBF7EE] text-[#1C2820] dark:bg-[#0C1611] dark:text-[#ECF3EE]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-modal-title"
    >
      {/* Top Distraction-Free Reader Header */}
      <header className="shrink-0 border-b border-[#E3DCCB] bg-[#F3EFE4]/95 px-3 py-2.5 sm:px-6 sm:py-3 dark:border-[#243B30] dark:bg-[#13221B]/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2.5">
          {/* Left: Back Button & Compact Meta */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleExitReader}
              aria-label="Kembali keluar dari mode membaca"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#D4CCB8] bg-[#FFFDF7] px-3 py-1.5 text-xs sm:text-sm font-bold text-[#1C2820] shadow-xs transition-colors hover:bg-[#ECE6D8] dark:border-[#2D473B] dark:bg-[#1A2D24] dark:text-[#ECF3EE] dark:hover:bg-[#21382D]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Kembali</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#546358] dark:text-[#A4B9AE] min-w-0">
              <span className="font-mono-tabular font-semibold">{book.kodeBuku}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold truncate" style={{ color: 'var(--brand-primary-ink)' }}>
                {book.kategori}
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{book.jenjangPembaca ?? 'Semua Usia'}</span>
            </div>
          </div>

          {/* Center/Right: Mode Tabs & Quick Actions */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[#DFD7C4] bg-[#ECE6D8] p-0.5 dark:border-[#243B30] dark:bg-[#0F1C16]">
              <button
                type="button"
                onClick={() => setActiveTab('read')}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === 'read'
                    ? 'text-white shadow-xs'
                    : 'text-[#4B5A50] hover:text-[#1C2820] dark:text-[#A4B9AE] dark:hover:text-white'
                }`}
                style={activeTab === 'read' ? { backgroundColor: db.config.primaryColor } : undefined}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Cerita</span>
              </button>

              {book.pdfUrl && (
                <button
                  type="button"
                  onClick={() => setActiveTab('pdf')}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === 'pdf'
                      ? 'text-white shadow-xs'
                      : 'text-[#4B5A50] hover:text-[#1C2820] dark:text-[#A4B9AE] dark:hover:text-white'
                  }`}
                  style={activeTab === 'pdf' ? { backgroundColor: db.config.primaryColor } : undefined}
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>PDF</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === 'quiz'
                    ? 'text-white shadow-xs'
                    : 'text-[#4B5A50] hover:text-[#1C2820] dark:text-[#A4B9AE] dark:hover:text-white'
                }`}
                style={activeTab === 'quiz' ? { backgroundColor: db.config.primaryColor } : undefined}
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kuis</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === 'journal'
                    ? 'text-white shadow-xs'
                    : 'text-[#4B5A50] hover:text-[#1C2820] dark:text-[#A4B9AE] dark:hover:text-white'
                }`}
                style={activeTab === 'journal' ? { backgroundColor: db.config.accentColor } : undefined}
              >
                <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">E-Paspor</span>
              </button>
            </div>

            {activeTab === 'read' && (
              <div className="hidden md:inline-flex items-center rounded-xl border border-[#DFD7C4] bg-[#FFFDF7] p-0.5 text-[11px] dark:border-[#243B30] dark:bg-[#162720]">
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
                    aria-label={`Ukuran huruf ${sz.label}`}
                    className={`rounded-lg px-2 py-1 font-bold transition-colors ${
                      fontScale === sz.id
                        ? 'bg-[#136B36] text-white'
                        : 'text-[#546358] dark:text-[#A4B9AE]'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                onRecordReading({
                  bookId: book.id,
                  lastPage: pageIdx,
                  totalPages: flipPages.length,
                  toggleFavorite: true,
                })
              }
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                isFavorite
                  ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200'
                  : 'border-[#D4CCB8] bg-[#FFFDF7] text-[#1C2820] hover:bg-[#ECE6D8] dark:border-[#2D473B] dark:bg-[#1A2D24] dark:text-[#ECF3EE]'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden lg:inline">{isFavorite ? 'Difavoritkan' : 'Favorit'}</span>
            </button>
          </div>
        </div>

        {/* Story-Matched Background Music & Narration Sub-Strip */}
        {soundtrack && (
          <div className="mx-auto mt-2 flex max-w-6xl flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DFD7C4] bg-[#FFFDF7]/90 px-3 py-1.5 text-xs dark:border-[#243B30] dark:bg-[#162720]/90">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-lg text-white shrink-0"
                style={{ backgroundColor: db.config.accentColor }}
              >
                <Music className="h-3 w-3" aria-hidden="true" />
              </span>
              <div className="min-w-0 truncate">
                <span className="font-semibold text-[#1C2820] dark:text-[#ECF3EE]">
                  Musik Cerita: {soundtrack.title}
                </span>
                <span className="hidden sm:inline text-[#546358] dark:text-[#A4B9AE]">
                  {' '}· Instrumen: {soundtrack.instrumentsLabel} ({soundtrack.moodLabel})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-[#546358] dark:text-[#A4B9AE]">
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
                  className="w-16 accent-[#136B36]"
                />
              </label>

              <button
                type="button"
                onClick={handleToggleMusic}
                aria-pressed={isMusicPlaying}
                style={
                  isMusicPlaying
                    ? { backgroundColor: db.config.accentColor }
                    : { backgroundColor: db.config.primaryColor }
                }
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-95 whitespace-nowrap"
              >
                {isMusicPlaying ? (
                  <>
                    <Pause className="h-3 w-3" aria-hidden="true" />
                    Jeda Musik Cerita
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" aria-hidden="true" />
                    Putar Musik Cerita
                  </>
                )}
              </button>

              {activeTab === 'read' && (
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  aria-pressed={isSpeaking}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4CCB8] bg-[#F3EFE4] px-3 py-1 text-[11px] font-bold text-[#1C2820] hover:bg-[#E7E1D2] dark:border-[#2D473B] dark:bg-[#1E3329] dark:text-[#ECF3EE]"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                      Hentikan Suara
                    </>
                  ) : (
                    <>
                      <Volume2
                        className="h-3.5 w-3.5"
                        style={{ color: 'var(--brand-primary-ink)' }}
                        aria-hidden="true"
                      />
                      Bacakan Cerita
                    </>
                  )}
                </button>
              )}

              {activeTab === 'read' && (
                <select
                  aria-label="Kecepatan suara narasi"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="hidden sm:block rounded-lg border border-[#D4CCB8] bg-[#F3EFE4] px-1.5 py-1 text-[11px] font-semibold text-[#1C2820] dark:border-[#2D473B] dark:bg-[#1E3329] dark:text-[#ECF3EE]"
                >
                  <option value={0.9}>0.9x Santai</option>
                  <option value={1}>1.0x Normal</option>
                  <option value={1.15}>1.15x Cepat</option>
                </select>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Stage */}
      {activeTab === 'read' && flipPages.length > 0 ? (
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {(speechMessage || quickClaimNotice) && (
            <div className="shrink-0 bg-[#F3EFE4] px-3 py-2 sm:px-6 space-y-1.5 border-b border-[#E3DCCB] dark:bg-[#13221B] dark:border-[#243B30]">
              {speechMessage && (
                <p className="mx-auto max-w-6xl rounded-xl border border-[#DFD7C4] bg-[#FFFDF7] px-3.5 py-1.5 text-xs text-[#4B5A50] dark:border-[#243B30] dark:bg-[#162720] dark:text-[#A4B9AE]">
                  {speechMessage}
                </p>
              )}
              {quickClaimNotice && (
                <div
                  role="status"
                  className="animate-celebrate-pop mx-auto max-w-6xl flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-200"
                >
                  <Award className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                  <span>{quickClaimNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* Mobile compact font-scale strip */}
          <div className="shrink-0 flex items-center justify-between gap-2 border-b border-[#E3DCCB] bg-[#F7F3E8] px-3 py-1.5 md:hidden dark:border-[#243B30] dark:bg-[#101F18]">
            <span className="text-[11px] font-semibold text-[#546358] dark:text-[#A4B9AE]">
              {book.kategori} · {book.estimasiMenit ?? 5} mnt
            </span>
            <div className="inline-flex items-center rounded-lg border border-[#DFD7C4] bg-[#FFFDF7] p-0.5 text-[11px] dark:border-[#243B30] dark:bg-[#162720]">
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
                  className={`rounded-md px-2 py-0.5 font-bold ${
                    fontScale === sz.id
                      ? 'bg-[#047857] text-white'
                      : 'text-[#546358] dark:text-[#A4B9AE]'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          <StoryFlipbookReader
            ref={flipbookRef}
            book={book}
            flipPages={flipPages}
            currentPageIndex={pageIdx}
            savedBookmarkPage={progress?.lastPage ?? 0}
            fontScale={fontScale}
            primaryColor={db.config.primaryColor}
            accentColor={db.config.accentColor}
            existingRealActionRecord={existingRealActionRecord}
            savingStamp={saving}
            isFullscreen={isFullscreen}
            recommendedBooks={recommendedBooks}
            onPageChange={handleFlipPageChange}
            onOrientationChange={setIsFlipbookPortrait}
            onQuickClaimStamp={handleQuickClaimButton}
            onClaimRealAction={handleRealActionClaim}
            onOpenQuiz={() => setActiveTab('quiz')}
            onSwitchBook={onSwitchBook}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </main>
      ) : (
        /* Non-Reading Tabs (PDF, Quiz, Journal & E-Paspor) */
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="rounded-2xl border border-[#E2DAC8] bg-[#FFFDF7] px-5 py-3.5 dark:border-[#243B30] dark:bg-[#122019]">
              <h2
                id="reader-modal-title"
                className="font-display text-lg sm:text-xl font-bold text-[#16221A] dark:text-[#F1F7F3]"
              >
                {book.judul}
              </h2>
              <p className="text-xs text-[#546358] dark:text-[#A4B9AE]">
                Penulis: {book.penulis} {book.lisensi ? `· ${book.lisensi}` : ''}
              </p>
            </div>

            {activeTab === 'pdf' && book.pdfUrl && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#1C2820] dark:text-[#ECF3EE]">
                    Dokumen Materi Bacaan: {book.pdfNamaFile || book.judul}
                  </p>
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={book.pdfNamaFile || `${book.kodeBuku}.pdf`}
                    className="rounded-lg border border-[#D4CCB8] bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#1C2820] hover:bg-[#F3EFE4] dark:border-[#2D473B] dark:bg-[#1A2D24] dark:text-[#ECF3EE]"
                  >
                    Buka / Unduh PDF Berizin
                  </a>
                </div>
                {book.pdfUrl.startsWith('data:') ? (
                  <iframe
                    title={`PDF ${book.judul}`}
                    src={book.pdfUrl}
                    className="h-[62dvh] w-full rounded-2xl border border-[#DFD7C4] bg-white dark:border-[#243B30]"
                  />
                ) : (
                  <div className="rounded-2xl border border-[#DFD7C4] bg-[#FFFDF7] p-6 sm:p-8 text-center space-y-4 dark:border-[#243B30] dark:bg-[#122019]">
                    <p className="font-display text-base sm:text-lg font-bold text-[#16221A] dark:text-[#F1F7F3]">
                      Sumber Resmi Dokumen PDF Tersedia
                    </p>
                    <p className="mx-auto max-w-xl text-sm text-[#4B5A50] dark:text-[#A4B9AE]">
                      Dokumen PDF lengkap dari {book.lisensi || 'penerbit resmi'} dapat dibuka langsung di tab baru atau dibaca halaman demi halaman melalui tab Cerita di atas.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                      <a
                        href={book.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: db.config.primaryColor }}
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-95"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Buka PDF Resmi di Tab Baru
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveTab('read')}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#D4CCB8] bg-[#F3EFE4] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1C2820] hover:bg-[#E7E1D2] dark:border-[#2D473B] dark:bg-[#1A2D24] dark:text-[#ECF3EE]"
                      >
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                        Kembali ke Bacaan Interaktif
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#16221A] dark:text-[#F1F7F3]">
                      Kuis Pemahaman Bacaan
                    </h3>
                    <p className="text-xs text-[#546358] dark:text-[#A4B9AE]">
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
                      className="rounded-2xl border border-[#DFD7C4] bg-[#FFFDF7] p-4 sm:p-5 space-y-3 dark:border-[#243B30] dark:bg-[#122019]"
                    >
                      <p className="text-sm sm:text-base font-bold text-[#16221A] dark:text-[#F1F7F3]">
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
                              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium transition-colors ${
                                quizSubmitted && isCorrectChoice
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-200'
                                  : quizSubmitted && selected && !isCorrectChoice
                                    ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200'
                                    : selected
                                      ? 'border-[#136B36] bg-[#F3EFE4] font-semibold text-[#16221A] dark:bg-[#1A2D24] dark:text-white'
                                      : 'border-[#DFD7C4] bg-[#FBF7EE] text-[#4B5A50] hover:text-[#16221A] dark:border-[#243B30] dark:bg-[#0F1C16] dark:text-[#A4B9AE]'
                              }`}
                            >
                              <span>{opt}</span>
                              {selected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <p className="text-xs text-[#4B5A50] dark:text-[#A4B9AE]">
                          <strong className="text-[#16221A] dark:text-[#F1F7F3]">Penjelasan:</strong>{' '}
                          {q.penjelasan}
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
              <div className="space-y-6">
                <RealActionMissionCard
                  book={book}
                  existingRecord={existingRealActionRecord}
                  onClaimRealAction={handleRealActionClaim}
                />

                <form onSubmit={handleCompleteReading} className="space-y-5">
                <div className="rounded-2xl border border-[#DFD7C4] bg-[#FFFDF7] p-5 space-y-4 dark:border-[#243B30] dark:bg-[#122019]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#16221A] dark:text-[#F1F7F3]">
                        Jurnal Membaca & Stempel Digital E-Paspor Baca
                      </h3>
                      <p className="text-xs text-[#546358] dark:text-[#A4B9AE]">
                        Catat bagian favorit atau pesan cerita yang kamu tangkap untuk mendapatkan stempel digital E-Paspor Baca.
                      </p>
                    </div>
                    <Award className="h-6 w-6 shrink-0" style={{ color: 'var(--brand-accent-ink)' }} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-[#16221A] dark:text-[#F1F7F3]">
                      Penilaian Cerita (Bintang)
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setStarRating(star)}
                          aria-label={`Beri ${star} bintang`}
                          className="rounded-lg p-1 hover:bg-[#F3EFE4] dark:hover:bg-[#1A2D24]"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= starRating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-[#CBD6D0] dark:text-[#3A5246]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="journal-note"
                      className="block text-xs font-semibold text-[#16221A] dark:text-[#F1F7F3]"
                    >
                      Catatan atau Kesan Pembaca
                    </label>
                    <textarea
                      id="journal-note"
                      rows={3}
                      value={journalNote}
                      onChange={(e) => setJournalNote(e.target.value)}
                      placeholder="Contoh: Bagian favoritku adalah saat tokoh bekerja sama menolong sahabatnya!"
                      className="mt-1.5 w-full rounded-xl border border-[#DFD7C4] bg-[#FBF7EE] px-3.5 py-2.5 text-sm text-[#16221A] focus:border-[#136B36] focus:outline-none dark:border-[#243B30] dark:bg-[#0F1C16] dark:text-[#ECF3EE]"
                    />
                  </div>

                  {completedNotice ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-900 space-y-2 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <p>{completedNotice}</p>
                      {!session && (
                        <button
                          type="button"
                          onClick={() => {
                            handleExitReader();
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
                        <p className="text-xs text-[#546358] dark:text-[#A4B9AE]">
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
              </div>
            )}

            {/* Contextual Book Recommendations inside Quiz / Journal / PDF */}
            {recommendedBooks.length > 0 && (
              <section className="border-t border-[#E3DCCB] pt-5 space-y-3 dark:border-[#243B30]">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#16221A] dark:text-[#F1F7F3]">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--brand-accent-ink)' }} />
                  Rekomendasi Bacaan Berikutnya Untukmu
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {recommendedBooks.map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onSwitchBook(rec)}
                      className="flex items-center gap-3 rounded-xl border border-[#DFD7C4] bg-[#FFFDF7] p-3 text-left transition-colors hover:border-[#BFD0C7] dark:border-[#243B30] dark:bg-[#122019]"
                    >
                      <div className="h-14 w-16 overflow-hidden rounded-lg shrink-0 bg-[#EDF3EF] p-0.5">
                        {rec.coverUrl ? (
                          <ResilientImage
                            src={rec.coverUrl}
                            alt={`Sampul ${rec.judul}`}
                            loading="eager"
                            className="h-full w-full object-contain"
                            renderFallback={() => <CustomBookCoverSvg book={rec} />}
                          />
                        ) : (
                          <CustomBookCoverSvg book={rec} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[11px] font-semibold"
                          style={{ color: 'var(--brand-primary-ink)' }}
                        >
                          {rec.kategori} · {rec.estimasiMenit ?? 5} mnt
                        </p>
                        <p className="font-display text-sm font-bold text-[#16221A] dark:text-[#F1F7F3] truncate">
                          {rec.judul}
                        </p>
                        <p className="text-xs text-[#546358] dark:text-[#A4B9AE] truncate">
                          {rec.penulis}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
      )}

      {/* Bottom Sticky Page Navigation Footer */}
      {activeTab === 'read' && (
        <footer className="shrink-0 border-t border-[#E3DCCB] bg-[#F3EFE4]/95 px-3 py-2.5 sm:px-8 sm:py-3 dark:border-[#243B30] dark:bg-[#13221B]/95">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4">
            <button
              type="button"
              disabled={pageIdx === 0}
              onClick={() => flipbookRef.current?.flipPrev()}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#D4CCB8] bg-[#FFFDF7] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#1C2820] hover:bg-[#ECE6D8] disabled:opacity-40 dark:border-[#2D473B] dark:bg-[#1A2D24] dark:text-[#ECF3EE] whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Halaman Sebelumnya</span>
              <span className="sm:hidden">Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto px-1">
              <span className="text-xs font-semibold text-[#546358] dark:text-[#A4B9AE] sm:hidden font-mono-tabular whitespace-nowrap">
                Hal {pageIdx + 1} / {flipPages.length}
              </span>
              <div className="hidden sm:flex items-center gap-1.5">
                {flipPages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => flipbookRef.current?.flipToPage(idx)}
                    aria-label={`Buka ${p.tocTitle}`}
                    aria-current={idx === pageIdx ? 'page' : undefined}
                    className={`h-8 min-w-8 rounded-lg px-2.5 font-mono-tabular text-xs font-bold transition-colors ${
                      idx === pageIdx
                        ? 'text-white shadow-xs'
                        : 'border border-[#D4CCB8] bg-[#FFFDF7] text-[#4B5A50] hover:text-[#1C2820] dark:border-[#2D473B] dark:bg-[#1A2D24] dark:text-[#A4B9AE]'
                    }`}
                    style={idx === pageIdx ? { backgroundColor: db.config.primaryColor } : undefined}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleQuickClaimButton}
                style={{ backgroundColor: db.config.accentColor }}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-extrabold text-[#10281B] hover:opacity-95 disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Selesai Baca &amp; Klaim Stempel</span>
              </button>

              {pageIdx < flipPages.length - 1 ? (
                <button
                  type="button"
                  onClick={() => flipbookRef.current?.flipNext()}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  <span className="hidden sm:inline">Halaman Berikutnya</span>
                  <span className="sm:hidden">Berikutnya</span>
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
                >
                  <span className="hidden sm:inline">Buka Kuis Cerita</span>
                  <span className="sm:hidden">Kuis Cerita</span>
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
