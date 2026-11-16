import { useState } from 'react';
import { LogIn, LogOut, Menu, X } from 'lucide-react';
import type { AuthSession, LandingConfig } from '../types/almahyra';

export interface NavTabItem {
  id: string;
  label: string;
}

interface TopBarProps {
  config: LandingConfig;
  session: AuthSession | null;
  tabs: NavTabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export function TopBar({
  config,
  session,
  tabs,
  activeTab,
  onSelectTab,
  onOpenLogin,
  onLogout,
}: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8E5] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
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
            className="h-9 w-9 rounded-xl border border-[#DCE4DF] object-cover bg-white shrink-0"
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
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
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
