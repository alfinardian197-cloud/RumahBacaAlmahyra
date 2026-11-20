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
  PlayCircle,
  Sun,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../data/defaultDb';
import type { AuthSession, LandingConfig, ThemeMode } from '../types/almahyra';
import { ResilientImage } from './ResilientImage';

export interface NavTabItem {
  id: string;
  label: string;
  anchorId?: string;
}

export type PublicRoleMode = 'petualang' | 'telaga';

export type PublicPageId =
  | 'beranda'
  | 'jelajahi-buku'
  | 'petualangan'
  | 'video-edukasi'
  | 'keluarga'
  | 'prestasi'
  | 'telaga-program'
  | 'telaga-katalog';

interface TopBarProps {
  config: LandingConfig;
  session: AuthSession | null;
  tabs: NavTabItem[];
  activeTab: string;
  audienceMode: PublicRoleMode;
  activePublicPage: PublicPageId;
  theme: ThemeMode;
  onChangeAudienceMode: (mode: PublicRoleMode) => void;
  onSelectPublicPage: (pageId: PublicPageId, anchorId?: string) => void;
  onToggleTheme: () => void;
  onSelectTab: (id: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

const PETUALANG_MENU: Array<{
  id: PublicPageId;
  label: string;
  icon: LucideIcon;
  iconColor: string;
}> = [
  { id: 'beranda', label: 'Beranda', icon: Home, iconColor: 'text-[#087C3B]' },
  { id: 'jelajahi-buku', label: 'Jelajahi Buku', icon: BookOpen, iconColor: 'text-[#08A9EF]' },
  { id: 'petualangan', label: 'Petualangan', icon: Compass, iconColor: 'text-[#F58220]' },
  { id: 'video-edukasi', label: 'Video Edukasi', icon: PlayCircle, iconColor: 'text-[#DC2626]' },
  { id: 'keluarga', label: 'Dunia Keluarga', icon: Users, iconColor: 'text-[#1D4ED8]' },
  { id: 'prestasi', label: 'Prestasi', icon: Trophy, iconColor: 'text-[#D97706]' },
];

const TELAGA_MENU: Array<{
  id: PublicPageId;
  label: string;
  icon: LucideIcon;
  iconColor: string;
}> = [
  { id: 'telaga-program', label: 'Program TELAGA', icon: HeartHandshake, iconColor: 'text-[#087C3B]' },
  { id: 'telaga-katalog', label: 'Katalog Buku', icon: BookOpen, iconColor: 'text-[#08A9EF]' },
  { id: 'keluarga', label: 'Jadwal & Donasi', icon: Users, iconColor: 'text-[#F58220]' },
];

export function TopBar({
  config,
  session,
  tabs,
  activeTab,
  audienceMode,
  activePublicPage,
  theme,
  onChangeAudienceMode,
  onSelectPublicPage,
  onToggleTheme,
  onSelectTab,
  onOpenLogin,
  onLogout,
}: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicMenu = audienceMode === 'telaga' ? TELAGA_MENU : PETUALANG_MENU;

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E3D4] bg-white/95 backdrop-blur-md shadow-xs dark:border-[#203D30] dark:bg-[#0E1E17]/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <button
          type="button"
          onClick={() => {
            if (!session) {
              onSelectPublicPage('beranda');
            } else {
              onSelectTab(tabs[0]?.id ?? 'passport');
            }
            setMobileMenuOpen(false);
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
            <span className="block font-display text-base sm:text-lg font-extrabold tracking-tight text-[#087C3B] dark:text-[#6EE7B7]">
              {config.appName}
            </span>
            <span className="hidden sm:block text-[10px] font-bold text-[#4A5D54] dark:text-[#A2BCB0]">
              Baca, Berkarya, Bertualang, Raih Prestasi!
            </span>
          </div>
        </button>

        {/* Center Desktop Navigation */}
        {!session ? (
          <nav
            className="hidden xl:flex items-center gap-1"
            aria-label="Navigasi utama Rumah Baca Almahyra"
          >
            {publicMenu.map((item) => {
              const isActive = activePublicPage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPublicPage(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#087C3B] text-white shadow-sm'
                      : 'text-[#1F3A2C] hover:bg-[#FFF8E8] hover:text-[#087C3B] dark:text-[#CBE0D6] dark:hover:bg-[#152B22]'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : item.iconColor}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <nav
            className="hidden md:flex items-center gap-1.5"
            aria-label="Navigasi portal"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#087C3B] text-white shadow-xs'
                      : 'text-[#3B5246] hover:bg-[#FFF8E8] hover:text-[#10281B] dark:text-[#A2BCB0] dark:hover:bg-[#152B22]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Controls: Role Mode Pill (Guest), Theme Toggle, Masuk/Keluar, Mobile Drawer */}
        <div className="flex items-center gap-2 shrink-0">
          {!session && (
            <div
              role="group"
              aria-label="Pilih mode Petualang atau TELAGA"
              className="hidden lg:inline-flex items-center rounded-full border border-[#DCE4DF] bg-[#FFF8E8] p-0.5 dark:border-[#244536] dark:bg-[#132920]"
            >
              <button
                type="button"
                onClick={() => onChangeAudienceMode('petualang')}
                aria-pressed={audienceMode === 'petualang'}
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition-colors whitespace-nowrap ${
                  audienceMode === 'petualang'
                    ? 'bg-[#087C3B] text-white shadow-xs'
                    : 'text-[#4A5D54] hover:text-[#10281B] dark:text-[#A2BCB0]'
                }`}
              >
                Petualang
              </button>
              <button
                type="button"
                onClick={() => onChangeAudienceMode('telaga')}
                aria-pressed={audienceMode === 'telaga'}
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition-colors whitespace-nowrap ${
                  audienceMode === 'telaga'
                    ? 'bg-[#F58220] text-white shadow-xs'
                    : 'text-[#4A5D54] hover:text-[#10281B] dark:text-[#A2BCB0]'
                }`}
              >
                TELAGA
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Beralih ke tampilan siang' : 'Beralih ke tampilan malam'}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Mode Malam Aktif' : 'Mode Siang Aktif'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE4DF] bg-white text-[#3B5246] transition-colors hover:bg-[#FFF8E8] dark:border-[#244536] dark:bg-[#12261E] dark:text-[#DCECE4] shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {session ? (
            <button
              type="button"
              onClick={onLogout}
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full border border-[#DCE4DF] bg-white px-4 text-xs font-extrabold text-[#10281B] transition-colors hover:bg-[#FFF8E8] whitespace-nowrap shrink-0 dark:border-[#244536] dark:bg-[#12261E] dark:text-[#EDF5F0]"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full bg-[#087C3B] px-4 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-[#06612D] whitespace-nowrap shrink-0"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Masuk</span>
            </button>
          )}

          {/* Mobile/Tablet Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE4DF] bg-white text-[#10281B] hover:bg-[#FFF8E8] dark:border-[#244536] dark:bg-[#12261E] dark:text-white ${
              session ? 'md:hidden' : 'xl:hidden'
            }`}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile / Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E7E3D4] bg-white px-4 py-4 shadow-lg dark:border-[#203D30] dark:bg-[#0E1E17] xl:hidden">
          <div className="mx-auto max-w-7xl space-y-3">
            {!session && (
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#FFF8E8] p-1 dark:bg-[#132920]">
                <button
                  type="button"
                  onClick={() => {
                    onChangeAudienceMode('petualang');
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-lg py-2 text-xs font-extrabold ${
                    audienceMode === 'petualang'
                      ? 'bg-[#087C3B] text-white'
                      : 'text-[#4A5D54]'
                  }`}
                >
                  Mode Petualang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeAudienceMode('telaga');
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-lg py-2 text-xs font-extrabold ${
                    audienceMode === 'telaga'
                      ? 'bg-[#F58220] text-white'
                      : 'text-[#4A5D54]'
                  }`}
                >
                  Mode TELAGA
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {!session
                ? publicMenu.map((item) => {
                    const isActive = activePublicPage === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectPublicPage(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold ${
                          isActive
                            ? 'bg-[#087C3B] text-white'
                            : 'bg-[#FFFDF6] text-[#10281B] hover:bg-[#FFF8E8] dark:bg-[#12261E] dark:text-[#EDF5F0]'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${isActive ? 'text-white' : item.iconColor}`}
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
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-bold ${
                          isActive
                            ? 'bg-[#087C3B] text-white'
                            : 'bg-[#FFFDF6] text-[#10281B] hover:bg-[#FFF8E8] dark:bg-[#12261E] dark:text-[#EDF5F0]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
            </div>

            <div className="border-t border-[#EEF3F0] pt-3 sm:hidden">
              {session ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Keluar ({session.displayName})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087C3B] py-2.5 text-sm font-bold text-white"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Masuk Akun Anggota / Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
