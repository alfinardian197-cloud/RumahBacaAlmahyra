import { Award, Printer, ShieldCheck, Star, X } from 'lucide-react';
import type { LandingConfig } from '../types/almahyra';
import { DEFAULT_LOGO_URL } from '../data/defaultDb';
import { calculateLevelInfo } from '../utils/almahyra';
import { ResilientImage } from './ResilientImage';

interface DigitalCertificateModalProps {
  open: boolean;
  recipientName: string;
  memberCode: string;
  points: number;
  stampsCount: number;
  badges: string[];
  config: LandingConfig;
  onClose: () => void;
}

export function DigitalCertificateModal({
  open,
  recipientName,
  memberCode,
  points,
  stampsCount,
  badges,
  config,
  onClose,
}: DigitalCertificateModalProps) {
  if (!open) return null;

  const levelInfo = calculateLevelInfo(points);
  const issueDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sertifikat Prestasi Literasi Digital Almahyra"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-[#FFC51B] bg-[#FFFDF6] p-6 sm:p-8 shadow-2xl space-y-6 preserve-light">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ResilientImage
              src={config.logoUrl}
              fallbackSrc={DEFAULT_LOGO_URL}
              alt={config.appName}
              className="h-11 w-11 rounded-xl border border-[#DCE4DF] object-cover bg-white"
            />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#087C3B] dark:text-[#6EE7B7]">
                Sertifikat Literasi Digital
              </p>
              <p className="font-display text-base font-bold text-[#10281B] dark:text-[#EEF7F2]">
                {config.appName} · Dusun Grontol
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup sertifikat"
            className="rounded-xl p-2 text-[#3E5B4C] hover:bg-[#FFF2D6] dark:text-[#A5C0B4] dark:hover:bg-[#1A372A]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Certificate Frame (preserve crisp printable paper styling) */}
        <div className="preserve-light rounded-2xl border-2 border-dashed border-[#087C3B]/35 bg-white p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8DF] text-[#B45309] border border-[#FFC51B]">
            <Award className="h-8 w-8" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#B45309]">
              Piagam Apresiasi Petualangan Membaca
            </p>
            <p className="text-xs text-[#3E5B4C]">Diberikan dengan bangga kepada:</p>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#087C3B]">
              {recipientName || 'Sahabat Petualang Almahyra'}
            </h3>
            <p className="font-mono-tabular text-xs font-semibold text-[#3E5B4C]">
              ID E-Paspor: {memberCode} · Jenjang Capaian: {levelInfo.currentLevel}
            </p>
          </div>

          <p className="mx-auto max-w-lg text-xs sm:text-sm leading-relaxed text-[#3E5B4C]">
            Atas semangat membaca, rasa ingin tahu, dan partisipasi aktif dalam petualangan literasi di Rumah Baca Almahyra dengan perolehan{' '}
            <strong className="text-[#10281B]">{points} Bintang/Poin</strong> dan{' '}
            <strong className="text-[#10281B]">{stampsCount} Stempel E-Paspor</strong>.
          </p>

          {badges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {badges.slice(0, 6).map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#EAF8EE] px-2.5 py-1 text-[11px] font-bold text-[#087C3B]"
                >
                  <Star className="h-3 w-3 fill-[#FFC51B] text-[#B45309]" aria-hidden="true" />
                  {b}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-[#E7EEEA] pt-4 text-left text-xs text-[#3E5B4C]">
            <div>
              <p className="font-semibold text-[#10281B]">Diterbitkan pada</p>
              <p>{issueDate}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[#10281B]">{config.coordinator}</p>
              <p>Koordinator Rumah Baca Almahyra</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087C3B] dark:text-[#6EE7B7]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Tervalidasi di Sistem E-Paspor Almahyra App
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2 text-xs font-bold text-[#10281B] hover:bg-[#FFF2D6] dark:text-[#EEF7F2] dark:hover:bg-[#1A372A]"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Cetak / Simpan PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#087C3B] px-4 py-2 text-xs font-bold text-white"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
