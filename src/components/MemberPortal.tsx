import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  NotebookPen,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';
import { DEFAULT_HERO_IMAGE_URL, DEFAULT_LOGO_URL } from '../data/defaultDb';
import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  CreationCategory,
  ReadingProgress,
} from '../types/almahyra';
import {
  calculateLevelInfo,
  computeBookShelves,
  computeZoneAdventureStats,
  DEFAULT_CATEGORIES,
  DEFAULT_READER_LEVELS,
  filterBooksAdvanced,
  getMemberLoans,
  getMemberPassportLogs,
  isBookActive,
} from '../utils/almahyra';
import { LevelProgressionInfographic } from './AlmahyraInfographics';
import { BookCard } from './BookCard';
import { Card3DPassport } from './Card3DPassport';
import { CreationGallerySection } from './CreationGallerySection';
import { DigitalCertificateModal } from './DigitalCertificateModal';
import { ResilientImage } from './ResilientImage';

interface MemberPortalProps {
  db: AlmahyraDatabase;
  session: AuthSession;
  activePage: 'passport' | 'catalog' | 'schedule';
  onReadBook: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  onSubmitCreation: (payload: {
    judul: string;
    kategori: CreationCategory;
    namaSamaran: string;
    jenjangUsia: string;
    ringkasan: string;
    konten: string;
  }) => Promise<{ ok: boolean; message: string }>;
  onModerateCreation: (
    creationId: string,
    action: 'approve' | 'reject' | 'parent-approve',
    catatan?: string,
  ) => Promise<{ ok: boolean; message: string }>;
  onUpdateMemberProfile: (payload: {
    nomorInduk?: string;
    targetMingguan?: number;
    orangTua?: string;
  }) => Promise<{ ok: boolean; message: string }>;
}

