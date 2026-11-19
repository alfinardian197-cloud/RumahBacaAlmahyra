import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPortal } from './components/AdminPortal';
import { BookReaderModal } from './components/BookReaderModal';
import { LoginModal } from './components/LoginModal';
import { MemberPortal } from './components/MemberPortal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PublicLanding } from './components/PublicLanding';
import { SplashScreen } from './components/SplashScreen';
import {
  TopBar,
  type NavTabItem,
  type PublicPageId,
  type PublicRoleMode,
} from './components/TopBar';
import { DEFAULT_DB } from './data/defaultDb';
import { initGoogleAuth } from './services/googleAuth';
import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  CreationCategory,
  TestimonialItem,
  ThemeMode,
} from './types/almahyra';
import {
  claimBookStampInLocalPassport,
  claimRealActionMissionInLocalPassport,
  createValidatedTestimonial,
  getBookReadablePages,
  hydrateDatabaseWithDefaults,
  loadLocalPassportState,
  mergeTestimonialsLists,
  recordBookReadingAction,
  resolveThemeMode,
  saveLocalPassportState,
  toggleThemeMode,
  type CreateTestimonialInput,
  type LocalDigitalPassportState,
} from './utils/almahyra';

const SESSION_STORAGE_KEY = 'almahyra_user_session_v1';
const THEME_STORAGE_KEY = 'almahyra_theme_v1';
const SPLASH_SEEN_KEY = 'almahyra_splash_seen_v1';
const LOCAL_TESTIMONIALS_KEY = 'almahyra_user_testimonials_v1';

function loadLocalTestimonials(): TestimonialItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_TESTIMONIALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TestimonialItem[]) : [];
  } catch {
    return [];
  }
}

