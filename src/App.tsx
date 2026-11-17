import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPortal } from './components/AdminPortal';
import { BookReaderModal } from './components/BookReaderModal';
import { LoginModal } from './components/LoginModal';
import { MemberPortal } from './components/MemberPortal';
import { PublicLanding } from './components/PublicLanding';
import { SplashScreen } from './components/SplashScreen';
import { TopBar, type NavTabItem, type PublicRoleMode } from './components/TopBar';
import { DEFAULT_DB } from './data/defaultDb';
import { initGoogleAuth } from './services/googleAuth';
import type { AlmahyraDatabase, AuthSession, Book, ThemeMode } from './types/almahyra';
import {
  claimBookStampInLocalPassport,
  getBookReadablePages,
  hydrateDatabaseWithDefaults,
  loadLocalPassportState,
  recordBookReadingAction,
  resolveThemeMode,
  saveLocalPassportState,
  toggleThemeMode,
  type LocalDigitalPassportState,
} from './utils/almahyra';

const SESSION_STORAGE_KEY = 'almahyra_user_session_v1';
const THEME_STORAGE_KEY = 'almahyra_theme_v1';
const SPLASH_SEEN_KEY = 'almahyra_splash_seen_v1';

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

  // Page states respecting strict page count limits (2 public, max 3 other portals)
  const [publicPage, setPublicPage] = useState<'page1' | 'page2'>('page1');
  const [memberPage, setMemberPage] = useState<'passport' | 'catalog' | 'schedule'>('passport');
  const [adminPage, setAdminPage] = useState<'data' | 'reports' | 'appearance'>('data');

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

  const handleChangePublicRoleMode = useCallback((mode: PublicRoleMode) => {
    setAudienceMode(mode);
    setPublicPage('page1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleSetTheme = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => toggleThemeMode(prev));
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/db')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: Partial<AlmahyraDatabase>) => {
        if (active && data?.config && Array.isArray(data.members)) {
          setDb(hydrateDatabaseWithDefaults(data, DEFAULT_DB));
        }
      })
      .catch(() => {
        // Keep DEFAULT_DB fallback if offline
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Apply theme colors dynamically from icon logo / config
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', db.config.primaryColor || '#047857');
    root.style.setProperty('--brand-secondary', db.config.secondaryColor || '#059669');
    root.style.setProperty('--brand-accent', db.config.accentColor || '#D97706');
  }, [db.config.primaryColor, db.config.secondaryColor, db.config.accentColor]);

  const handleUpdateDb = useCallback(async (nextDb: AlmahyraDatabase) => {
    setDb(nextDb);
    await fetch('/api/db', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextDb),
    });
  }, []);

  const handleResetDb = useCallback(async () => {
    const res = await fetch('/api/db/reset', { method: 'POST' });
    if (res.ok) {
      const fresh = (await res.json()) as Partial<AlmahyraDatabase>;
      setDb(hydrateDatabaseWithDefaults(fresh, DEFAULT_DB));
    }
  }, []);

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
      let updatedSnapshot: AlmahyraDatabase | null = null;
      setDb((prev) => {
        updatedSnapshot = recordBookReadingAction(prev, {
          viewerKey,
          ...params,
        });
        return updatedSnapshot;
      });
      if (updatedSnapshot) {
        await fetch('/api/db', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSnapshot),
        });
      }
    },
    [viewerKey],
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
    setPublicPage('page1');
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
          { id: 'page1', label: 'Rak & Katalog' },
          { id: 'page2', label: 'Paspor & Kuis' },
        ];
      }
      return [
        { id: 'page1', label: 'Program TELAGA' },
        { id: 'page2', label: 'Katalog & Pinjaman' },
      ];
    }
    if (session.role === 'anggota') {
      return [
        { id: 'passport', label: 'Beranda & E-Paspor' },
        { id: 'catalog', label: 'Katalog & Misi' },
        { id: 'schedule', label: 'Jadwal & Pinjaman' },
      ];
    }
    return [
      { id: 'data', label: 'Data & Sirkulasi' },
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
      setPublicPage(id as 'page1' | 'page2');
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
          onSelectTheme={handleSetTheme}
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
          viewerKey={viewerKey}
          activePage={publicPage}
          audienceMode={audienceMode}
          localPassport={localPassport}
          onUpdateLocalPassport={handleUpdateLocalPassport}
          onChangePage={handleSelectTab}
          onOpenLogin={() => setLoginOpen(true)}
          onReadBook={(book) => setReadingBookId(book.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : session.role === 'anggota' ? (
        <MemberPortal
          db={db}
          session={session}
          activePage={memberPage}
          onReadBook={(book) => setReadingBookId(book.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        <AdminPortal
          db={db}
          session={session}
          activePage={adminPage}
          onUpdateDb={handleUpdateDb}
          onResetDb={handleResetDb}
        />
      )}

      <BookReaderModal
        book={readingBook}
        db={db}
        session={session}
        progress={readingProgress}
        onClose={() => setReadingBookId(null)}
        onSwitchBook={(book) => setReadingBookId(book.id)}
        onOpenLogin={() => setLoginOpen(true)}
        onQuickClaimStamp={handleQuickClaimStamp}
        onRecordReading={handleRecordReading}
      />

      <LoginModal
        open={loginOpen}
        config={db.config}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