export function MemberPortal({
  db,
  session,
  activePage,
  onReadBook,
  onToggleFavorite,
  onSubmitCreation,
  onModerateCreation,
  onUpdateMemberProfile,
}: MemberPortalProps) {
  const [dashboardView, setDashboardView] = useState<'anak' | 'orangtua'>('anak');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedLevel, setSelectedLevel] = useState('Semua');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  const member = useMemo(() => {
    return (
      db.members.find(
        (m) =>
          m.id === session.memberId ||
          m.nomorInduk.toLowerCase() === (session.nomorInduk ?? session.username).toLowerCase(),
      ) ?? db.members[0]
    );
  }, [db.members, session]);

  const [draftParentName, setDraftParentName] = useState(member?.orangTua ?? '');
  const [draftWeeklyTarget, setDraftWeeklyTarget] = useState(member?.targetMingguan ?? 3);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (member?.orangTua && member.orangTua !== 'Wali Anggota Terdaftar') {
      setDraftParentName(member.orangTua);
    }
  }, [member?.orangTua]);

  useEffect(() => {
    if (typeof member?.targetMingguan === 'number') {
      setDraftWeeklyTarget(member.targetMingguan);
    }
  }, [member?.targetMingguan]);

  const viewerKey = member?.nomorInduk ?? 'guest';

  const levelInfo = useMemo(() => calculateLevelInfo(member?.poin ?? 0), [member?.poin]);
  const memberLoans = useMemo(
    () => (member ? getMemberLoans(db.loans, member.nomorInduk) : []),
    [db.loans, member],
  );
  const memberLogs = useMemo(
    () => (member ? getMemberPassportLogs(db.passportLogs, member.nomorInduk) : []),
    [db.passportLogs, member],
  );

  const memberCreations = useMemo(
    () =>
      (db.creations ?? []).filter(
        (c) => c.memberNomorInduk?.toUpperCase() === viewerKey.toUpperCase(),
      ),
    [db.creations, viewerKey],
  );

  const zoneProgress = useMemo(
    () => computeZoneAdventureStats(db.books, db.missions, memberLogs),
    [db.books, db.missions, memberLogs],
  );

  const progressMap = useMemo(() => {
    const map = new Map<string, ReadingProgress>();
    for (const p of db.readingProgress ?? []) {
      if (p.viewerKey === viewerKey) {
        map.set(p.bookId, p);
      }
    }
    return map;
  }, [db.readingProgress, viewerKey]);

  const favoriteBookIds = useMemo(() => {
    const ids = new Set<string>();
    progressMap.forEach((p, bookId) => {
      if (p.isFavorite) ids.add(bookId);
    });
    return ids;
  }, [progressMap]);

  const memberJournals = useMemo(
    () =>
      (db.readingJournals ?? []).filter(
        (j) => j.nomorInduk.toLowerCase() === viewerKey.toLowerCase(),
      ),
    [db.readingJournals, viewerKey],
  );

  const memberHistoryBooks = useMemo(() => {
    const bookMap = new Map(db.books.map((b) => [b.id, b]));
    return Array.from(progressMap.values())
      .sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt))
      .map((prog) => ({ prog, book: bookMap.get(prog.bookId) }))
      .filter((x): x is { prog: ReadingProgress; book: Book } => Boolean(x.book));
  }, [db.books, progressMap]);

  const categories = useMemo(() => {
    const base =
      db.categories && db.categories.length > 0 ? db.categories : [...DEFAULT_CATEGORIES];
    const fromBooks = db.books.filter(isBookActive).map((b) => b.kategori);
    return ['Semua', ...Array.from(new Set([...base, ...fromBooks]))];
  }, [db.books, db.categories]);

  const readerLevels = useMemo(() => {
    const base =
      db.readerLevels && db.readerLevels.length > 0
        ? db.readerLevels
        : [...DEFAULT_READER_LEVELS];
    return ['Semua', ...base];
  }, [db.readerLevels]);

  const filteredBooks = useMemo(
    () =>
      filterBooksAdvanced(db.books, {
        query: searchQuery,
        category: selectedCategory,
        readerLevel: selectedLevel,
        favoriteBookIds,
        onlyFavorites: favoritesOnly,
        onlyActive: true,
      }),
    [db.books, searchQuery, selectedCategory, selectedLevel, favoriteBookIds, favoritesOnly],
  );

  const personalRecommendations = useMemo(() => {
    if (!member) return [];
    return computeBookShelves(db.books, member.jenjangUsia).rekomendasi;
  }, [db.books, member]);

  if (!member) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-sm text-[#4A5D54]">Data anggota tidak ditemukan.</p>
      </main>
    );
  }

  const weeklyTarget = member.targetMingguan ?? 3;
  const completedBooksCount = Math.max(
    Array.from(progressMap.values()).reduce((sum, p) => sum + p.completedCount, 0),
    memberJournals.length,
  );
  const targetPercent = Math.min(100, Math.round((completedBooksCount / weeklyTarget) * 100));
  const latestRead = memberHistoryBooks[0];

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice(null);
    try {
      const res = await onUpdateMemberProfile({
        nomorInduk: member.nomorInduk,
        orangTua: draftParentName.trim() || member.orangTua,
        targetMingguan: draftWeeklyTarget,
      });
      setProfileNotice(res.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Mascot Greeting & Child/Parent Mode Switcher Header */}
      <section className="rounded-3xl border border-[#DCE4DF] bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <ResilientImage
              src={db.config.logoUrl}
              fallbackSrc={DEFAULT_LOGO_URL}
              alt="Maskot Almahyra"
              className="h-16 w-16 rounded-2xl border-2 border-[#FFC51B] object-cover bg-white preserve-light shrink-0"
            />
            <div>
              <p className="font-mono-tabular text-xs font-semibold text-[#087C3B] dark:text-[#6EE7B7]">
                ID {member.nomorInduk} · Jenjang {member.jenjangUsia} · Wali: {member.orangTua}
              </p>
              <h1 className="mt-0.5 font-display text-2xl font-extrabold text-[#111C17]">
                {dashboardView === 'anak'
                  ? `Halo Petualang, ${member.nama}!`
                  : `Dasbor Pendampingan Orang Tua · ${member.nama}`}
              </h1>
              <p className="text-xs sm:text-sm text-[#4A5D54]">
                Level: <strong className="text-[#111C17]">{levelInfo.currentLevel}</strong> ·{' '}
                <span className="font-mono-tabular font-bold text-[#F58220]">{member.poin} Bintang/Poin</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Child vs Parent Switch */}
            <div
              role="group"
              aria-label="Pilih tampilan dasbor anak atau orang tua"
              className="inline-flex rounded-xl border border-[#DCE4DF] bg-[#FFF8E8] p-1"
            >
              <button
                type="button"
                onClick={() => setDashboardView('anak')}
                aria-pressed={dashboardView === 'anak'}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                  dashboardView === 'anak'
                    ? 'bg-[#087C3B] text-white shadow-xs'
                    : 'text-[#3E5B4C] hover:text-[#10281B] dark:text-[#A5C0B4] dark:hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Dasbor Anak
              </button>
              <button
                type="button"
                onClick={() => setDashboardView('orangtua')}
                aria-pressed={dashboardView === 'orangtua'}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                  dashboardView === 'orangtua'
                    ? 'bg-[#08A9EF] text-white shadow-xs'
                    : 'text-[#3E5B4C] hover:text-[#10281B] dark:text-[#A5C0B4] dark:hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Dasbor Orang Tua
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCertOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC51B] px-4 py-2.5 text-xs font-extrabold text-[#10281B] shadow-xs hover:opacity-95"
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              Sertifikat Digital
            </button>
          </div>
        </div>

        {/* Stat Bar */}
        <div className="grid grid-cols-2 gap-4 border-t border-[#EEF3F0] pt-4 sm:grid-cols-4 font-mono-tabular">
          <div>
            <span className="block text-xs text-[#4A5D54]">Buku Selesai</span>
            <span className="text-xl font-bold text-[#087C3B] dark:text-[#6EE7B7]">
              {completedBooksCount}
            </span>
          </div>
          <div>
            <span className="block text-xs text-[#4A5D54]">Lencana Diraih</span>
            <span className="text-xl font-bold text-[#111C17]">{member.lencana.length}</span>
          </div>
          <div>
            <span className="block text-xs text-[#4A5D54]">Karya Saya</span>
            <span className="text-xl font-bold text-[#F58220]">{memberCreations.length}</span>
          </div>
          <div>
            <span className="block text-xs text-[#4A5D54]">Pinjaman Aktif</span>
            <span className="text-xl font-bold text-[#111C17]">
              {memberLoans.filter((l) => l.status === 'Dipinjam').length}
            </span>
          </div>
        </div>
      </section>

      {/* PAGE 1: DASBOR ANAK / ORANG TUA + E-PASPOR */}
      {activePage === 'passport' &&
        (dashboardView === 'anak' ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-6">
              <Card3DPassport member={member} config={db.config} />

              {/* Resume Latest Reading */}
              {latestRead && (
                <section className="rounded-2xl border border-[#DCE4DF] bg-white p-5 space-y-3">
                  <p className="text-xs font-bold text-[#08A9EF] flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Lanjutkan Bacaan Terakhir
                  </p>
                  <div className="flex items-center gap-3">
                    <ResilientImage
                      src={latestRead.book.coverUrl}
                      fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                      alt={latestRead.book.judul}
                      className="h-16 w-14 rounded-lg object-cover bg-[#EEF3F0] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-sm font-bold text-[#111C17] truncate">
                        {latestRead.book.judul}
                      </h2>
                      <p className="text-xs text-[#4A5D54]">
                        Halaman {latestRead.prog.lastPage + 1}/{latestRead.prog.totalPages}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onReadBook(latestRead.book)}
                      className="rounded-xl bg-[#087C3B] px-3.5 py-2 text-xs font-bold text-white shrink-0"
                    >
                      Baca
                    </button>
                  </div>
                </section>
              )}

              {/* Weekly Target & Missions */}
              <section className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#F58220]" />
                    Target Membaca Mingguan
                  </h2>
                  <span className="font-mono-tabular text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                    {completedBooksCount}/{weeklyTarget} Buku
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${targetPercent}%`, backgroundColor: db.config.primaryColor }}
                  />
                </div>
                <div className="space-y-2 pt-1">
                  {(db.challenges ?? []).slice(0, 2).map((ch) => (
                    <div
                      key={ch.id}
                      className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111C17]">{ch.judul}</span>
                        <span className="font-mono-tabular font-bold text-[#F58220]">
                          +{ch.bonusPoin} pts
                        </span>
                      </div>
                      <p className="text-[#4A5D54]">{ch.deskripsi}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-7 space-y-6">
              {/* 6-Zone Progress Chips */}
              <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                    <Compass className="h-5 w-5 text-[#087C3B]" aria-hidden="true" />
                    Progres 6 Zona Petualangan Saya
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {zoneProgress.map((zp) => (
                    <div
                      key={zp.id}
                      className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#111C17]">{zp.name}</span>
                        <span className="font-mono-tabular font-bold" style={{ color: zp.color }}>
                          {zp.completedCount} stempel
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7EEEA]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${zp.progressPercent}%`, backgroundColor: zp.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Badges */}
              <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-[#111C17]">
                    Lencana &amp; Apresiasi
                  </h2>
                  <Award className="h-5 w-5 text-[#F58220]" aria-hidden="true" />
                </div>

                {member.lencana.length === 0 ? (
                  <p className="text-sm text-[#4A5D54]">
                    Belum ada lencana. Selesaikan bacaan atau misi literasi pertama!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {member.lencana.map((badge) => (
                      <div
                        key={badge}
                        className="flex items-center gap-3 rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] px-4 py-3"
                      >
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-[#087C3B]"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold text-[#111C17]">{badge}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-[#4A5D54] pt-2 border-t border-[#EEF3F0]">
                  Target apresiasi berikutnya: {levelInfo.rewardHint}
                </p>
              </section>

              {/* Stempel Digital Logs */}
              <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#111C17]">
                  Stempel Digital &amp; Riwayat E-Paspor Baca
                </h2>
                {memberLogs.length === 0 ? (
                  <p className="text-sm text-[#4A5D54]">
                    Belum ada stempel E-Paspor. Baca buku di Katalog untuk mendapatkan stempel otomatis!
                  </p>
                ) : (
                  <div className="divide-y divide-[#EEF3F0]">
                    {memberLogs.map((log) => (
                      <div key={log.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-[#111C17]">
                            {log.judulBuku ? `${log.judulBuku}` : log.misi} ·{' '}
                            {log.kategoriBuku ?? log.zona}
                          </p>
                          <span className="font-mono-tabular text-xs font-bold shrink-0 text-[#087C3B] dark:text-[#6EE7B7]">
                            +{log.poin} pts
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#4A5D54]">{log.catatan}</p>
                        <p className="mt-1 text-[11px] text-[#6B7D74]">
                          {log.tanggal} · {log.misi} · Verifikasi: {log.pendamping}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Personal Recommendations */}
              <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F58220]" />
                  Rekomendasi Bacaan Untuk Jenjang {member.jenjangUsia}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {personalRecommendations.slice(0, 2).map((b) => (
                    <BookCard
                      key={b.id}
                      book={b}
                      config={db.config}
                      progress={progressMap.get(b.id)}
                      onRead={onReadBook}
                      onToggleFavorite={onToggleFavorite}
                      compact
                    />
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-12 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#111C17]">
                Peta Perjalanan Jenjang E-Paspor Baca
              </h2>
              <LevelProgressionInfographic config={db.config} currentPoints={member.poin} />
            </div>
          </div>
        ) : (
          /* DASBOR ORANG TUA / WALI */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-6">
              {/* Parent Summary & Profile Controls */}
              <section className="rounded-2xl border border-[#DCE4DF] bg-white p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#08A9EF]" aria-hidden="true" />
                  Profil Keluarga &amp; Target Mingguan Anak
                </h2>
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label htmlFor="p-wali" className="block text-xs font-bold text-[#111C17]">
                      Nama Orang Tua / Wali Pendamping
                    </label>
                    <input
                      id="p-wali"
                      type="text"
                      value={draftParentName}
                      onChange={(e) => setDraftParentName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-sm text-[#111C17]"
                    />
                  </div>
                  <div>
                    <label htmlFor="p-target" className="block text-xs font-bold text-[#111C17]">
                      Target Buku Mingguan ({draftWeeklyTarget} buku/minggu)
                    </label>
                    <input
                      id="p-target"
                      type="range"
                      min={1}
                      max={10}
                      value={draftWeeklyTarget}
                      onChange={(e) => setDraftWeeklyTarget(Number(e.target.value))}
                      className="mt-1 w-full accent-[#087C3B]"
                    />
                  </div>
                  {profileNotice && (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                      {profileNotice}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full rounded-xl bg-[#087C3B] py-2.5 text-xs font-bold text-white hover:opacity-95"
                  >
                    {savingProfile ? 'Menyimpan...' : 'Simpan Profil Pendampingan'}
                  </button>
                </form>
              </section>

              {/* Parent Consent / Moderation Control for Child's Submitted Creations */}
              <section className="rounded-2xl border border-[#DCE4DF] bg-white p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#087C3B]" aria-hidden="true" />
                  Persetujuan Karya Anak ({memberCreations.length})
                </h2>
                <p className="text-xs text-[#4A5D54]">
                  Karya anak hanya tampil di Galeri Publik setelah mendapat persetujuan Orang Tua dan lolos moderasi Admin.
                </p>

                {memberCreations.length === 0 ? (
                  <p className="text-xs text-[#4A5D54]">
                    Belum ada karya yang dikirim oleh {member.nama}.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {memberCreations.map((cr) => (
                      <div
                        key={cr.id}
                        className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-sm font-bold text-[#111C17]">
                              {cr.judul}
                            </p>
                            <p className="text-[11px] text-[#4A5D54]">
                              {cr.kategori} · Status Admin: <strong>{cr.moderationStatus}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onModerateCreation(cr.id, 'parent-approve')}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                              cr.parentApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cr.parentApproved ? 'Diizinkan Wali ✓' : 'Izinkan Publikasi'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-7 space-y-6">
              {/* Jurnal Literasi Bersama */}
              <section className="rounded-2xl border border-[#DCE4DF] bg-white p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                  <NotebookPen className="h-5 w-5 text-[#F58220]" aria-hidden="true" />
                  Jurnal Literasi Anak ({memberJournals.length})
                </h2>
                {memberJournals.length === 0 ? (
                  <p className="text-sm text-[#4A5D54]">
                    Belum ada catatan jurnal. Ajak anak mengisi refleksi singkat setelah membaca buku!
                  </p>
                ) : (
                  <div className="divide-y divide-[#EEF3F0]">
                    {memberJournals.map((j) => (
                      <div key={j.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#111C17]">{j.judulBuku}</span>
                          <span className="font-mono-tabular text-[#4A5D54]">{j.tanggal}</span>
                        </div>
                        <p className="text-xs text-[#4A5D54]">{j.catatan}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Printed Book Loans Summary */}
              <section className="rounded-2xl border border-[#DCE4DF] bg-white p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#087C3B]" aria-hidden="true" />
                  Monitoring Peminjaman Buku Cetak
                </h2>
                {memberLoans.length === 0 ? (
                  <p className="text-sm text-[#4A5D54]">Belum ada riwayat pinjaman buku cetak.</p>
                ) : (
                  <div className="divide-y divide-[#EEF3F0]">
                    {memberLoans.map((ln) => (
                      <div key={ln.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-bold text-[#111C17]">{ln.judulBuku}</p>
                          <p className="font-mono-tabular text-[#4A5D54]">
                            Pinjam: {ln.tanggalPinjam} · Batas kembali: {ln.batasKembali}
                          </p>
                        </div>
                        <span
                          className={`font-bold ${
                            ln.status === 'Dikembalikan' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {ln.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        ))}

      {/* PAGE 2: KATALOG DIGITAL, BACA INTERAKTIF & MISI LITERASI */}
      {activePage === 'catalog' && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111C17]">
                  Katalog Koleksi Buku Digital &amp; Cetak ({filteredBooks.length})
                </h2>
                <p className="text-xs text-[#4A5D54]">
                  Klik Baca Sekarang untuk membaca halaman buku, audio narasi, kuis, dan mencatat stempel E-Paspor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7D74]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul, penulis, kode..."
                    aria-label="Cari katalog anggota"
                    className="w-full rounded-lg border border-[#DCE4DF] bg-white py-2 pl-9 pr-3 text-xs focus:border-[#087C3B] focus:outline-none"
                  />
                </div>

                <select
                  aria-label="Filter jenjang anggota"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-xs font-semibold text-[#111C17]"
                >
                  {readerLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Jenjang: {lvl}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setFavoritesOnly((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    favoritesOnly
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-[#DCE4DF] bg-white text-[#111C17]'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                  Favorit ({favoriteBookIds.size})
                </button>
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredBooks.map((b) => (
                <BookCard
                  key={b.id}
                  book={b}
                  config={db.config}
                  progress={progressMap.get(b.id)}
                  onRead={onReadBook}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#F58220]" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-[#111C17]">
                Daftar Misi Literasi Almahyra
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {db.missions.map((m) => (
                <div key={m.id} className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-[#111C17]">{m.judul}</h3>
                    <span className="font-mono-tabular text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
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

      {/* PAGE 3: RIWAYAT MEMBACA, JURNAL, PEMINJAMAN, JADWAL & KARYA */}
      {activePage === 'schedule' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <section className="lg:col-span-6 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#087C3B]" />
                <h2 className="font-display text-lg font-bold text-[#111C17]">
                  Riwayat Membaca &amp; Penanda Halaman
                </h2>
              </div>
              {memberHistoryBooks.length === 0 ? (
                <p className="text-sm text-[#4A5D54]">
                  Belum ada riwayat membaca digital. Buka Katalog untuk mulai petualangan pertama!
                </p>
              ) : (
                <div className="divide-y divide-[#EEF3F0]">
                  {memberHistoryBooks.map(({ prog, book }) => (
                    <div key={prog.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#111C17] truncate">
                          {book.judul}
                        </p>
                        <p className="text-xs text-[#4A5D54]">
                          Halaman {prog.lastPage + 1}/{prog.totalPages} · {prog.completedCount}x selesai
                          {prog.quizScore !== undefined ? ` · Kuis ${prog.quizScore}%` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onReadBook(book)}
                        style={{ backgroundColor: db.config.primaryColor }}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shrink-0"
                      >
                        Lanjut Baca
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="lg:col-span-6 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-[#F58220]" />
                <h2 className="font-display text-lg font-bold text-[#111C17]">
                  Jurnal Membaca Saya ({memberJournals.length})
                </h2>
              </div>
              {memberJournals.length === 0 ? (
                <p className="text-sm text-[#4A5D54]">
                  Belum ada catatan jurnal. Selesaikan membaca buku dan tuliskan kesanmu!
                </p>
              ) : (
                <div className="divide-y divide-[#EEF3F0]">
                  {memberJournals.map((j) => (
                    <div key={j.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#111C17]">{j.judulBuku}</span>
                        <span className="font-mono-tabular text-[#4A5D54]">{j.tanggal}</span>
                      </div>
                      <p className="text-xs text-[#4A5D54]">{j.catatan}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <section className="lg:col-span-6 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#087C3B]" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-[#111C17]">
                  Riwayat Peminjaman Buku Cetak
                </h2>
              </div>

              {memberLoans.length === 0 ? (
                <p className="text-sm text-[#4A5D54]">Belum ada riwayat peminjaman buku.</p>
              ) : (
                <div className="divide-y divide-[#EEF3F0]">
                  {memberLoans.map((ln) => (
                    <div key={ln.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-sm text-[#111C17]">{ln.judulBuku}</p>
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
                <Calendar className="h-5 w-5 text-[#F58220]" aria-hidden="true" />
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

          {/* Galeri & Kirim Karya untuk Anggota */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F58220]">
              <Palette className="h-4 w-4" aria-hidden="true" />
              <span>Berkarya &amp; Kirim Karyamu</span>
            </div>
            <CreationGallerySection
              db={db}
              session={session}
              onSubmitCreation={onSubmitCreation}
            />
          </div>
        </div>
      )}

      <DigitalCertificateModal
        open={certOpen}
        recipientName={member.nama}
        memberCode={member.nomorInduk}
        points={member.poin}
        stampsCount={memberLogs.length}
        badges={member.lencana}
        config={db.config}
        onClose={() => setCertOpen(false)}
      />
    </main>
  );
}
