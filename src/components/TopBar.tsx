import { useState } from 'react';
import { LogIn, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import type { AuthSession, LandingConfig, ThemeMode } from '../types/almahyra';

export interface NavTabItem {
  id: string;
  label: string;
}

interface TopBarProps {
  config: LandingConfig;
  session: AuthSession | null;
  tabs: NavTabItem[];
  activeTab: string;
  theme: ThemeMode;
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
  theme,
  onSelectTheme,
  onToggleTheme,
  onSelectTab,
  onOpenLogin,
  onLogout,
}: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8E5] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark + Logo Icon (Single-line, clean) */}
        <button
          type="button"
          onClick={() => onSelectTab(tabs[0]?.id ?? 'page1')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <img
            src={config.logoUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-xl border border-[#DCE4DF] object-cover bg-white preserve-light shrink-0"
          />
          <span className="font-display text-lg font-bold tracking-tight text-[#111C17] whitespace-nowrap shrink-0">
            {config.appName}
          </span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi utama">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-[#111C17] font-semibold'
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

        {/* Zone 3: Day/Night Switch + Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Desktop Segmented Day/Night Switch */}
          <div
            role="group"
            aria-label="Pilih tampilan siang atau malam"
            className="hidden md:inline-flex items-center rounded-lg border border-[#DCE4DF] bg-[#F2F6F4] p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => onSelectTheme('light')}
              aria-pressed={theme === 'light'}
              aria-label="Aktifkan tampilan siang"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                theme === 'light'
                  ? 'bg-white text-[#111C17] shadow-xs'
                  : 'text-[#4A5D54] hover:text-[#111C17]'
              }`}
            >
              <Sun className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              Siang
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme('dark')}
              aria-pressed={theme === 'dark'}
              aria-label="Aktifkan tampilan malam"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                theme === 'dark'
                  ? 'bg-white dark:bg-[#1E352B] text-[#111C17] shadow-xs'
                  : 'text-[#4A5D54] hover:text-[#111C17]'
              }`}
            >
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              Malam
            </button>
          </div>

          {session ? (
            <button
              type="button"
              onClick={onLogout}
              className="hidden md:inline-flex items-center gap-2 rounded-lg border border-[#DCE4DF] bg-white px-4 py-2 text-xs font-semibold text-[#111C17] transition-colors hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Keluar ({session.role === 'superadmin' ? 'Superadmin' : session.role === 'admin' ? 'Admin' : session.nomorInduk})
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              style={{ backgroundColor: 'var(--brand-primary)' }}
              className="hidden md:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95 whitespace-nowrap shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Masuk Portal
            </button>
          )}

          {/* Mobile Quick Day/Night Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Beralih ke tampilan siang' : 'Beralih ke tampilan malam'}
            aria-pressed={theme === 'dark'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCE4DF] bg-white text-[#111C17] md:hidden"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCE4DF] text-[#111C17] md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#E2E8E5] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Navigasi seluler">
            {tabs.map((tab) => {
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
                  className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-[#111C17] hover:bg-[#F2F6F4]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            <div className="flex items-center justify-between rounded-lg border border-[#E7EEEA] bg-[#F8FAF9] px-3 py-2">
              <span className="text-xs font-semibold text-[#4A5D54]">Mode Tampilan</span>
              <div className="inline-flex items-center rounded-md border border-[#DCE4DF] bg-[#F2F6F4] p-0.5">
                <button
                  type="button"
                  onClick={() => onSelectTheme('light')}
                  aria-pressed={theme === 'light'}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${
                    theme === 'light' ? 'bg-white text-[#111C17]' : 'text-[#4A5D54]'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  Siang
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold ${
                    theme === 'dark' ? 'bg-white dark:bg-[#1E352B] text-[#111C17]' : 'text-[#4A5D54]'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  Malam
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2E8E5]">
              {session ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#DCE4DF] px-4 py-2.5 text-sm font-semibold text-[#111C17]"
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
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Masuk Portal
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
