import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Compass, PlayCircle, Sparkles, Star } from 'lucide-react';
import type { AlmahyraDatabase, Book } from '../types/almahyra';
import { computeZoneAdventureStats } from '../utils/almahyra';
import { CustomBookCoverSvg } from './CustomBookCoverSvg';
import { ResilientImage } from './ResilientImage';

interface AdventureZonesMapSectionProps {
  db: AlmahyraDatabase;
  onReadBook: (book: Book) => void;
  onFilterByZone: (zoneName: string) => void;
  onWatchZoneVideos?: (zoneId: string) => void;
}

export function AdventureZonesMapSection({
  db,
  onReadBook,
  onFilterByZone,
  onWatchZoneVideos,
}: AdventureZonesMapSectionProps) {
  const zones = useMemo(
    () => computeZoneAdventureStats(db.books, db.missions, db.passportLogs),
    [db.books, db.missions, db.passportLogs],
  );
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? 'zona-imajinasi');

  const activeZone = zones.find((z) => z.id === selectedZoneId) ?? zones[0];

  const zoneBooks = useMemo(() => {
    if (!activeZone) return [];
    const key = activeZone.name.toLowerCase().replace('zona ', '');
    return db.books
      .filter(
        (b) =>
          b.aktif !== false &&
          ((b.zona ?? '').toLowerCase().includes(key) ||
            (b.kategori ?? '').toLowerCase().includes(key)),
      )
      .slice(0, 3);
  }, [activeZone, db.books]);

  const fallbackZoneBooks = zoneBooks.length > 0 ? zoneBooks : db.books.slice(0, 2);

  return (
    <section
      id="petualangan-zona"
      aria-label="Peta Dunia Petualangan Enam Zona Almahyra"
      className="scroll-mt-20 rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-[#087C3B] dark:text-[#6EE7B7] flex items-center gap-1.5">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Peta Dunia Petualangan Literasi Almahyra
          </p>
          <h2 className="font-display text-2xl font-bold text-[#111C17]">
            6 Zona Petualangan Belajar & Misi Berkelanjutan
          </h2>
          <p className="mt-1 text-sm text-[#4A5D54]">
            Klik setiap zona untuk melihat target bacaan, aktivitas langsung, lencana zona, dan buku yang siap dibaca.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
          {onWatchZoneVideos && activeZone && (
            <button
              type="button"
              onClick={() => onWatchZoneVideos(activeZone.id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#DC2626] px-4 py-2 text-xs font-bold text-white hover:opacity-95 whitespace-nowrap shrink-0"
            >
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Video {activeZone.name}
            </button>
          )}
          <button
            type="button"
            onClick={() => activeZone && onFilterByZone(activeZone.name)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#087C3B] px-4 py-2 text-xs font-bold text-white hover:opacity-95 whitespace-nowrap shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Cari Buku {activeZone?.name}
          </button>
        </div>
      </div>

      {/* Interactive 6-Zone Selector Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone, idx) => {
          const isSelected = zone.id === activeZone?.id;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => setSelectedZoneId(zone.id)}
              aria-pressed={isSelected}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? 'shadow-md ring-2 ring-[#087C3B]/30 bg-[#FFFDF6]'
                  : 'border-[#E2E8E5] bg-[#F8FAF9] hover:border-[#BFD0C7]'
              }`}
              style={isSelected ? { borderColor: zone.color } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tabular text-xs font-bold text-[#4A5D54]">
                  ZONA 0{idx + 1}
                </span>
                <span
                  className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: zone.color }}
                >
                  {zone.bookCount} Buku · {zone.missionCount} Misi
                </span>
              </div>
              <h3 className="mt-2 font-display text-base font-bold text-[#111C17]">
                {zone.name}
              </h3>
              <p className="mt-0.5 text-xs text-[#4A5D54] line-clamp-1">{zone.tagline}</p>

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#4A5D54]">
                  <span>Aktivitas Komunitas</span>
                  <span className="font-mono-tabular">{zone.progressPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7EEEA]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${zone.progressPercent}%`, backgroundColor: zone.color }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Zone Detail Spotlight */}
      {activeZone && (
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-[#E7EEEA] bg-[#F8FAF9] p-5 lg:grid-cols-12">
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: activeZone.color }}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#111C17]">
                    {activeZone.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#4A5D54]">{activeZone.tagline}</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[#4A5D54]">{activeZone.description}</p>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#111C17]">Aktivitas Seru di Zona Ini:</p>
                <ul className="space-y-1.5">
                  {activeZone.activities.map((act) => (
                    <li
                      key={act}
                      className="flex items-center gap-2 text-xs font-medium text-[#4A5D54]"
                    >
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: activeZone.color }}
                        aria-hidden="true"
                      />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#DCE4DF] bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-xs">
                <Star className="h-4 w-4 text-[#F58220] fill-[#FFC51B]" aria-hidden="true" />
                <span className="font-semibold text-[#111C17]">
                  Hadiah Lencana: <strong>{activeZone.rewardBadge}</strong>
                </span>
              </div>
              <span className="font-mono-tabular text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                {activeZone.completedCount} stempel
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-bold text-[#111C17]">
              Buku Pilihan di {activeZone.name} (Klik untuk Baca Penuh Layar):
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fallbackZoneBooks.slice(0, 2).map((book) => (
                <div
                  key={book.id}
                  className="flex gap-3 rounded-xl border border-[#DCE4DF] bg-white p-3"
                >
                  <div
                    className={`h-24 w-20 overflow-hidden rounded-lg shrink-0 ${
                      book.coverUrl ? 'bg-[#EDF3EF] p-0.5' : 'bg-[#EEF3F0]'
                    }`}
                  >
                    {book.coverUrl ? (
                      <ResilientImage
                        src={book.coverUrl}
                        alt={`Sampul ${book.judul}`}
                        className="h-full w-full object-contain"
                        renderFallback={() => <CustomBookCoverSvg book={book} />}
                      />
                    ) : (
                      <CustomBookCoverSvg book={book} />
                    )}
                  </div>
                  <div className="flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-[11px] font-semibold text-[#087C3B] dark:text-[#6EE7B7] truncate">
                        {book.kategori}
                      </p>
                      <h4 className="font-display text-sm font-bold text-[#111C17] line-clamp-2">
                        {book.judul}
                      </h4>
                      <p className="text-[11px] text-[#4A5D54] truncate">
                        {book.jenjangPembaca ?? 'Semua Usia'} · {book.estimasiMenit ?? 5} mnt
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onReadBook(book)}
                      style={{ backgroundColor: activeZone.color }}
                      className="mt-2 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:opacity-95"
                    >
                      <BookOpen className="h-3 w-3" aria-hidden="true" />
                      Baca Buku
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
