import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Search,
} from 'lucide-react';
import type { AlmahyraDatabase, AuthSession } from '../types/almahyra';
import {
  calculateLevelInfo,
  filterBooks,
  getMemberLoans,
  getMemberPassportLogs,
} from '../utils/almahyra';
import { LevelProgressionInfographic } from './AlmahyraInfographics';
import { Card3DPassport } from './Card3DPassport';

interface MemberPortalProps {
  db: AlmahyraDatabase;
  session: AuthSession;
  activePage: 'passport' | 'catalog' | 'schedule';
}

export function MemberPortal({ db, session, activePage }: MemberPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const member = useMemo(() => {
    return (
      db.members.find(
        (m) =>
          m.id === session.memberId ||
          m.nomorInduk.toLowerCase() === (session.nomorInduk ?? session.username).toLowerCase(),
      ) ?? db.members[0]
    );
  }, [db.members, session]);

  const levelInfo = useMemo(() => calculateLevelInfo(member?.poin ?? 0), [member?.poin]);
  const memberLoans = useMemo(
    () => (member ? getMemberLoans(db.loans, member.nomorInduk) : []),
    [db.loans, member],
  );
  const memberLogs = useMemo(
    () => (member ? getMemberPassportLogs(db.passportLogs, member.nomorInduk) : []),
    [db.passportLogs, member],
  );

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(db.books.map((b) => b.kategori)))],
    [db.books],
  );
  const filteredBooks = useMemo(
    () => filterBooks(db.books, searchQuery, selectedCategory),
    [db.books, searchQuery, selectedCategory],
  );

  if (!member) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-sm text-[#4A5D54]">Data anggota tidak ditemukan.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Compact Member Welcome Header */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[#E2E8E5] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono-tabular text-xs text-[#4A5D54]">
            Nomor Induk: {member.nomorInduk} · Jenjang {member.jenjangUsia}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#111C17]">
            Halo, {member.nama}
          </h1>
          <p className="text-sm text-[#4A5D54]">
            Level saat ini: <strong className="text-[#111C17]">{levelInfo.currentLevel}</strong> · {member.poin} poin terkumpul
          </p>
        </div>
        <div className="flex items-center gap-6 font-mono-tabular">
          <div>
            <span className="block text-xs text-[#4A5D54]">Lencana</span>
            <span className="text-lg font-bold text-[#111C17]">{member.lencana.length}</span>
          </div>
          <div>
            <span className="block text-xs text-[#4A5D54]">Pinjaman Aktif</span>
            <span className="text-lg font-bold text-[#111C17]">
              {memberLoans.filter((l) => l.status === 'Dipinjam').length}
            </span>
          </div>
        </div>
      </section>

      {/* PAGE 1: BERANDA & 3D E-PASPOR */}
      {activePage === 'passport' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card3DPassport member={member} config={db.config} />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#111C17]">
                  Lencana & Apresiasi
                </h2>
                <Award className="h-5 w-5" style={{ color: db.config.accentColor }} aria-hidden="true" />
              </div>

              {member.lencana.length === 0 ? (
                <p className="text-sm text-[#4A5D54]">
                  Belum ada lencana. Selesaikan misi literasi pertama bersama pendamping!
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {member.lencana.map((badge) => (
                    <div
                      key={badge}
                      className="flex items-center gap-3 rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] px-4 py-3"
                    >
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        style={{ color: db.config.primaryColor }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold text-[#111C17]">
                        {badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-[#4A5D54] pt-2 border-t border-[#EEF3F0]">
                Target apresiasi: {levelInfo.rewardHint}
              </p>
            </section>

            <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111C17]">
                Riwayat Verifikasi E-Paspor Baca
              </h2>
              {memberLogs.length === 0 ? (
                <p className="text-sm text-[#4A5D54]">
                  Belum ada riwayat misi tervalidasi.
                </p>
              ) : (
                <div className="divide-y divide-[#EEF3F0]">
                  {memberLogs.map((log) => (
                    <div key={log.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-[#111C17]">
                          {log.misi} · {log.zona}
                        </p>
                        <span
                          className="font-mono-tabular text-xs font-bold"
                          style={{ color: db.config.primaryColor }}
                        >
                          +{log.poin} pts
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#4A5D54]">{log.catatan}</p>
                      <p className="mt-1 text-[11px] text-[#6B7D74]">
                        {log.tanggal} · Pendamping: {log.pendamping}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-12 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#111C17]">
              Peta Perjalanan Jenjang E-Paspor Baca
            </h2>
            <LevelProgressionInfographic
              config={db.config}
              currentPoints={member.poin}
            />
          </div>
        </div>
      )}

      {/* PAGE 2: KATALOG & MISI LITERASI */}
      {activePage === 'catalog' && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111C17]">
                  Katalog Koleksi Buku
                </h2>
                <p className="text-xs text-[#4A5D54]">
                  Pilih buku yang ingin dibaca di teras atau dipinjam pulang.
                </p>
              </div>
              <div className="relative w-full lg:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7D74]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul atau kode..."
                  aria-label="Cari katalog anggota"
                  className="w-full rounded-lg border border-[#DCE4DF] bg-white py-2 pl-9 pr-3 text-sm focus:border-[#1B4332] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'text-white'
                      : 'bg-[#F2F6F4] text-[#4A5D54] hover:text-[#111C17]'
                  }`}
                  style={selectedCategory === cat ? { backgroundColor: db.config.primaryColor } : undefined}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredBooks.map((b) => (
                <div
                  key={b.id}
                  className="book-3d-card rounded-xl border border-[#E2E8E5] bg-[#F8FAF9] p-3.5 space-y-2.5"
                >
                  {b.coverUrl && (
                    <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-[#E7EEEA]">
                      <img
                        src={b.coverUrl}
                        alt={`Sampul ${b.judul}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#4A5D54]">
                    <span className="font-mono-tabular">{b.kodeBuku}</span>
                    <span className={b.status === 'Tersedia' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {b.status}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#111C17]">
                    {b.judul}
                  </h3>
                  <p className="text-xs text-[#4A5D54]">{b.penulis} · {b.lokasiRak}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5" style={{ color: db.config.accentColor }} aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-[#111C17]">
                Daftar Misi Literasi Almahyra
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {db.missions.map((m) => (
                <div key={m.id} className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-[#111C17]">
                      {m.judul}
                    </h3>
                    <span className="font-mono-tabular text-xs font-bold" style={{ color: db.config.primaryColor }}>
                      +{m.poin} pts
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5D54]">{m.tugas}</p>
                  <p className="text-[11px] text-[#6B7D74]">
                    {m.zona} · Verifikasi: {m.verifikasi}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* PAGE 3: JADWAL & RIWAYAT PEMINJAMAN */}
      {activePage === 'schedule' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="lg:col-span-6 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" style={{ color: db.config.primaryColor }} aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-[#111C17]">
                Riwayat Peminjaman Saya
              </h2>
            </div>

            {memberLoans.length === 0 ? (
              <p className="text-sm text-[#4A5D54]">Belum ada riwayat peminjaman buku.</p>
            ) : (
              <div className="divide-y divide-[#EEF3F0]">
                {memberLoans.map((ln) => (
                  <div key={ln.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm text-[#111C17]">
                        {ln.judulBuku}
                      </p>
                      <p className="text-xs text-[#4A5D54] font-mono-tabular">
                        {ln.kodeBuku} · Pinjam: {ln.tanggalPinjam} · Batas: {ln.batasKembali}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                        ln.status === 'Dikembalikan' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {ln.status === 'Dikembalikan' ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {ln.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-6 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: db.config.accentColor }} aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-[#111C17]">
                Agenda Kegiatan Teras Almahyra
              </h2>
            </div>
            <div className="divide-y divide-[#EEF3F0]">
              {db.schedules.map((sch) => (
                <div key={sch.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs text-[#4A5D54]">
                    <span className="font-semibold text-[#111C17]">{sch.hari}</span>
                    <span className="font-mono-tabular">{sch.waktu}</span>
                  </div>
                  <p className="mt-1 font-display text-sm font-bold text-[#111C17]">
                    {sch.program}
                  </p>
                  <p className="mt-0.5 text-xs text-[#4A5D54]">{sch.aktivitas}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
