import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPortal } from './components/AdminPortal';
import { LoginModal } from './components/LoginModal';
import { MemberPortal } from './components/MemberPortal';
import { PublicLanding } from './components/PublicLanding';
import { TopBar, type NavTabItem } from './components/TopBar';
import { DEFAULT_DB } from './data/defaultDb';
import { initGoogleAuth } from './services/googleAuth';
import type { AlmahyraDatabase, AuthSession } from './types/almahyra';

const SESSION_STORAGE_KEY = 'almahyra_user_session_v1';

export default function App() {
  const [db, setDb] = useState<AlmahyraDatabase>(DEFAULT_DB);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  });
  const [loginOpen, setLoginOpen] = useState(false);

  // Page states respecting strict page count limits (2 public, max 3 other portals)
  const [publicPage, setPublicPage] = useState<'page1' | 'page2'>('page1');
  const [memberPage, setMemberPage] = useState<'passport' | 'catalog' | 'schedule'>('passport');
  const [adminPage, setAdminPage] = useState<'data' | 'reports' | 'appearance'>('data');

  useEffect(() => {
    const unsub = initGoogleAuth();
    return () => unsub();
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/db')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: AlmahyraDatabase) => {
        if (active && data?.config && Array.isArray(data.members)) {
          setDb(data);
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
    root.style.setProperty('--brand-primary', db.config.primaryColor || '#136B36');
    root.style.setProperty('--brand-secondary', db.config.secondaryColor || '#1F8A44');
    root.style.setProperty('--brand-accent', db.config.accentColor || '#D98200');
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
      const fresh = (await res.json()) as AlmahyraDatabase;
      setDb(fresh);
    }
  }, []);

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
      return [
        { id: 'page1', label: 'Beranda & TELAGA' },
        { id: 'page2', label: 'Katalog & Jadwal' },
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
  }, [session]);

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
      <TopBar
        config={db.config}
        session={session}
        tabs={navTabs}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      {loading ? (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-6">
          <div className="h-12 w-2/3 animate-pulse rounded-xl bg-[#E7EEEA]" />
          <div className="h-64 w-full animate-pulse rounded-2xl bg-[#E7EEEA]" />
        </div>
      ) : !session ? (
        <PublicLanding
          db={db}
          activePage={publicPage}
          onChangePage={handleSelectTab}
          onOpenLogin={() => setLoginOpen(true)}
        />
      ) : session.role === 'anggota' ? (
        <MemberPortal db={db} session={session} activePage={memberPage} />
      ) : (
        <AdminPortal
          db={db}
          session={session}
          activePage={adminPage}
          onUpdateDb={handleUpdateDb}
          onResetDb={handleResetDb}
        />
      )}

      <LoginModal
        open={loginOpen}
        config={db.config}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
