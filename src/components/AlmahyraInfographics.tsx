import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  QrCode,
  Sparkles,
  Stamp,
} from 'lucide-react';
import type {
  ActivitySchedule,
  Book,
  LandingConfig,
  Member,
} from '../types/almahyra';
import { calculateLevelInfo, LEVEL_TIERS } from '../utils/almahyra';

const PASSPORT_STEPS = [
  {
    step: '01',
    title: 'Datang & Scan QR',
    short: 'Identifikasi Anggota',
    desc: 'Anak datang ke Teras Almahyra dan dikenali melalui Nomor Induk Anggota atau kode QR pada E-Kartu tanpa perlu HP pribadi.',
    icon: QrCode,
  },
  {
    step: '02',
    title: 'Pilih Buku & Misi',
    short: '6 Zona Petualangan',
    desc: 'Anak memilih buku bacaan atau misi sesuai minatnya: Imajinasi, Pengetahuan, Kreativitas, Eksplorasi, Sahabat Bumi, atau Panggung Cerita.',
    icon: Compass,
  },
  {
    step: '03',
    title: 'Baca & Praktik',
    short: 'Literasi Berbasis Aksi',
    desc: 'Membaca nyaring, berdiskusi, menggambar tokoh, melakukan eksperimen sains aman, atau menanam bibit bersama teman.',
    icon: BookOpen,
  },
  {
    step: '04',
    title: 'Verifikasi Pendamping',
    short: 'Bercerita / Karya',
    desc: 'Pendamping memverifikasi pemahaman lewat tanya jawab lisan 1–2 menit, gambar karya, atau demonstrasi praktik sesuai usia.',
    icon: CheckCircle2,
  },
  {
    step: '05',
    title: 'Stempel & Naik Jenjang',
    short: 'Poin & Lencana Digital',
    desc: 'Pengelola mencatat poin ke E-Paspor & Spreadsheet, memperbarui lencana digital, serta memberi stempel pada Paspor Baca fisik.',
    icon: Stamp,
  },
];

export function PassportFlowInfographic({ config }: { config: LandingConfig }) {
  const [activeStep, setActiveStep] = useState(0);
  const current = PASSPORT_STEPS[activeStep];

  return (
    <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--brand-accent-ink)' }}>
            Infografis Alur E-Paspor Baca
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#111C17]">
            Lima Langkah Petualangan Setiap Kunjungan
          </h2>
        </div>
        <p className="text-xs text-[#4A5D54]">
          Klik tiap langkah untuk melihat mekanisme pendampingan anak.
        </p>
      </div>

      {/* Connected 5-node SVG & button infographic track */}
      <div className="relative">
        <div
          className="hidden lg:block absolute left-10 right-10 top-7 h-0.5 bg-[#E2E8E5]"
          aria-hidden="true"
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(activeStep / (PASSPORT_STEPS.length - 1)) * 100}%`,
              backgroundColor: config.primaryColor,
            }}
          />
        </div>

        <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PASSPORT_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === activeStep;
            const isPassed = idx <= activeStep;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`group flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-transparent bg-[#F8FAF9] shadow-sm ring-2'
                    : 'border-[#E7EEEA] bg-white hover:border-[#BFD0C7]'
                }`}
                style={
                  isSelected
                    ? ({ '--tw-ring-color': 'var(--brand-primary-ink)' } as React.CSSProperties)
                    : undefined
                }
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isPassed ? 'text-white' : 'bg-[#E7EEEA] text-[#4A5D54]'
                    }`}
                    style={isPassed ? { backgroundColor: config.primaryColor } : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono-tabular text-xs font-bold text-[#4A5D54]">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-sm font-bold text-[#111C17]">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs text-[#4A5D54]">{item.short}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Detail Strip */}
      <div className="flex flex-col gap-3 rounded-xl bg-[#F8FAF9] p-4 sm:flex-row sm:items-center sm:justify-between border border-[#E7EEEA]">
        <div className="space-y-1">
          <p className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
            Langkah {current.step} · {current.title}
          </p>
          <p className="text-sm text-[#111C17] leading-relaxed">{current.desc}</p>
        </div>
        <span className="font-mono-tabular text-xs font-semibold text-[#4A5D54] shrink-0">
          {activeStep + 1} / {PASSPORT_STEPS.length}
        </span>
      </div>
    </section>
  );
}

