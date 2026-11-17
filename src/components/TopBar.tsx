import { useState } from 'react';
import {
  BookOpen,
  Compass,
  HeartHandshake,
  Home,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Palette,
  Sun,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../data/defaultDb';
import type { AuthSession, LandingConfig, ThemeMode } from '../types/almahyra';
import { PWAInstallButton } from './PWAInstallButton';
import { ResilientImage } from './ResilientImage';

export interface NavTabItem {
  id: string;
  label: string;
  anchorId?: string;
}

export type PublicRoleMode = 'petualang' | 'telaga';

export const PUBLIC_ECOSYSTEM_NAV: Array<{
  id: string;
  label: string;
  anchorId: string;
  icon: LucideIcon;
  iconColor: string;
}> = [
  { id: 'beranda', label: 'Beranda', anchorId: 'beranda-hero', icon: Home, iconColor: '#087C3B' },
  {
    id: 'jelajahi-buku',
    label: 'Jelajahi Buku',
    anchorId: 'rak-pilihan-workspace',
    icon: BookOpen,
    iconColor: '#0284C7',
  },
  {
    id: 'petualangan',
    label: 'Petualangan',
    anchorId: 'petualangan-zona',
    icon: Compass,
    iconColor: '#D97706',
  },
  {
    id: 'galeri-karya',
    label: 'Galeri Karya',
    anchorId: 'galeri-karya',
    icon: Palette,
    iconColor: '#EA580C',
  },
  {
    id: 'keluarga',
    label: 'Dunia Keluarga',
    anchorId: 'dunia-keluarga',
    icon: Users,
    iconColor: '#2563EB',
  },
  {
    id: 'prestasi',
    label: 'Prestasi',
    anchorId: 'prestasi-paspor',
    icon: Trophy,
    iconColor: '#D97706',
  },
];

interface TopBarProps {
  config: LandingConfig;
  session: AuthSession | null;
  tabs: NavTabItem[];
  activeTab: string;
  activePublicAnchor?: string;
  theme: ThemeMode;
  publicRoleMode?: PublicRoleMode;
  onChangePublicRoleMode?: (mode: PublicRoleMode) => void;
  onSelectPublicSection?: (anchorId: string, navId: string) => void;
  onSelectTheme: (theme: ThemeMode) => void;
  onToggleTheme: () => void;
  onSelectTab: (id: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export function TopBar({
  config,
  session,
  tabs,
  activeTab,
  activePublicAnchor = 'beranda-hero',
  theme,
  publicRoleMode = 'petualang',
  onChangePublicRoleMode,
  onSelectPublicSection,
  onSelectTheme,
  onToggleTheme,
  onSelectTab,
  onOpenLogin,
  onLogout,
}: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7DEC6] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2.5 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Official App Icon Logo + Brand Title & Tagline */}
        <button
          type="button"
          onClick={() => {
            if (!session && onSelectPublicSection) {
              onSelectPublicSection('beranda-hero', 'beranda');
            } else {
              onSelectTab(tabs[0]?.id ?? 'page1');
            }
          }}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ResilientImage
            src={config.logoUrl}
            fallbackSrc={DEFAULT_LOGO_URL}
            alt={config.appName}
            loading="eager"
            fetchPriority="high"
            className="h-10 w-10 rounded-xl border-2 border-[#FFC51B] object-cover bg-white preserve-light shrink-0 shadow-xs"
          />
          <div className="leading-tight">
            <span className="block font-display text-base font-extrabold tracking-tight text-[#087C3B] dark:text-[#6EE7B7] whitespace-nowrap">
              {config.appName}
            </span>
            <span className="hidden 2xl:block text-[10px] font-bold text-[#4A5D54] whitespace-nowrap">
              {config.tagline}
            </span>
          </div>
        </button>

        {/* Zone 2: Single-line Navigation with Storybook Icons */}
        {!session && onSelectPublicSection ? (
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-1.5" aria-label="Navigasi utama">
            {PUBLIC_ECOSYSTEM_NAV.map((item) => {
              const isActive = activePublicAnchor === item.anchorId && activeTab === 'page1';
              const NavIcon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPublicSection(item.anchorId, item.id)}
                  className={`relative inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#087C3B] text-white shadow-xs'
                      : 'text-[#3E5B4C] hover:bg-[#FFF2D6] hover:text-[#10281B] dark:text-[#A5C0B4] dark:hover:bg-[#142b21] dark:hover:text-white'
                  }`}
                >
                  <NavIcon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: isActive ? '#FFFFFF' : item.iconColor }}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-4" aria-label="Navigasi portal">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[#111C17] font-bold'
                      : 'text-[#4A5D54] hover:text-[#111C17]'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--brand-primary-ink)' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Role Switcher + Theme + PWA Install + Masuk + Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!session && onChangePublicRoleMode && (
            <div
              role="group"
              aria-label="Pengalih Mode Utama"
              className="hidden lg:inline-flex items-center rounded-xl border border-[#DCE4DF] bg-[#FFF8E8] p-0.5 shrink-0"
            >
              <button
                type="button"
                onClick={() => onChangePublicRoleMode('petualang')}
                aria-pressed={publicRoleMode === 'petualang'}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                  publicRoleMode === 'petualang'
                    ? 'bg-[#087C3B] text-white shadow-xs'
                    : 'text-[#3E5B4C] hover:text-[#10281B] dark:text-[#A5C0B4] dark:hover:text-white'
                }`}
              >
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                Petualang
              </button>
              <button
                type="button"
                onClick={() => onChangePublicRoleMode('telaga')}
                aria-pressed={publicRoleMode === 'telaga'}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                  publicRoleMode === 'telaga'
                    ? 'bg-[#F58220] text-white shadow-xs'
                    : 'text-[#3E5B4C] hover:text-[#10281B] dark:text-[#A5C0B4] dark:hover:text-white'
                }`}
              >
                <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
                TELAGA
              </button>
            </div>
          )}

          {/* Compact Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Beralih ke tampilan siang' : 'Beralih ke tampilan malam'}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Mode Malam Aktif' : 'Mode Siang Aktif'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#DCE4DF] bg-white text-[#111C17] hover:bg-[#FFF2D6] shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>

          {session ? (
            <button
              type="button"
              onClick={onLogout}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-3 py-2 text-xs font-bold text-[#111C17] transition-colors hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Keluar ({session.role === 'superadmin' ? 'Superadmin' : session.role === 'admin' ? 'Admin' : session.nomorInduk})
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-[#087C3B] px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-95 whitespace-nowrap shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Masuk
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE4DF] text-[#111C17] xl:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#E2E8E5] bg-white px-4 py-4 xl:hidden">
          <nav className="flex flex-col gap-2" aria-label="Navigasi seluler">
            {!session && onSelectPublicSection
              ? [
                  ...PUBLIC_ECOSYSTEM_NAV,
                  {
                    id: 'tentang-kami',
                    label: 'Tentang Kami',
                    anchorId: 'tentang-kami',
                    icon: Compass,
                    iconColor: '#087C3B',
                  },
                ].map((item) => {
                  const isActive = activePublicAnchor === item.anchorId && activeTab === 'page1';
                  const NavIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectPublicSection(item.anchorId, item.id);
                        setMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-bold ${
                        isActive
                          ? 'bg-[#087C3B] text-white'
                          : 'text-[#111C17] hover:bg-[#FFF2D6]'
                      }`}
                    >
                      <NavIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: isActive ? '#FFFFFF' : item.iconColor }}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })
              : tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(tab.id);
                        setMobileOpen(false);
                      }}
                      style={isActive ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-[#111C17] hover:bg-[#F2F6F4]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}

            {!session && onChangePublicRoleMode && (
              <div className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-2.5 space-y-2 mt-1">
                <p className="text-xs font-bold text-[#4A5D54]">Pengalih Mode Ruang Baca</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onChangePublicRoleMode('petualang');
                      setMobileOpen(false);
                    }}
                    aria-pressed={publicRoleMode === 'petualang'}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
                      publicRoleMode === 'petualang'
                        ? 'bg-[#087C3B] text-white'
                        : 'border border-[#DCE4DF] bg-white text-[#111C17]'
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    Mode Petualang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangePublicRoleMode('telaga');
                      setMobileOpen(false);
                    }}
                    aria-pressed={publicRoleMode === 'telaga'}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
                      publicRoleMode === 'telaga'
                        ? 'bg-[#F58220] text-white'
                        : 'border border-[#DCE4DF] bg-white text-[#111C17]'
                    }`}
                  >
                    <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
                    Sahabat TELAGA
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 sm:hidden">
              <PWAInstallButton />
            </div>

            <div className="pt-2 border-t border-[#E2E8E5] md:hidden">
              {session ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4DF] px-4 py-2.5 text-sm font-bold text-[#111C17]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Keluar ({session.displayName})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenLogin();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087C3B] px-4 py-2.5 text-sm font-bold text-white"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Masuk Akun Almahyra
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
