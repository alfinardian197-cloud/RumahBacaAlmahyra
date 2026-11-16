import { useState, type PointerEvent } from 'react';
import { Award, RotateCw, ShieldCheck } from 'lucide-react';
import type { LandingConfig, Member } from '../types/almahyra';
import { calculateLevelInfo } from '../utils/almahyra';
import { QrCodeMatrix } from './QrCodeMatrix';

interface Card3DPassportProps {
  member: Member;
  config: LandingConfig;
  compact?: boolean;
}

export function Card3DPassport({
  member,
  config,
  compact = false,
}: Card3DPassportProps) {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const levelInfo = calculateLevelInfo(member.poin);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 12;
    const rx = (0.5 - py) * 10;
    setTilt({ rx, ry });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const stampSlots = Array.from({ length: 8 }, (_, idx) => idx < Math.min(8, Math.floor(member.poin / 5)));

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="perspective-1200 relative w-full"
        style={{ height: compact ? '252px' : '280px' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className="preserve-3d relative h-full w-full transition-transform duration-500 ease-out"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${flipped ? 180 + tilt.ry : tilt.ry}deg)`,
          }}
        >
          {/* FRONT: E-KARTU ANGGOTA */}
          <div
            className="backface-hidden absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/15 p-5 text-white spatial-depth-shadow"
            style={{
              background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-xs">
                  <img
                    src={config.logoUrl}
                    alt={config.appName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold tracking-tight truncate">
                    {config.appName}
                  </p>
                  <p className="text-xs text-white/75 truncate">
                    E-Kartu Anggota & Paspor Baca
                  </p>
                </div>
              </div>
              <span
                className="rounded-md px-2 py-1 font-mono-tabular text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: config.accentColor }}
              >
                {member.nomorInduk}
              </span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <p className="text-xs text-white/70">
                  {member.jenjangUsia} · Anggota {member.status}
                </p>
                <h3 className="font-display text-xl font-bold tracking-tight truncate">
                  {member.nama}
                </h3>
                <p className="text-xs text-white/80 truncate">
                  Wali: {member.orangTua}
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs font-medium text-white/95">
                  <Award className="h-4 w-4 shrink-0" style={{ color: '#FDE68A' }} aria-hidden="true" />
                  <span className="truncate">{levelInfo.currentLevel}</span>
                </div>
              </div>
              <div className="shrink-0">
                <QrCodeMatrix value={member.nomorInduk} sizePx={76} label={`QR ${member.nomorInduk}`} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/15 pt-2.5 text-xs text-white/80">
              <span className="font-mono-tabular">
                Total Poin: <strong className="text-white">{member.poin} pts</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Terverifikasi Pendamping
              </span>
            </div>
          </div>

          {/* BACK: E-PASPOR STEMPEL */}
          <div
            className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-[#DCE4DF] bg-white p-5 text-[#111C17] spatial-depth-shadow"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#E7EEEA] pb-3">
              <div>
                <p className="font-display text-sm font-bold text-[#111C17]">
                  Lembar Stempel E-Paspor Baca
                </p>
                <p className="text-xs text-[#4A5D54]">
                  {member.nomorInduk} · {levelInfo.currentLevel}
                </p>
              </div>
              <span className="font-mono-tabular text-sm font-bold" style={{ color: config.primaryColor }}>
                {member.poin}/{levelInfo.nextTarget} pts
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 py-2">
              {stampSlots.map((stamped, idx) => (
                <div
                  key={idx}
                  className={`flex h-12 flex-col items-center justify-center rounded-xl border text-xs font-medium transition-colors ${
                    stamped
                      ? 'border-transparent text-white'
                      : 'border-dashed border-[#CBD6D0] bg-[#F8FAF9] text-[#6B7D74]'
                  }`}
                  style={
                    stamped
                      ? { backgroundColor: idx % 2 === 0 ? config.primaryColor : config.accentColor }
                      : undefined
                  }
                >
                  <span className="font-mono-tabular text-[11px]">
                    {stamped ? 'STEMPEL' : `Misi ${idx + 1}`}
                  </span>
                  <span className="text-[10px] opacity-85">+5 pts</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#4A5D54]">
                <span>Progres jenjang berikutnya</span>
                <span className="font-mono-tabular font-semibold text-[#111C17]">
                  {levelInfo.progressPercent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7EEEA]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${levelInfo.progressPercent}%`,
                    backgroundColor: config.accentColor,
                  }}
                />
              </div>
              <p className="text-[11px] text-[#4A5D54] truncate">
                {levelInfo.nextLevel
                  ? `${levelInfo.pointsToNext} poin lagi menuju ${levelInfo.nextLevel}`
                  : 'Jenjang tertinggi tercapai — Duta Literasi Almahyra'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => setFlipped((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#DCE4DF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#111C17] transition-colors hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          {flipped ? 'Lihat Bagian Depan Kartu' : 'Putar 3D: Lihat Lembar Stempel'}
        </button>
      </div>
    </div>
  );
}
