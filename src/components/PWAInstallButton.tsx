import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC51B] px-3 py-1.5 text-xs font-bold text-[#10281B] shadow-xs transition-transform hover:scale-[1.02] whitespace-nowrap shrink-0"
        title="Pasang Aplikasi Almahyra ke Layar Utama"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden xl:inline">Pasang App</span>
        <span className="xl:hidden">App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFC51B] bg-[#FFF8DF] px-2.5 py-1.5 text-xs font-bold text-[#10281B] whitespace-nowrap shrink-0"
        >
          <Smartphone className="h-3.5 w-3.5 text-[#087C3B]" aria-hidden="true" />
          <span className="hidden xl:inline">Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Panduan pemasangan iOS"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-[#E7DEC6] bg-white p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#10281B]">
                  Pasang Almahyra App di iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Tutup panduan"
                  className="rounded-lg p-1 text-[#3E5B4C] hover:bg-[#FFF2D6]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[#3E5B4C]">
                1. Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah bawah Safari.
                <br />
                2. Pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong> lalu ketuk Tambah.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#087C3B] py-2 text-xs font-bold text-white"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