export function LevelProgressionInfographic({
  config,
  currentPoints,
}: {
  config: LandingConfig;
  currentPoints?: number;
}) {
  const activeLevel =
    currentPoints !== undefined ? calculateLevelInfo(currentPoints) : null;

  return (
    <div className="space-y-6">
      {/* Visual SVG Milestone Trail */}
      <div className="rounded-2xl border border-[#E7EEEA] bg-[#F8FAF9] p-4 sm:p-6 overflow-hidden">
        <svg
          viewBox="0 0 880 158"
          role="img"
          aria-label="Infografis tangga capaian poin E-Paspor Baca Almahyra"
          className="hidden sm:block w-full h-auto"
        >
          {/* Rising Adventure Trail */}
          <path
            d="M 60 112 C 180 112, 210 86, 310 86 C 410 86, 440 60, 560 60 C 670 60, 710 34, 820 34"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 60 112 C 180 112, 210 86, 310 86 C 410 86, 440 60, 560 60 C 670 60, 710 34, 820 34"
            fill="none"
            stroke="var(--brand-primary-ink)"
            strokeWidth="4"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />

          {[
            { x: 60, y: 112, pts: 5, label: 'Penjelajah Pemula', color: config.secondaryColor },
            { x: 310, y: 86, pts: 15, label: 'Petualang Cerita', color: config.primaryColor },
            { x: 560, y: 60, pts: 30, label: 'Penjelajah Pengetahuan', color: config.primaryColor },
            { x: 820, y: 34, pts: 50, label: 'Duta Literasi', color: config.accentColor },
          ].map((node) => {
            const reached = currentPoints !== undefined ? currentPoints >= node.pts : true;
            return (
              <g key={node.pts}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="19"
                  fill={reached ? node.color : 'var(--surface-card)'}
                  stroke={node.color}
                  strokeWidth="3"
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                  fill={reached ? '#FFFFFF' : 'var(--ink-primary)'}
                >
                  {node.pts}p
                </text>
                <text
                  x={node.x}
                  y={node.y + 36}
                  textAnchor={node.x === 60 ? 'start' : node.x === 820 ? 'end' : 'middle'}
                  fontSize="12.5"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fill="var(--ink-primary)"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Mobile Readable Milestone Trail */}
        <ol className="sm:hidden space-y-2.5" aria-label="Tangga capaian poin E-Paspor Baca">
          {[
            { pts: 5, label: 'Penjelajah Pemula', color: config.secondaryColor },
            { pts: 15, label: 'Petualang Cerita', color: config.primaryColor },
            { pts: 30, label: 'Penjelajah Pengetahuan', color: config.primaryColor },
            { pts: 50, label: 'Duta Literasi', color: config.accentColor },
          ].map((node, idx) => {
            const reached = currentPoints !== undefined ? currentPoints >= node.pts : true;
            return (
              <li key={node.pts} className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-mono-tabular text-xs font-bold"
                style={{
                  backgroundColor: reached ? node.color : 'var(--surface-card)',
                  borderColor: node.color,
                  color: reached ? '#FFFFFF' : 'var(--ink-primary)',
                }}
              >
                {node.pts}p
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-[#111C17]">
                  {node.label}
                </p>
                <p className="text-xs text-[#4A5D54]">
                  Tahap 0{idx + 1} · Target {node.pts} poin
                </p>
              </div>
            </li>
          );
        })}
      </ol>

        {activeLevel && currentPoints !== undefined && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE4DF] pt-3 text-xs">
            <span className="font-semibold text-[#111C17] inline-flex items-center gap-1.5">
              <Award className="h-4 w-4" style={{ color: 'var(--brand-accent-ink)' }} aria-hidden="true" />
              Posisi Anda: {currentPoints} poin ({activeLevel.currentLevel})
            </span>
            <span className="text-[#4A5D54]">
              {activeLevel.nextLevel
                ? `${activeLevel.pointsToNext} poin lagi menuju ${activeLevel.nextLevel}`
                : 'Semua jenjang utama telah tercapai'}
            </span>
          </div>
        )}
      </div>

      {/* Clean 4-column milestone cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LEVEL_TIERS.map((tier, idx) => (
          <div
            key={tier.name}
            className="rounded-xl border border-[#E7EEEA] bg-white p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono-tabular text-xs text-[#4A5D54]">
                Jenjang 0{idx + 1}
              </span>
              <span
                className="font-mono-tabular text-sm font-bold"
                style={{ color: idx === 3 ? 'var(--brand-accent-ink)' : 'var(--brand-primary-ink)' }}
              >
                {tier.target} pts
              </span>
            </div>
            <h3 className="font-display text-sm font-bold text-[#111C17]">
              {tier.name}
            </h3>
            <p className="text-xs text-[#4A5D54] leading-relaxed">{tier.reward}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CollectionZoneInfographic({
  books,
  schedules,
  config,
}: {
  books: Book[];
  schedules: ActivitySchedule[];
  config: LandingConfig;
}) {
  const zoneStats = useMemo(() => {
    const counts = new Map<string, { titles: number; copies: number }>();
    for (const b of books) {
      const existing = counts.get(b.zona) ?? { titles: 0, copies: 0 };
      counts.set(b.zona, {
        titles: existing.titles + 1,
        copies: existing.copies + Math.max(0, b.stok),
      });
    }
    const palette = [
      config.primaryColor,
      config.secondaryColor,
      config.accentColor,
      '#2B7A78',
      '#4F772D',
      '#B07D2B',
    ];
    const totalCopies = Array.from(counts.values()).reduce((s, v) => s + v.copies, 0) || 1;
    return Array.from(counts.entries()).map(([zona, val], idx) => ({
      zona,
      titles: val.titles,
      copies: val.copies,
      percent: Math.round((val.copies / totalCopies) * 100),
      color: palette[idx % palette.length],
    }));
  }, [books, config.primaryColor, config.secondaryColor, config.accentColor]);

  const totalBooksCopies = books.reduce((s, b) => s + Math.max(0, b.stok), 0);

  // Build SVG Donut segments
  const donutSegments = useMemo(() => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return zoneStats.map((z) => {
      const dash = (z.percent / 100) * circumference;
      const seg = { ...z, dash, offset, circumference };
      offset += dash;
      return seg;
    });
  }, [zoneStats]);

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: SVG Donut Chart of Book Distribution by Adventure Zone */}
      <div className="lg:col-span-6 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--brand-accent-ink)' }}>
              Infografis Koleksi
            </p>
            <h2 className="font-display text-lg font-bold text-[#111C17]">
              Sebaran Buku per Zona Petualangan
            </h2>
          </div>
          <Sparkles className="h-5 w-5" style={{ color: 'var(--brand-accent-ink)' }} aria-hidden="true" />
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Grafik donat sebaran buku per zona">
              <circle cx="70" cy="70" r="52" fill="none" stroke="var(--surface-muted)" strokeWidth="18" />
              {donutSegments.map((seg) => (
                <circle
                  key={seg.zona}
                  cx="70"
                  cy="70"
                  r="52"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="18"
                  strokeDasharray={`${seg.dash} ${seg.circumference - seg.dash}`}
                  strokeDashoffset={-seg.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-2xl font-bold tabular-nums text-[#111C17]">
                {totalBooksCopies}
              </span>
              <span className="text-[11px] text-[#4A5D54]">Eksemplar</span>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            {zoneStats.map((z) => (
              <div key={z.zona} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#111C17] flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: z.color }}
                      aria-hidden="true"
                    />
                    {z.zona}
                  </span>
                  <span className="font-mono-tabular text-[#4A5D54]">
                    {z.copies} eks ({z.percent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${z.percent}%`, backgroundColor: z.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Weekly Program Participation Bar Infographic */}
      <div className="lg:col-span-6 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
            Infografis Partisipasi Mingguan
          </p>
          <h2 className="font-display text-lg font-bold text-[#111C17]">
            Keterisian Program Senin–Minggu
          </h2>
        </div>

        <div className="space-y-3.5 pt-1">
          {schedules.map((sch) => {
            const pct = Math.min(
              100,
              Math.round((sch.pesertaTerdaftar / Math.max(1, sch.kuota)) * 100),
            );
            return (
              <div key={sch.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#111C17] truncate">
                    {sch.program} · <span className="font-normal text-[#4A5D54]">{sch.hari}</span>
                  </span>
                  <span className="font-mono-tabular font-semibold text-[#111C17] shrink-0">
                    {sch.pesertaTerdaftar}/{sch.kuota} anak ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 80 ? config.accentColor : config.primaryColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MemberAgeDistributionChart({
  members,
  config,
}: {
  members: Member[];
  config: LandingConfig;
}) {
  const groups = useMemo(() => {
    const order: Member['jenjangUsia'][] = ['PAUD', 'SD', 'SMP', 'Umum'];
    const total = Math.max(1, members.length);
    return order.map((jenjang) => {
      const count = members.filter((m) => m.jenjangUsia === jenjang).length;
      const avgPoints =
        count > 0
          ? Math.round(
              members
                .filter((m) => m.jenjangUsia === jenjang)
                .reduce((s, m) => s + m.poin, 0) / count,
            )
          : 0;
      return {
        jenjang,
        count,
        pct: Math.round((count / total) * 100),
        avgPoints,
      };
    });
  }, [members]);

  return (
    <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--brand-accent-ink)' }}>
          Infografis Demografi Anggota
        </p>
        <h2 className="font-display text-lg font-bold text-[#111C17]">
          Sebaran Jenjang Usia & Rata-rata Poin
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {groups.map((g) => (
          <div key={g.jenjang} className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#4A5D54]">
              <span className="font-semibold text-[#111C17]">{g.jenjang}</span>
              <span className="font-mono-tabular">{g.pct}%</span>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums" style={{ color: 'var(--brand-primary-ink)' }}>
              {g.count}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
              <div
                className="h-full rounded-full"
                style={{ width: `${g.pct}%`, backgroundColor: config.primaryColor }}
              />
            </div>
            <p className="font-mono-tabular text-[11px] text-[#4A5D54]">
              Rata-rata: {g.avgPoints} pts
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
