import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../data/defaultDb';
import type { LandingConfig } from '../types/almahyra';
import { LITERACY_SPLASH_QUOTES } from '../utils/almahyra';
import { ResilientImage } from './ResilientImage';

interface SplashScreenProps {
  config: LandingConfig;
  ready: boolean;
  onDismiss: () => void;
}

export function SplashScreen({ config, ready, onDismiss }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);

  const quote = useMemo(() => {
    const idx = Math.floor(Math.random() * LITERACY_SPLASH_QUOTES.length);
    return LITERACY_SPLASH_QUOTES[idx] ?? LITERACY_SPLASH_QUOTES[0];
  }, []);

  useEffect(() => {
    if (!ready) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const holdMs = reduceMotion ? 250 : 850;
    const fadeTimer = window.setTimeout(() => setFadingOut(true), holdMs);
    const doneTimer = window.setTimeout(() => onDismiss(), holdMs + 220);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [ready, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FBF8F1] dark:bg-[#07130E] px-6 transition-opacity duration-200 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#D6CCB4] bg-white p-7 text-center spatial-depth-shadow space-y-5">
        <div className="mx-auto flex h-28 w-28 items-center justify-center animate-hero-float">
          <ResilientImage
            src={config.logoUrl}
            fallbackSrc={DEFAULT_LOGO_URL}
            alt={config.appName}
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-contain drop-shadow-[0_8px_18px_rgba(8,124,59,0.22)]"
          />
        </div>

        <div className="space-y-1.5">
          <p
            className="text-xs font-bold tracking-wide flex items-center justify-center gap-1.5"
            style={{ color: 'var(--brand-primary-ink)' }}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {config.appName} · Dusun Grontol
          </p>
          <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#111C17] leading-snug">
            Menyiapkan Ruang Petualangan Rumah Baca Almahyra...
          </h2>
          <p className="text-xs font-medium text-[#4A5D54]">
            Baca, Berkarya, Bertualang, Raih Prestasi!
          </p>
        </div>

        <p className="rounded-xl border border-[#E6DECB] bg-[#FBF8F1] px-4 py-3 text-xs leading-relaxed text-[#4A5D54]">
          &ldquo;{quote}&rdquo;
        </p>

        <div className="space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#EBE4D3]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: ready ? '100%' : '60%',
                background: 'linear-gradient(90deg, #047857 0%, #10B981 65%, #EAB308 100%)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={onDismiss}
            style={{ backgroundColor: config.primaryColor }}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
          >
            Masuk ke Ruang Baca
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