function saveLocalTestimonial(item: TestimonialItem): void {
  try {
    const current = loadLocalTestimonials();
    const next = mergeTestimonialsLists([item], current).slice(0, 50);
    localStorage.setItem(LOCAL_TESTIMONIALS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota issues
  }
}

export default function App() {
  const [db, setDb] = useState<AlmahyraDatabase>(DEFAULT_DB);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const noSplashParam =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).has('nosplash');
      if (noSplashParam) return false;
      return !sessionStorage.getItem(SPLASH_SEEN_KEY);
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return resolveThemeMode(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'light';
    }
  });
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  });
  const [audienceMode, setAudienceMode] = useState<PublicRoleMode>('petualang');
  const [localPassport, setLocalPassport] = useState<LocalDigitalPassportState>(() =>
    loadLocalPassportState(),
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [readingBookId, setReadingBookId] = useState<string | null>(null);

  // Page states respecting clean multi-page flow
  const [publicPage, setPublicPage] = useState<PublicPageId>('beranda');
  const [memberPage, setMemberPage] = useState<'passport' | 'catalog' | 'schedule'>('passport');
  const [adminPage, setAdminPage] = useState<'data' | 'reports' | 'appearance'>('data');

  const authHeaders = useMemo((): Record<string, string> => {
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  }, [session?.token]);

  const handleDismissSplash = useCallback(() => {
    setShowSplash(false);
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleUpdateLocalPassport = useCallback((next: LocalDigitalPassportState) => {
    setLocalPassport(next);
    saveLocalPassportState(next);
  }, []);

  const handleQuickClaimStamp = useCallback((book: Book) => {
    let resultInfo = { alreadyClaimed: false };
    setLocalPassport((prev) => {
      const res = claimBookStampInLocalPassport(prev, book);
      resultInfo = { alreadyClaimed: res.alreadyClaimed };
      saveLocalPassportState(res.nextState);
      return res.nextState;
    });
    return resultInfo;
  }, []);

  const handleClaimRealAction = useCallback((book: Book, note?: string) => {
    let resultInfo = { alreadyClaimed: false };
    setLocalPassport((prev) => {
      const res = claimRealActionMissionInLocalPassport(prev, book, note);
      resultInfo = { alreadyClaimed: res.alreadyClaimed };
      saveLocalPassportState(res.nextState);
      return res.nextState;
    });
    return resultInfo;
  }, []);

  const handleChangePublicRoleMode = useCallback((mode: PublicRoleMode) => {
    setAudienceMode(mode);
    setPublicPage(mode === 'telaga' ? 'telaga-program' : 'beranda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectPublicPage = useCallback((pageId: PublicPageId, anchorId?: string) => {
    setAudienceMode(pageId.startsWith('telaga-') ? 'telaga' : 'petualang');
    setPublicPage(pageId);
    window.setTimeout(() => {
      if (anchorId) {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    const unsub = initGoogleAuth();
    return () => unsub();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => toggleThemeMode(prev));
  }, []);

  // Load database with optional auth Bearer token (refetches automatically on login/logout)
  useEffect(() => {
    let active = true;
    fetch('/api/db', {
      headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: Partial<AlmahyraDatabase>) => {
        if (active && data?.config && Array.isArray(data.members)) {
          const hydrated = hydrateDatabaseWithDefaults(data, DEFAULT_DB);
          const localExtras = loadLocalTestimonials();
          setDb({
            ...hydrated,
            testimonials: mergeTestimonialsLists(localExtras, hydrated.testimonials ?? []),
          });
        }
      })
      .catch(() => {
        // Keep current/DEFAULT_DB fallback with any locally saved testimonials if offline
        if (active) {
          const localExtras = loadLocalTestimonials();
          if (localExtras.length > 0) {
            setDb((prev) => ({
              ...prev,
              testimonials: mergeTestimonialsLists(localExtras, prev.testimonials ?? []),
            }));
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.token]);

  // Apply theme colors dynamically from config
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', db.config.primaryColor || '#087C3B');
    root.style.setProperty('--brand-secondary', db.config.secondaryColor || '#7ED321');
    root.style.setProperty('--brand-accent', db.config.accentColor || '#FFC51B');
  }, [db.config.primaryColor, db.config.secondaryColor, db.config.accentColor]);

  const handleUpdateDb = useCallback(
    async (nextDb: AlmahyraDatabase) => {
      setDb(nextDb);
      await fetch('/api/db', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(nextDb),
      });
    },
    [authHeaders],
  );

  const handleResetDb = useCallback(async () => {
    const res = await fetch('/api/db/reset', {
      method: 'POST',
      headers: authHeaders,
    });
    if (res.ok) {
      const fresh = (await res.json()) as Partial<AlmahyraDatabase>;
      setDb(hydrateDatabaseWithDefaults(fresh, DEFAULT_DB));
    }
  }, [authHeaders]);

  const viewerKey = session?.nomorInduk || 'guest';

  const handleRecordReading = useCallback(
    async (params: {
      bookId: string;
      lastPage: number;
      totalPages: number;
      completed?: boolean;
      quizScore?: number;
      journalNote?: string;
      starRating?: number;
      toggleFavorite?: boolean;
      awardPoints?: number;
    }) => {
      setDb((prev) =>
        recordBookReadingAction(prev, {
          viewerKey,
          ...params,
        }),
      );
      try {
        const res = await fetch('/api/reading/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(params),
        });
        if (res.ok) {
          const data = (await res.json()) as { db?: Partial<AlmahyraDatabase> };
          if (data.db) {
            setDb(hydrateDatabaseWithDefaults(data.db, DEFAULT_DB));
          }
        }
      } catch {
        // Optimistic update stays visible offline
      }
    },
    [authHeaders, viewerKey],
  );

  const handleToggleFavorite = useCallback(
    async (book: Book) => {
      const existing = db.readingProgress?.find(
        (p) => p.viewerKey === viewerKey && p.bookId === book.id,
      );
      const totalPages = getBookReadablePages(book).length;
      await handleRecordReading({
        bookId: book.id,
        lastPage: existing?.lastPage ?? 0,
        totalPages,
        toggleFavorite: true,
      });
    },
    [db.readingProgress, handleRecordReading, viewerKey],
  );

  const handleSubmitCreation = useCallback(
    async (payload: {
      judul: string;
      kategori: CreationCategory;
      namaSamaran: string;
      jenjangUsia: string;
      ringkasan: string;
      konten: string;
    }) => {
      try {
        const res = await fetch('/api/creations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          db?: Partial<AlmahyraDatabase>;
        };
        if (!res.ok) {
          return { ok: false, message: data.error || 'Gagal mengirim karya.' };
        }
        if (data.db) {
          setDb(hydrateDatabaseWithDefaults(data.db, DEFAULT_DB));
        }
        return {
          ok: true,
          message:
            session?.role === 'admin' || session?.role === 'superadmin'
              ? 'Karya berhasil diterbitkan ke Galeri!'
              : 'Karya terkirim! Menunggu persetujuan orang tua & moderasi Admin sebelum tayang di galeri publik.',
        };
      } catch {
        return { ok: false, message: 'Gagal terhubung ke server untuk mengirim karya.' };
      }
    },
    [authHeaders, session?.role],
  );

  const handleModerateCreation = useCallback(
    async (
      creationId: string,
      action: 'approve' | 'reject' | 'parent-approve',
      catatan?: string,
    ) => {
      try {
        const res = await fetch(`/api/creations/${encodeURIComponent(creationId)}/moderate`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({ action, catatan }),
        });
        const data = (await res.json()) as {
          error?: string;
          db?: Partial<AlmahyraDatabase>;
        };
        if (!res.ok) {
          return { ok: false, message: data.error || 'Gagal memperbarui status karya.' };
        }
        if (data.db) {
          setDb(hydrateDatabaseWithDefaults(data.db, DEFAULT_DB));
        }
        return { ok: true, message: 'Status publikasi karya diperbarui.' };
      } catch {
        return { ok: false, message: 'Koneksi ke server terganggu.' };
      }
    },
    [authHeaders],
  );

  const handleUpdateMemberProfile = useCallback(
    async (payload: { nomorInduk?: string; targetMingguan?: number; orangTua?: string }) => {
      try {
        const res = await fetch('/api/member/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          error?: string;
          db?: Partial<AlmahyraDatabase>;
        };
        if (!res.ok) {
          return { ok: false, message: data.error || 'Gagal memperbarui profil.' };
        }
        if (data.db) {
          setDb(hydrateDatabaseWithDefaults(data.db, DEFAULT_DB));
        }
        return { ok: true, message: 'Profil & target mingguan berhasil diperbarui.' };
      } catch {
        return { ok: false, message: 'Gagal terhubung ke server.' };
      }
    },
    [authHeaders],
  );

  const handleSubmitTestimonial = useCallback(
    async (payload: CreateTestimonialInput) => {
      const validated = createValidatedTestimonial(payload);
      if (!validated.ok) {
        return { ok: false, message: validated.error };
      }

      try {
        const res = await fetch('/api/testimonials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          testimonial?: TestimonialItem;
          db?: Partial<AlmahyraDatabase>;
        };

        if (res.ok && data.testimonial) {
          saveLocalTestimonial(data.testimonial);
          if (data.db) {
            const hydrated = hydrateDatabaseWithDefaults(data.db, DEFAULT_DB);
            setDb({
              ...hydrated,
              testimonials: mergeTestimonialsLists(
                loadLocalTestimonials(),
                hydrated.testimonials ?? [],
              ),
            });
          } else {
            setDb((prev) => ({
              ...prev,
              testimonials: mergeTestimonialsLists([data.testimonial!], prev.testimonials ?? []),
            }));
          }
          return {
            ok: true,
            message: 'Terima kasih! Testimoni Anda telah tersimpan dan tampil di halaman ini.',
          };
        }

        if (res.status >= 400 && res.status < 500 && data.error) {
          return { ok: false, message: data.error };
        }
      } catch {
        // Fallback to local persistence when offline or on read-only static host
      }

      saveLocalTestimonial(validated.testimonial);
      setDb((prev) => ({
        ...prev,
        testimonials: mergeTestimonialsLists([validated.testimonial], prev.testimonials ?? []),
      }));
      return {
        ok: true,
        message: 'Terima kasih! Testimoni Anda telah tersimpan di perangkat ini dan langsung tampil.',
      };
    },
    [authHeaders],
  );

  const readingBook = useMemo(
    () => (readingBookId ? db.books.find((b) => b.id === readingBookId) ?? null : null),
    [db.books, readingBookId],
  );

  useEffect(() => {
    if (readingBook) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [readingBook]);

  const readingProgress = useMemo(
    () =>
      readingBook
        ? db.readingProgress?.find(
            (p) => p.viewerKey === viewerKey && p.bookId === readingBook.id,
          )
        : undefined,
    [db.readingProgress, readingBook, viewerKey],
  );

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    } catch {
      // Ignore storage failures
    }
    if (newSession.role === 'anggota') {
      setMemberPage('passport');
    } else {
      setAdminPage('data');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setAudienceMode('petualang');
    setPublicPage('beranda');
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const navTabs: NavTabItem[] = useMemo(() => {
    if (!session) {
      if (audienceMode === 'petualang') {
        return [
          { id: 'beranda', label: 'Beranda' },
          { id: 'jelajahi-buku', label: 'Jelajahi Buku' },
          { id: 'petualangan', label: 'Petualangan' },
          { id: 'video-edukasi', label: 'Video Edukasi' },
          { id: 'keluarga', label: 'Dunia Keluarga' },
          { id: 'prestasi', label: 'Prestasi' },
        ];
      }
      return [
        { id: 'telaga-program', label: 'Program TELAGA' },
        { id: 'telaga-katalog', label: 'Katalog & Pinjaman' },
      ];
    }
    if (session.role === 'anggota') {
      return [
        { id: 'passport', label: 'Dasbor & E-Paspor' },
        { id: 'catalog', label: 'Katalog & Misi' },
        { id: 'schedule', label: 'Jadwal & Video' },
      ];
    }
    return [
      { id: 'data', label: 'Data & Katalog' },
      { id: 'reports', label: 'Kegiatan & Laporan' },
      { id: 'appearance', label: 'Tampilan & Spreadsheet' },
    ];
  }, [audienceMode, session]);

  const activeTab = !session
    ? publicPage
    : session.role === 'anggota'
      ? memberPage
      : adminPage;

  const handleSelectTab = (id: string) => {
    if (!session) {
      setPublicPage(id as PublicPageId);
    } else if (session.role === 'anggota') {
      setMemberPage(id as 'passport' | 'catalog' | 'schedule');
    } else {
      setAdminPage(id as 'data' | 'reports' | 'appearance');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#111C17]">
      {showSplash && (
        <SplashScreen
          config={db.config}
          ready={!loading}
          onDismiss={handleDismissSplash}
        />
      )}

      {!readingBook && (
        <TopBar
          config={db.config}
          session={session}
          tabs={navTabs}
          activeTab={activeTab}
          theme={theme}
          publicRoleMode={audienceMode}
          onChangePublicRoleMode={handleChangePublicRoleMode}
          onSelectPublicPage={handleSelectPublicPage}
          onToggleTheme={handleToggleTheme}
          onSelectTab={handleSelectTab}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {loading ? (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-6">
          <div className="h-12 w-2/3 animate-pulse rounded-xl bg-[#E7EEEA]" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-[#E7EEEA]" />
        </div>
      ) : !session ? (
        <PublicLanding
          db={db}
          session={session}
          viewerKey={viewerKey}
          activePage={publicPage}
          audienceMode={audienceMode}
          localPassport={localPassport}
          onUpdateLocalPassport={handleUpdateLocalPassport}
          onChangePage={handleSelectPublicPage}
          onOpenLogin={() => setLoginOpen(true)}
          onReadBook={(book) => setReadingBookId(book.id)}
          onToggleFavorite={handleToggleFavorite}
          onSubmitCreation={handleSubmitCreation}
          onSubmitTestimonial={handleSubmitTestimonial}
        />
      ) : session.role === 'anggota' ? (
        <MemberPortal
          db={db}
          session={session}
          activePage={memberPage}
          onReadBook={(book) => setReadingBookId(book.id)}
          onToggleFavorite={handleToggleFavorite}
          onSubmitCreation={handleSubmitCreation}
          onModerateCreation={handleModerateCreation}
          onUpdateMemberProfile={handleUpdateMemberProfile}
        />
      ) : (
        <AdminPortal
          db={db}
          session={session}
          activePage={adminPage}
          onUpdateDb={handleUpdateDb}
          onResetDb={handleResetDb}
          onModerateCreation={handleModerateCreation}
        />
      )}

      <BookReaderModal
        book={readingBook}
        db={db}
        session={session}
        progress={readingProgress}
        localPassport={localPassport}
        onClose={() => setReadingBookId(null)}
        onSwitchBook={(book) => setReadingBookId(book.id)}
        onOpenLogin={() => setLoginOpen(true)}
        onQuickClaimStamp={handleQuickClaimStamp}
        onClaimRealAction={handleClaimRealAction}
        onRecordReading={handleRecordReading}
      />

      <LoginModal
        open={loginOpen}
        config={db.config}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <OfflineIndicator />
    </div>
  );
}
