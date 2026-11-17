import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { PageFlip } from 'page-flip';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Book } from '../types/almahyra';
import {
  getFlipbookVisibleIndices,
  type FlipbookPageEntry,
} from '../utils/almahyra';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { ResilientImage } from './ResilientImage';

export interface StoryFlipbookHandle {
  flipNext: () => void;
  flipPrev: () => void;
  flipToPage: (pageIdx: number) => void;
}

interface StoryFlipbookReaderProps {
  book: Book;
  flipPages: FlipbookPageEntry[];
  currentPageIndex: number;
  savedBookmarkPage?: number;
  fontScale: 'normal' | 'large' | 'xlarge';
  primaryColor: string;
  accentColor: string;
  isFullscreen: boolean;
  onPageChange: (nextIdx: number, isPortrait: boolean) => void;
  onOrientationChange?: (isPortrait: boolean) => void;
  onToggleFullscreen: () => void;
}

interface PortalMountState {
  containers: HTMLElement[];
  signature: string;
}

function getPreferredIsPortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const StoryFlipbookReader = forwardRef<
  StoryFlipbookHandle,
  StoryFlipbookReaderProps
>(function StoryFlipbookReader(
  {
    book,
    flipPages,
    currentPageIndex,
    savedBookmarkPage = 0,
    fontScale,
    primaryColor,
    accentColor,
    isFullscreen,
    onPageChange,
    onOrientationChange,
    onToggleFullscreen,
  },
  ref,
) {
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const flipMountHostRef = useRef<HTMLDivElement | null>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const [isPortrait, setIsPortrait] = useState<boolean>(getPreferredIsPortrait);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [stageDims, setStageDims] = useState<{ w: number; h: number }>({
    w: 960,
    h: 580,
  });
  const [portalMount, setPortalMount] = useState<PortalMountState | null>(null);

  // Track responsive portrait (<768px) vs desktop 2-page spread (>=768px)
  useEffect(() => {
    const handleResize = () => {
      const nextPortrait = getPreferredIsPortrait();
      setIsPortrait((prev) => {
        if (prev !== nextPortrait) {
          onOrientationChange?.(nextPortrait);
        }
        return nextPortrait;
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onOrientationChange]);

  // Observe available stage dimensions so the open book always scales cleanly inside one screen
  useEffect(() => {
    const el = stageViewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setStageDims({
        w: Math.max(280, Math.floor(rect.width)),
        h: Math.max(320, Math.floor(rect.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pagesSignature = useMemo(
    () => `${book.id}:${flipPages.length}:${isPortrait ? 'P' : 'L'}`,
    [book.id, flipPages.length, isPortrait],
  );

  // Mount & manage StPageFlip in a DOM-isolated container with React Portals inside each page wrapper
  useEffect(() => {
    const hostEl = flipMountHostRef.current;
    if (!hostEl || flipPages.length === 0) return;

    const bookBlock = document.createElement('div');
    bookBlock.className = 'w-full h-full mx-auto';
    hostEl.innerHTML = '';
    hostEl.appendChild(bookBlock);

    const wrappers: HTMLElement[] = flipPages.map((p) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'almahyra-flip-page h-full w-full overflow-hidden';
      pageEl.dataset.density = p.density;
      return pageEl;
    });

    // Prevent StPageFlip drag/flip handlers from swallowing clicks inside interactive buttons or links
    const stopInteractiveEvent = (evt: Event) => {
      const target = evt.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('button, a, [data-no-flip="true"]')) {
        evt.stopPropagation();
      }
    };
    bookBlock.addEventListener('mousedown', stopInteractiveEvent, { capture: true });
    bookBlock.addEventListener('touchstart', stopInteractiveEvent, { capture: true });

    const reducedMotion = getPrefersReducedMotion();
    const startAt =
      currentPageIndex > 0 && currentPageIndex < flipPages.length
        ? currentPageIndex
        : 0;

    // Rasio 500:520 lebih proporsional & lega agar teks cerita mengisi halaman secara penuh tanpa ruang kosong di bawah
    const pf = new PageFlip(bookBlock, {
      width: 500,
      height: 520,
      size: 'stretch',
      minWidth: 260,
      maxWidth: 560,
      minHeight: 320,
      maxHeight: 540,
      startPage: startAt,
      drawShadow: true,
      maxShadowOpacity: 0.32,
      flippingTime: reducedMotion ? 120 : 660,
      showCover: true,
      usePortrait: isPortrait,
      autoSize: true,
      mobileScrollSupport: true,
      clickEventForward: true,
      showPageCorners: true,
      disableFlipByClick: false,
    });

    pf.on('flip', (event: { data: unknown }) => {
      const nextIdx = Number(event.data);
      if (Number.isFinite(nextIdx)) {
        onPageChangeRef.current(nextIdx, isPortrait);
      }
    });

    pf.loadFromHTML(wrappers);
    pageFlipRef.current = pf;
    setPortalMount({ containers: wrappers, signature: pagesSignature });

    const syncRaf = window.requestAnimationFrame(() => {
      pf.update();
    });

    return () => {
      window.cancelAnimationFrame(syncRaf);
      bookBlock.removeEventListener('mousedown', stopInteractiveEvent, {
        capture: true,
      });
      bookBlock.removeEventListener('touchstart', stopInteractiveEvent, {
        capture: true,
      });
      setPortalMount(null);
      pageFlipRef.current = null;
      try {
        pf.destroy();
      } catch {
        // Ignore cleanup errors if DOM already detached
      }
      bookBlock.remove();
    };
  }, [pagesSignature, isPortrait, book.id, flipPages.length]);

  // Update StPageFlip geometry whenever stage resizes or zoom level changes
  useEffect(() => {
    const pf = pageFlipRef.current;
    if (!pf) return;
    const id = window.requestAnimationFrame(() => {
      try {
        pf.update();
      } catch {
        // Ignore resize race
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [stageDims.w, stageDims.h, zoomScale, isFullscreen]);

  const flipNext = useCallback(() => {
    pageFlipRef.current?.flipNext();
  }, []);

  const flipPrev = useCallback(() => {
    pageFlipRef.current?.flipPrev();
  }, []);

  const flipToPage = useCallback(
    (idx: number) => {
      const pf = pageFlipRef.current;
      if (!pf) return;
      const clamped = Math.max(0, Math.min(flipPages.length - 1, idx));
      const reducedMotion = getPrefersReducedMotion();
      if (reducedMotion) {
        pf.turnToPage(clamped);
        onPageChangeRef.current(clamped, isPortrait);
      } else {
        pf.flip(clamped);
      }
      setShowToc(false);
    },
    [flipPages.length, isPortrait],
  );

  useImperativeHandle(
    ref,
    () => ({
      flipNext,
      flipPrev,
      flipToPage,
    }),
    [flipNext, flipPrev, flipToPage],
  );

  // Compute optimal open-book container width fitting within stage dimensions + zoomScale
  const bookContainerWidth = useMemo(() => {
    const horizontalPadding = isPortrait ? 16 : 96;
    const verticalPadding = 20;
    const availW = Math.max(260, stageDims.w - horizontalPadding);
    const availH = Math.max(320, stageDims.h - verticalPadding);
    const singleRatio = 500 / 520;
    const targetAspect = isPortrait ? singleRatio : singleRatio * 2;
    const maxByHeight = Math.floor(availH * targetAspect);
    const baseFit = Math.min(availW, maxByHeight, isPortrait ? 480 : 1040);
    return Math.max(260, Math.min(availW, Math.round(baseFit * zoomScale)));
  }, [isPortrait, stageDims.h, stageDims.w, zoomScale]);

  const visibleIndices = useMemo(
    () => getFlipbookVisibleIndices(currentPageIndex, flipPages.length, isPortrait),
    [currentPageIndex, flipPages.length, isPortrait],
  );

  const spreadLabel = useMemo(() => {
    if (flipPages.length === 0) return '0 / 0';
    if (currentPageIndex === 0) return `Sampul Depan · 1 / ${flipPages.length}`;
    if (currentPageIndex >= flipPages.length - 1) {
      return `Sampul Belakang · ${flipPages.length} / ${flipPages.length}`;
    }
    if (visibleIndices.length === 2) {
      return `Halaman ${visibleIndices[0] + 1}–${visibleIndices[1] + 1} dari ${flipPages.length}`;
    }
    return `Halaman ${currentPageIndex + 1} dari ${flipPages.length}`;
  }, [currentPageIndex, flipPages.length, visibleIndices]);

  // Story typography helpers — scale text slightly fuller on prose-only pages so sheets feel richly filled
  const getStoryTextClass = (hasMediaOrMoral: boolean) => {
    if (fontScale === 'xlarge') {
      return hasMediaOrMoral
        ? 'text-[16px] sm:text-[18px] lg:text-[19px] leading-[1.7]'
        : 'text-[18px] sm:text-[20px] lg:text-[22px] leading-[1.78]';
    }
    if (fontScale === 'large') {
      return hasMediaOrMoral
        ? 'text-[14.5px] sm:text-[16px] lg:text-[17px] leading-[1.68]'
        : 'text-[16.5px] sm:text-[18px] lg:text-[19.5px] leading-[1.76]';
    }
    return hasMediaOrMoral
      ? 'text-[13.5px] sm:text-[14.5px] lg:text-[15.5px] leading-[1.65]'
      : 'text-[15px] sm:text-[16px] lg:text-[17px] leading-[1.74]';
  };

  const isComic = book.kategori === 'Komik Edukasi';
  const atCover = currentPageIndex === 0;
  const atEnd = currentPageIndex >= flipPages.length - 1;

  const tocItems = useMemo(() => {
    return flipPages.map((p) => ({
      index: p.index,
      title: p.tocTitle,
      kind: p.kind,
      active: visibleIndices.includes(p.index),
    }));
  }, [flipPages, visibleIndices]);

  const renderPageContent = (page: FlipbookPageEntry) => {
    // 1. FRONT COVER (Sampul Depan Murni)
    if (page.kind === 'cover') {
      return (
        <div
          className="flipbook-hard-cover relative flex h-full w-full flex-col justify-between overflow-hidden rounded-r-2xl rounded-l-md p-4 sm:p-6 text-white"
          style={{
            background: `linear-gradient(155deg, ${primaryColor} 0%, #064e2b 100%)`,
          }}
        >
          {/* Decorative Left Binding Groove */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/25 via-white/10 to-transparent"
          />

          <div className="relative z-10 flex items-center justify-between gap-2 text-[11px] font-semibold text-emerald-100 pl-2">
            <span className="font-mono-tabular">{book.kodeBuku}</span>
            <span>Rumah Baca Almahyra</span>
          </div>

          {/* Center Book Artwork Frame — fits natural cover ratio without empty sidebars */}
          <div className="relative z-10 my-2 flex flex-1 min-h-0 flex-col items-center justify-center pl-2">
            {book.coverUrl ? (
              <div className="w-fit max-w-full overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-[#05351D]/70 p-1.5 shadow-xl">
                <ResilientImage
                  src={book.coverUrl}
                  alt={`Sampul ${book.judul}`}
                  loading="eager"
                  className="block max-h-[215px] sm:max-h-[245px] w-auto max-w-full rounded-xl object-contain"
                  renderFallback={() => (
                    <div className="aspect-[3/4] w-[155px] sm:w-[175px]">
                      <CustomBookCoverSvg book={book} />
                    </div>
                  )}
                />
              </div>
            ) : (
              <div className="aspect-[3/4] w-[155px] sm:w-[175px] overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-white/10 shadow-xl">
                <CustomBookCoverSvg book={book} />
              </div>
            )}
          </div>

          {/* Title, Author & Buka Buku CTA */}
          <div className="relative z-10 space-y-2 pl-2">
            <p className="text-[11px] sm:text-xs font-semibold text-amber-200 truncate">
              {book.kategori} · {book.jenjangPembaca ?? 'Semua Usia'} ·{' '}
              {book.estimasiMenit ?? 5} mnt
            </p>
            <h2
              id="reader-modal-title"
              className="font-display text-lg sm:text-2xl font-extrabold leading-tight text-white line-clamp-2"
            >
              {book.judul}
            </h2>
            <p className="text-xs text-emerald-100 truncate">
              Penulis: {book.penulis}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => flipToPage(1)}
                style={{ backgroundColor: accentColor }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-extrabold text-[#10281B] shadow-md transition-transform hover:scale-[1.02] whitespace-nowrap shrink-0"
              >
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Buka Buku</span>
              </button>

              {savedBookmarkPage > 0 && savedBookmarkPage < flipPages.length && (
                <button
                  type="button"
                  onClick={() => flipToPage(savedBookmarkPage)}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/35 bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur-xs hover:bg-white/25 whitespace-nowrap shrink-0"
                >
                  <span>Lanjutkan Hal. {savedBookmarkPage + 1}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 2. BACK COVER (Penutup Buku Murni — Tanpa Kuis / Rekomendasi / Klaim Poin)
    if (page.kind === 'back-cover') {
      return (
        <div
          className="flipbook-hard-cover relative flex h-full w-full flex-col justify-between overflow-hidden rounded-l-2xl rounded-r-md p-5 sm:p-7 text-white"
          style={{
            background: `linear-gradient(155deg, #075A32 0%, ${primaryColor} 100%)`,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/25 via-white/10 to-transparent"
          />

          <div className="relative z-10 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-200 pr-2">
            <span>{page.chapterLabel}</span>
            <span>Rumah Baca Almahyra</span>
          </div>

          <div className="relative z-10 my-auto space-y-4 py-2 pr-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/60 bg-white/15 text-amber-200 shadow-md">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold leading-snug text-white">
              {page.heading}
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-emerald-50">
              {page.body}
            </p>
            <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-xs leading-relaxed text-emerald-100">
              Kisah "{book.judul}" telah selesai dibaca. Kamu dapat membalik kembali halaman untuk mengulang cerita atau memilih tab Aktivitas &amp; Info di bilah atas.
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-2 pt-2 pr-2">
            <span className="text-[11px] text-emerald-100 truncate">
              {book.kodeBuku} · {book.penulis}
            </span>
            <button
              type="button"
              onClick={() => flipToPage(0)}
              style={{ backgroundColor: accentColor }}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold text-[#10281B] shadow-md hover:opacity-95 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Baca Dari Awal</span>
            </button>
          </div>
        </div>
      );
    }

    // 3. INNER SOFT PAPER PAGES (Hanya Opener Pembuka Cerita & Halaman Cerita Murni)
    const hasIllustration =
      page.kind === 'opener' || Boolean(page.hasIllustrationFrame);
    const hasMediaOrMoral = hasIllustration || Boolean(page.moralMessage);

    return (
      <article className="flipbook-paper-sheet relative flex h-full w-full flex-col justify-between p-4 sm:p-6">
        {/* Top Page Running Header */}
        <header className="shrink-0 flex items-center justify-between gap-2 border-b border-[#E7DCC4] pb-2 text-[11px] dark:border-[#244133]">
          <span
            className="font-bold tracking-wide truncate"
            style={{ color: 'var(--brand-primary-ink)' }}
          >
            {page.chapterLabel}
          </span>
          <span className="font-mono-tabular font-semibold text-[#5B6D62] dark:text-[#9BB5A8] whitespace-nowrap">
            Hal. {page.index + 1} / {flipPages.length}
          </span>
        </header>

        {/* Vertically Balanced Middle Reading Body — centers compact passages naturally to eliminate empty bottom voids */}
        <div className="my-2 flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col">
          <div className="my-auto space-y-4 py-1">
            {/* OPENER */}
            {page.kind === 'opener' && (
              <>
                <div className="flex justify-center">
                  {book.coverUrl ? (
                    <div className="w-fit max-w-full overflow-hidden rounded-xl border border-[#DFD4BC] bg-[#EFE8D5] p-1.5 shadow-xs dark:border-[#274436] dark:bg-[#0D1A14]">
                      <ResilientImage
                        src={book.coverUrl}
                        alt={`Ilustrasi pembuka ${book.judul}`}
                        loading="eager"
                        className="block max-h-[165px] sm:max-h-[185px] w-auto max-w-full rounded-lg object-contain"
                        renderFallback={() => (
                          <div className="aspect-[3/4] w-[130px] sm:w-[145px]">
                            <CustomBookCoverSvg book={book} />
                          </div>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] w-[130px] sm:w-[145px] overflow-hidden rounded-xl border border-[#DFD4BC] bg-[#F3ECD9] shadow-xs dark:border-[#274436] dark:bg-[#0D1A14]">
                      <CustomBookCoverSvg book={book} />
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <h2 className="font-display text-lg sm:text-xl font-extrabold leading-snug text-[#16221A] dark:text-[#F1F7F3]">
                    {book.judul}
                  </h2>
                  <p className="text-xs text-[#546358] dark:text-[#A4B9AE]">
                    Penulis: {book.penulis}
                  </p>
                </div>

                <p
                  className={`text-[#212E26] dark:text-[#E2ECE5] first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-display first-letter:text-4xl first-letter:font-extrabold first-letter:leading-[0.86] first-letter:text-[#087C3B] dark:first-letter:text-[#6EE7B7] ${getStoryTextClass(
                    true,
                  )}`}
                >
                  {page.body}
                </p>
              </>
            )}

            {/* PURE STORY PAGE */}
            {page.kind === 'story' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base sm:text-lg font-extrabold leading-snug text-[#16221A] dark:text-[#F1F7F3]">
                    {page.storyPageNumber === 1 ? book.judul : page.chapterLabel}
                  </h3>
                  {page.storyPageNumber === 1 && isComic && (
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold text-[#10281B]"
                      style={{ backgroundColor: accentColor }}
                    >
                      Adegan Komik
                    </span>
                  )}
                </div>

                {page.hasIllustrationFrame && (
                  <div className="flex justify-center">
                    {book.coverUrl ? (
                      <div className="w-fit max-w-full overflow-hidden rounded-xl border border-[#DFD4BC] bg-[#EFE8D5] p-1.5 shadow-xs dark:border-[#274436] dark:bg-[#0D1A14]">
                        <ResilientImage
                          src={book.coverUrl}
                          alt={`Ilustrasi cerita ${book.judul}`}
                          loading="eager"
                          className="block max-h-[160px] sm:max-h-[180px] w-auto max-w-full rounded-lg object-contain"
                          renderFallback={() => (
                            <div className="aspect-[3/4] w-[125px] sm:w-[140px]">
                              <CustomBookCoverSvg book={book} />
                            </div>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] w-[125px] sm:w-[140px] overflow-hidden rounded-xl border border-[#DFD4BC] bg-[#F3ECD9] shadow-xs dark:border-[#274436] dark:bg-[#0D1A14]">
                        <CustomBookCoverSvg book={book} />
                      </div>
                    )}
                  </div>
                )}

                <p
                  className={`whitespace-pre-line font-normal text-[#1E2B22] dark:text-[#E5EFE9] first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-display first-letter:text-4xl sm:first-letter:text-[44px] first-letter:font-extrabold first-letter:leading-[0.86] first-letter:text-[#087C3B] dark:first-letter:text-[#6EE7B7] ${getStoryTextClass(
                    hasMediaOrMoral,
                  )}`}
                >
                  {page.body}
                </p>

                {page.moralMessage && (
                  <div className="rounded-xl border border-[#CEDDC3] bg-[#EFF6E9] p-3.5 dark:border-[#2A4939] dark:bg-[#162B20]">
                    <p
                      className="text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: 'var(--brand-primary-ink)' }}
                    >
                      Pesan Cerita
                    </p>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#1C2820] dark:text-[#ECF3EE]">
                      {page.moralMessage}
                    </p>
                  </div>
                )}

                {/* Subtle botanical storybook flourish when page is pure prose so it reads cleanly with zero clutter */}
                {!hasMediaOrMoral && (
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-center gap-3 pt-2 text-[#B8A98A] dark:text-[#355947]"
                  >
                    <span className="h-px w-12 bg-current opacity-60" />
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-none stroke-current"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.5C9.5 4.8 6.2 4.8 3.5 6v12c2.7-1.2 6-1.2 8.5.5m0-12c2.5-1.7 5.8-1.7 8.5-.5v12c-2.7-1.2-6-1.2-8.5.5m0-12v12"
                      />
                    </svg>
                    <span className="h-px w-12 bg-current opacity-60" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Paper Page Corner Indicator */}
        <footer className="shrink-0 flex items-center justify-between gap-2 border-t border-[#E7DCC4] pt-2 text-[10px] sm:text-[11px] text-[#5B6D62] dark:border-[#244133] dark:text-[#9BB5A8]">
          <span className="truncate">{book.judul}</span>
          <span className="hidden sm:inline whitespace-nowrap">
            Geser atau klik tepi halaman
          </span>
        </footer>
      </article>
    );
  };

  return (
    <div className="flipbook-stage-bg relative flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Compact Flipbook Controls Sub-Bar (Daftar Isi, Indicator, Zoom, Fullscreen) */}
      <div className="shrink-0 border-b border-[#DDD4BE] bg-[#F7F3E8]/90 px-3 py-2 sm:px-6 dark:border-[#213A2E] dark:bg-[#101F18]/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          {/* Left: Table of Contents Popover Trigger + Spread Indicator */}
          <div className="relative flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowToc((prev) => !prev)}
              aria-expanded={showToc}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#D4CCB8] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#1C2820] hover:bg-[#ECE6D8] dark:border-[#2D473B] dark:bg-[#192D24] dark:text-[#ECF3EE] whitespace-nowrap shrink-0"
            >
              <List className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Daftar Isi</span>
            </button>

            <span className="font-mono-tabular text-xs font-semibold text-[#47584D] dark:text-[#B4C9BE] whitespace-nowrap">
              {spreadLabel}
            </span>

            {showToc && (
              <div
                role="menu"
                aria-label="Daftar Isi Buku Flipbook"
                className="absolute left-0 top-11 z-40 w-72 max-h-72 overflow-y-auto rounded-2xl border border-[#D4CCB8] bg-[#FFFDF7] p-2 shadow-xl dark:border-[#2D473B] dark:bg-[#14251D]"
              >
                <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5B6D62] dark:text-[#9BB5A8]">
                  Pilih Halaman Cerita
                </p>
                <div className="space-y-1">
                  {tocItems.map((item) => (
                    <button
                      key={`${item.index}-${item.title}`}
                      type="button"
                      role="menuitem"
                      onClick={() => flipToPage(item.index)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                        item.active
                          ? 'font-bold text-white'
                          : 'font-medium text-[#1C2820] hover:bg-[#F1EAD9] dark:text-[#ECF3EE] dark:hover:bg-[#1C3328]'
                      }`}
                      style={item.active ? { backgroundColor: primaryColor } : undefined}
                    >
                      <span className="truncate pr-2">{item.title}</span>
                      <span className="font-mono-tabular text-[11px] opacity-80 shrink-0">
                        {item.index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Zoom Controls + Fullscreen Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-[#D4CCB8] bg-[#FFFDF7] p-0.5 text-xs dark:border-[#2D473B] dark:bg-[#192D24]">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
                aria-label="Perkecil ukuran buku"
                className="rounded-lg p-1.5 text-[#384A3E] hover:bg-[#ECE6D8] dark:text-[#B9CFC3] dark:hover:bg-[#21382D]"
              >
                <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                aria-label="Ukuran buku normal 100%"
                className="px-2 py-1 font-mono-tabular text-[11px] font-bold text-[#1C2820] dark:text-[#ECF3EE]"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(1.15, Number((z + 0.1).toFixed(2))))}
                aria-label="Perbesar ukuran buku"
                className="rounded-lg p-1.5 text-[#384A3E] hover:bg-[#ECE6D8] dark:text-[#B9CFC3] dark:hover:bg-[#21382D]"
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-pressed={isFullscreen}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#D4CCB8] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#1C2820] hover:bg-[#ECE6D8] dark:border-[#2D473B] dark:bg-[#192D24] dark:text-[#ECF3EE] whitespace-nowrap shrink-0"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden xs:inline">Keluar Layar Penuh</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden xs:inline">Layar Penuh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Central Physical Book Flip Viewport */}
      <div
        ref={stageViewportRef}
        className="relative flex flex-1 min-h-0 w-full items-center justify-center overflow-hidden px-2 py-3 sm:px-6"
      >
        {/* Left Quick Turn Button (Desktop) */}
        <button
          type="button"
          disabled={atCover}
          onClick={flipPrev}
          aria-label="Balik ke halaman sebelumnya"
          className="hidden md:inline-flex z-20 mr-2 h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4CCB8] bg-[#FFFDF7]/95 text-[#1C2820] shadow-md transition-transform hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 dark:border-[#2D473B] dark:bg-[#182B22]/95 dark:text-[#ECF3EE]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Imperative StPageFlip Mount Container */}
        <div
          className="relative flex items-center justify-center transition-[width] duration-200"
          style={{ width: `${bookContainerWidth}px`, maxWidth: '100%' }}
        >
          <div ref={flipMountHostRef} className="w-full" />
        </div>

        {/* Right Quick Turn Button (Desktop) */}
        <button
          type="button"
          disabled={atEnd}
          onClick={flipNext}
          aria-label="Balik ke halaman berikutnya"
          className="hidden md:inline-flex z-20 ml-2 h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4CCB8] bg-[#FFFDF7]/95 text-[#1C2820] shadow-md transition-transform hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 dark:border-[#2D473B] dark:bg-[#182B22]/95 dark:text-[#ECF3EE]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Render Live React Contents Inside Each Imperative StPageFlip Page via Portal */}
      {portalMount &&
        portalMount.signature === pagesSignature &&
        flipPages.map((page, idx) => {
          const container = portalMount.containers[idx];
          if (!container) return null;
          return createPortal(renderPageContent(page), container, page.id);
        })}
    </div>
  );
});
