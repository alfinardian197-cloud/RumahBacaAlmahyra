import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Award,
  Check,
  CloudDownload,
  CloudUpload,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  NotebookPen,
  Palette,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../data/defaultDb';
import {
  getCachedGoogleToken,
  signInWithGoogleSheets,
  signOutGoogleSheets,
} from '../services/googleAuth';
import {
  createAlmahyraSpreadsheet,
  pullDatabaseFromGoogleSheet,
  pushDatabaseToGoogleSheet,
} from '../services/sheetsSync';
import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  LandingConfig,
  Member,
} from '../types/almahyra';
import {
  calculateLevelInfo,
  computeCompanionDashboard,
  computeLibraryStats,
  exportRecordsToCsv,
  extractSpreadsheetId,
} from '../utils/almahyra';
import { extractColorsFromLogoUrl } from '../utils/logoColors';
import {
  CollectionZoneInfographic,
  MemberAgeDistributionChart,
} from './AlmahyraInfographics';
import { BookCollectionManager } from './BookCollectionManager';
import { ResilientImage } from './ResilientImage';
import { Card3DPassport } from './Card3DPassport';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminPortalProps {
  db: AlmahyraDatabase;
  session: AuthSession;
  activePage: 'data' | 'reports' | 'appearance';
  onUpdateDb: (nextDb: AlmahyraDatabase) => Promise<void>;
  onResetDb: () => Promise<void>;
}

export function AdminPortal({
  db,
  session,
  activePage,
  onUpdateDb,
  onResetDb,
}: AdminPortalProps) {
  const [dataTab, setDataTab] = useState<'members' | 'books' | 'loans' | 'passport'>('members');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Member form & preview
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberJenjang, setNewMemberJenjang] = useState<Member['jenjangUsia']>('SD');
  const [newMemberParent, setNewMemberParent] = useState('');
  const [previewMember, setPreviewMember] = useState<Member | null>(null);

  // Loan form
  const [loanMemberCode, setLoanMemberCode] = useState(db.members[0]?.nomorInduk ?? '');
  const [loanBookCode, setLoanBookCode] = useState(
    db.books.find((b) => b.status === 'Tersedia')?.kodeBuku ?? '',
  );

  // Passport verification form
  const [pasMemberCode, setPasMemberCode] = useState(db.members[0]?.nomorInduk ?? '');
  const [pasMissionId, setPasMissionId] = useState(db.missions[0]?.id ?? '');
  const [pasNote, setPasNote] = useState('');

  // Schedule form (Page 2)
  const [schHari, setSchHari] = useState('');
  const [schWaktu, setSchWaktu] = useState('15.30–17.00 WIB');
  const [schProgram, setSchProgram] = useState('');
  const [schAktivitas, setSchAktivitas] = useState('');

  // Landing Config Draft (Page 3)
  const [draftConfig, setDraftConfig] = useState<LandingConfig>(db.config);
  const [spreadsheetInput, setSpreadsheetInput] = useState(db.config.spreadsheetId);
  const [googleToken, setGoogleToken] = useState<string | null>(() => getCachedGoogleToken());
  const [googleUserEmail, setGoogleUserEmail] = useState<string>('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Superadmin new staff account
  const [staffName, setStaffName] = useState('');
  const [staffUser, setStaffUser] = useState('');
  const [staffPass, setStaffPass] = useState('');

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'primary' | 'danger';
    action: (() => Promise<void>) | null;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Konfirmasi',
    variant: 'primary',
    action: null,
  });

  const stats = useMemo(() => computeLibraryStats(db), [db]);
  const companionDashboard = useMemo(() => computeCompanionDashboard(db), [db]);

  const notify = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
  };

  // --- CRUD HANDLERS ---
  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberParent.trim()) {
      notify('err', 'Nama anggota dan nama orang tua/wali wajib diisi.');
      return;
    }
    const nextNum = db.members.length + 1;
    const nomorInduk = `ALMA-${String(nextNum).padStart(3, '0')}`;
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      nomorInduk,
      nama: newMemberName.trim(),
      jenjangUsia: newMemberJenjang,
      orangTua: newMemberParent.trim(),
      poin: 0,
      lencana: [],
      status: 'Aktif',
      bergabungSejak: new Date().toISOString().slice(0, 10),
      password: '123',
    };
    await onUpdateDb({ ...db, members: [...db.members, newMember] });
    setNewMemberName('');
    setNewMemberParent('');
    notify('ok', `Anggota ${newMember.nama} (${nomorInduk}) berhasil ditambahkan.`);
  };

  const handleDeleteMember = (member: Member) => {
    setConfirmState({
      open: true,
      title: `Hapus anggota ${member.nama}?`,
      description: `Data anggota dengan nomor induk ${member.nomorInduk} akan dihapus dari daftar aktif.`,
      confirmLabel: 'Hapus Anggota',
      variant: 'danger',
      action: async () => {
        await onUpdateDb({
          ...db,
          members: db.members.filter((m) => m.id !== member.id),
        });
        notify('ok', `Anggota ${member.nama} telah dihapus.`);
      },
    });
  };

  const handleDeleteBook = (book: Book) => {
    setConfirmState({
      open: true,
      title: `Hapus buku "${book.judul}"?`,
      description: `Buku dengan kode ${book.kodeBuku} akan dihapus dari katalog digital.`,
      confirmLabel: 'Hapus Buku',
      variant: 'danger',
      action: async () => {
        await onUpdateDb({
          ...db,
          books: db.books.filter((b) => b.id !== book.id),
        });
        notify('ok', `Buku "${book.judul}" dihapus.`);
      },
    });
  };

  const handleCreateLoan = async (e: FormEvent) => {
    e.preventDefault();
    const member = db.members.find((m) => m.nomorInduk === loanMemberCode);
    const book = db.books.find((b) => b.kodeBuku === loanBookCode);
    if (!member || !book) {
      notify('err', 'Pilih anggota dan buku yang valid.');
      return;
    }
    const today = new Date();
    const due = new Date(today.getTime() + 7 * 86400000);
    const newLoan = {
      id: `ln-${Date.now()}`,
      nomorInduk: member.nomorInduk,
      namaAnggota: member.nama,
      kodeBuku: book.kodeBuku,
      judulBuku: book.judul,
      tanggalPinjam: today.toISOString().slice(0, 10),
      batasKembali: due.toISOString().slice(0, 10),
      status: 'Dipinjam' as const,
    };
    const nextBooks = db.books.map((b) =>
      b.kodeBuku === book.kodeBuku ? { ...b, status: 'Dipinjam' as const } : b,
    );
    await onUpdateDb({
      ...db,
      books: nextBooks,
      loans: [newLoan, ...db.loans],
    });
    notify('ok', `Peminjaman "${book.judul}" oleh ${member.nama} dicatat.`);
  };

  const handleReturnLoan = async (loanId: string) => {
    const target = db.loans.find((l) => l.id === loanId);
    if (!target) return;
    const today = new Date().toISOString().slice(0, 10);
    const nextLoans = db.loans.map((l) =>
      l.id === loanId ? { ...l, status: 'Dikembalikan' as const, tanggalKembali: today } : l,
    );
    const nextBooks = db.books.map((b) =>
      b.kodeBuku === target.kodeBuku ? { ...b, status: 'Tersedia' as const } : b,
    );
    await onUpdateDb({ ...db, loans: nextLoans, books: nextBooks });
    notify('ok', `Buku "${target.judulBuku}" ditandai dikembalikan.`);
  };

  const handleVerifyPassport = async (e: FormEvent) => {
    e.preventDefault();
    const member = db.members.find((m) => m.nomorInduk === pasMemberCode);
    const mission = db.missions.find((m) => m.id === pasMissionId);
    if (!member || !mission) {
      notify('err', 'Pilih anggota dan misi literasi terlebih dahulu.');
      return;
    }
    const newLog = {
      id: `pas-${Date.now()}`,
      nomorInduk: member.nomorInduk,
      namaAnggota: member.nama,
      misi: mission.judul,
      zona: mission.zona,
      poin: mission.poin,
      pendamping: session.displayName,
      catatan: pasNote.trim() || `Menyelesaikan misi ${mission.judul}.`,
      tanggal: new Date().toISOString().slice(0, 10),
      stempel: true,
    };
    const nextMembers = db.members.map((m) => {
      if (m.nomorInduk !== member.nomorInduk) return m;
      const badges = m.lencana.includes(mission.judul)
        ? m.lencana
        : [...m.lencana, mission.judul];
      return { ...m, poin: m.poin + mission.poin, lencana: badges };
    });
    await onUpdateDb({
      ...db,
      members: nextMembers,
      passportLogs: [newLog, ...db.passportLogs],
    });
    setPasNote('');
    notify('ok', `+${mission.poin} poin E-Paspor diverifikasi untuk ${member.nama}.`);
  };

  // --- SCHEDULE HANDLERS ---
  const handleAddSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!schHari.trim() || !schProgram.trim()) {
      notify('err', 'Hari dan nama program wajib diisi.');
      return;
    }
    const nextSchedule = {
      id: `sch-${Date.now()}`,
      hari: schHari.trim(),
      waktu: schWaktu.trim() || '15.30–17.00 WIB',
      program: schProgram.trim(),
      aktivitas: schAktivitas.trim() || 'Kegiatan literasi teras bersama pendamping.',
      zona: 'Semua Zona',
      kuota: 25,
      pesertaTerdaftar: 0,
    };
    await onUpdateDb({ ...db, schedules: [...db.schedules, nextSchedule] });
    setSchHari('');
    setSchProgram('');
    setSchAktivitas('');
    notify('ok', `Agenda "${nextSchedule.program}" berhasil ditambahkan.`);
  };

  const handleDownloadCsv = (kind: 'members' | 'books' | 'loans') => {
    let csv = '';
    let filename = '';
    if (kind === 'members') {
      csv = exportRecordsToCsv(
        [
          { key: 'nomorInduk', header: 'Nomor Induk' },
          { key: 'nama', header: 'Nama' },
          { key: 'jenjangUsia', header: 'Jenjang' },
          { key: 'orangTua', header: 'Orang Tua' },
          { key: 'poin', header: 'Poin' },
          { key: 'status', header: 'Status' },
        ],
        db.members,
      );
      filename = 'anggota-almahyra.csv';
    } else if (kind === 'books') {
      csv = exportRecordsToCsv(
        [
          { key: 'kodeBuku', header: 'Kode Buku' },
          { key: 'judul', header: 'Judul' },
          { key: 'penulis', header: 'Penulis' },
          { key: 'kategori', header: 'Kategori' },
          { key: 'status', header: 'Status' },
          { key: 'stok', header: 'Stok' },
        ],
        db.books,
      );
      filename = 'katalog-almahyra.csv';
    } else {
      csv = exportRecordsToCsv(
        [
          { key: 'nomorInduk', header: 'Nomor Induk' },
          { key: 'namaAnggota', header: 'Nama Anggota' },
          { key: 'kodeBuku', header: 'Kode Buku' },
          { key: 'judulBuku', header: 'Judul Buku' },
          { key: 'tanggalPinjam', header: 'Tanggal Pinjam' },
          { key: 'status', header: 'Status' },
        ],
        db.loans,
      );
      filename = 'peminjaman-almahyra.csv';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- LOGO & LANDING PAGE HANDLERS ---
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? '');
      if (!dataUrl) return;
      try {
        const extracted = await extractColorsFromLogoUrl(dataUrl);
        setDraftConfig((prev) => ({
          ...prev,
          logoUrl: dataUrl,
          primaryColor: extracted.primary,
          secondaryColor: extracted.secondary,
          accentColor: extracted.accent,
        }));
        notify('ok', 'Logo diunggah & palet warna otomatis disesuaikan dari icon logo!');
      } catch {
        setDraftConfig((prev) => ({ ...prev, logoUrl: dataUrl }));
        notify('ok', 'Logo berhasil diunggah.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtractColorsFromCurrentLogo = async () => {
    try {
      const extracted = await extractColorsFromLogoUrl(draftConfig.logoUrl);
      setDraftConfig((prev) => ({
        ...prev,
        primaryColor: extracted.primary,
        secondaryColor: extracted.secondary,
        accentColor: extracted.accent,
      }));
      notify('ok', 'Warna utama dan aksen berhasil diekstrak dari icon logo.');
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Gagal mengekstrak warna logo.');
    }
  };

  const handleSaveAppearance = async (e: FormEvent) => {
    e.preventDefault();
    const cleanedSheetId = extractSpreadsheetId(spreadsheetInput) || draftConfig.spreadsheetId;
    await onUpdateDb({
      ...db,
      config: { ...draftConfig, spreadsheetId: cleanedSheetId },
    });
    notify('ok', 'Pengaturan tampilan landing page & logo berhasil disimpan!');
  };

  // --- GOOGLE SHEETS INTEGRATION HANDLERS ---
  const handleGoogleSignIn = async () => {
    setSyncLoading(true);
    try {
      const { user, accessToken } = await signInWithGoogleSheets();
      setGoogleToken(accessToken);
      setGoogleUserEmail(user.email ?? user.displayName ?? 'Akun Google Terhubung');
      notify('ok', `Terhubung dengan Google Sheets sebagai ${user.email ?? user.displayName}.`);
    } catch (err) {
      notify(
        'err',
        err instanceof Error ? err.message : 'Gagal masuk dengan Google.',
      );
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!googleToken) {
      notify('err', 'Silakan klik "Sign in with Google" terlebih dahulu untuk membuat spreadsheet.');
      return;
    }
    setSyncLoading(true);
    try {
      const res = await createAlmahyraSpreadsheet(googleToken, db);
      setSpreadsheetInput(res.spreadsheetId);
      const nextConfig = {
        ...draftConfig,
        spreadsheetId: res.spreadsheetId,
        spreadsheetTitle: res.spreadsheetTitle,
        lastSyncedAt: res.syncedAt,
      };
      setDraftConfig(nextConfig);
      await onUpdateDb({ ...db, config: nextConfig });
      notify('ok', `${res.summary} ID: ${res.spreadsheetId}`);
    } catch (err) {
      notify('err', err instanceof Error ? err.message : 'Gagal membuat spreadsheet.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCopySpreadsheetId = async () => {
    const id = extractSpreadsheetId(spreadsheetInput) || draftConfig.spreadsheetId;
    if (!id) {
      notify('err', 'Belum ada Spreadsheet ID untuk disalin.');
      return;
    }
    await navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const requestPullFromSheet = () => {
    const id = extractSpreadsheetId(spreadsheetInput);
    if (!id) {
      notify('err', 'Masukkan Spreadsheet ID atau URL Google Sheets yang valid.');
      return;
    }
    setConfirmState({
      open: true,
      title: 'Tarik data dari Google Spreadsheet?',
      description: `Data anggota, katalog buku, peminjaman, E-Paspor, jadwal, dan pengaturan aplikasi akan diperbarui dari Spreadsheet ID "${id}".`,
      confirmLabel: 'Tarik & Sinkronkan',
      variant: 'primary',
      action: async () => {
        setSyncLoading(true);
        try {
          const { updatedDb, result } = await pullDatabaseFromGoogleSheet(
            id,
            db,
            googleToken,
          );
          setDraftConfig(updatedDb.config);
          await onUpdateDb(updatedDb);
          notify('ok', result.summary);
        } catch (err) {
          notify('err', err instanceof Error ? err.message : 'Gagal menarik data spreadsheet.');
        } finally {
          setSyncLoading(false);
        }
      },
    });
  };

  const requestPushToSheet = () => {
    const id = extractSpreadsheetId(spreadsheetInput);
    if (!id) {
      notify('err', 'Masukkan Spreadsheet ID terlebih dahulu.');
      return;
    }
    if (!googleToken) {
      notify('err', 'Untuk menulis ke Google Spreadsheet, silakan klik "Sign in with Google" terlebih dahulu.');
      return;
    }
    setConfirmState({
      open: true,
      title: 'Simpan & timpa data ke Google Spreadsheet?',
      description: `Seluruh data saat ini (${db.members.length} anggota, ${db.books.length} buku, ${db.loans.length} peminjaman) akan ditulis ke Spreadsheet ID "${id}".`,
      confirmLabel: 'Simpan ke Spreadsheet',
      variant: 'primary',
      action: async () => {
        setSyncLoading(true);
        try {
          const res = await pushDatabaseToGoogleSheet(id, googleToken, db);
          const nextConfig = {
            ...draftConfig,
            spreadsheetId: res.spreadsheetId,
            spreadsheetTitle: res.spreadsheetTitle,
            lastSyncedAt: res.syncedAt,
          };
          setDraftConfig(nextConfig);
          await onUpdateDb({ ...db, config: nextConfig });
          notify('ok', res.summary);
        } catch (err) {
          notify('err', err instanceof Error ? err.message : 'Gagal menyimpan ke spreadsheet.');
        } finally {
          setSyncLoading(false);
        }
      },
    });
  };

  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffUser.trim() || !staffPass.trim()) {
      notify('err', 'Lengkapi nama, username, dan kata sandi pengelola baru.');
      return;
    }
    const nextAdmin = {
      id: `adm-${Date.now()}`,
      username: staffUser.trim(),
      password: staffPass.trim(),
      role: 'admin' as const,
      nama: staffName.trim(),
      jabatan: 'Admin Pengelola',
    };
    await onUpdateDb({ ...db, admins: [...db.admins, nextAdmin] });
    setStaffName('');
    setStaffUser('');
    setStaffPass('');
    notify('ok', `Akun admin "${nextAdmin.username}" berhasil ditambahkan.`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8E5] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--brand-accent-ink)' }}>
            {session.role === 'superadmin' ? 'Konsol Superadmin' : 'Konsol Admin Pengelola'}
          </p>
          <h1 className="font-display text-2xl font-bold text-[#111C17]">
            {activePage === 'data' && 'Halaman 1: Data Anggota, Katalog & Sirkulasi'}
            {activePage === 'reports' && 'Halaman 2: Kegiatan Mingguan & Laporan'}
            {activePage === 'appearance' && 'Halaman 3: Tampilan Landing Page & Spreadsheet'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono-tabular text-[#4A5D54]">
          <span>{stats.activeMembers} Anggota</span>
          <span aria-hidden="true">·</span>
          <span>{stats.totalBooks} Buku</span>
          <span aria-hidden="true">·</span>
          <span>{stats.activeLoans} Dipinjam</span>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Tutup notifikasi"
            className="rounded-md p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* PAGE 1: DATA & SIRKULASI */}
      {activePage === 'data' && (
        <div className="space-y-6">
          <div className="inline-flex flex-wrap gap-1 rounded-xl bg-[#EEF3F0] p-1">
            {[
              { id: 'members', label: 'Anggota' },
              { id: 'books', label: 'Katalog Buku' },
              { id: 'loans', label: 'Peminjaman' },
              { id: 'passport', label: 'Verifikasi E-Paspor' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDataTab(t.id as typeof dataTab)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  dataTab === t.id
                    ? 'bg-white text-[#111C17] shadow-xs'
                    : 'text-[#4A5D54] hover:text-[#111C17]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {dataTab === 'members' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <form
                onSubmit={handleAddMember}
                className="lg:col-span-4 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4 h-fit"
              >
                <h2 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Tambah Anggota Baru
                </h2>
                <div>
                  <label htmlFor="m-nama" className="block text-xs font-semibold text-[#111C17]">
                    Nama Lengkap Anak
                  </label>
                  <input
                    id="m-nama"
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Contoh: Kirana Dewi"
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="m-jenjang" className="block text-xs font-semibold text-[#111C17]">
                    Jenjang Usia
                  </label>
                  <select
                    id="m-jenjang"
                    value={newMemberJenjang}
                    onChange={(e) => setNewMemberJenjang(e.target.value as Member['jenjangUsia'])}
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-sm"
                  >
                    <option value="PAUD">PAUD</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="Umum">Umum / Relawan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="m-wali" className="block text-xs font-semibold text-[#111C17]">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    id="m-wali"
                    type="text"
                    value={newMemberParent}
                    onChange={(e) => setNewMemberParent(e.target.value)}
                    placeholder="Contoh: Ibu Kartini"
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="w-full rounded-lg px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                >
                  Simpan Anggota (Sandi Default: 123)
                </button>
              </form>

              <div className="lg:col-span-8 rounded-2xl border border-[#E2E8E5] bg-white p-5 overflow-x-auto">
                <h2 className="font-display text-base font-bold text-[#111C17] mb-4">
                  Daftar Anggota Terdaftar ({db.members.length})
                </h2>
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] text-xs font-semibold text-[#4A5D54]">
                      <th className="py-2.5 pr-3">Nomor Induk</th>
                      <th className="py-2.5 px-3">Nama</th>
                      <th className="py-2.5 px-3">Jenjang</th>
                      <th className="py-2.5 px-3">Poin</th>
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 pl-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F0]">
                    {db.members.map((m) => (
                      <tr key={m.id} className="hover:bg-[#F8FAF9]">
                        <td className="py-3 pr-3 font-mono-tabular font-semibold text-[#111C17]">
                          {m.nomorInduk}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#111C17]">{m.nama}</div>
                          <div className="text-xs text-[#4A5D54]">Wali: {m.orangTua}</div>
                        </td>
                        <td className="py-3 px-3 text-xs text-[#4A5D54]">{m.jenjangUsia}</td>
                        <td className="py-3 px-3 font-mono-tabular font-bold" style={{ color: 'var(--brand-primary-ink)' }}>
                          {m.poin}
                        </td>
                        <td className="py-3 px-3 text-xs text-[#4A5D54]">
                          {calculateLevelInfo(m.poin).currentLevel}
                        </td>
                        <td className="py-3 pl-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPreviewMember(m)}
                            className="rounded-lg border border-[#DCE4DF] px-2.5 py-1 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
                          >
                            E-Kartu 3D
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m)}
                            aria-label={`Hapus anggota ${m.nama}`}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dataTab === 'books' && (
            <BookCollectionManager
              db={db}
              onUpdateDb={onUpdateDb}
              onNotify={notify}
              onRequestDeleteBook={handleDeleteBook}
            />
          )}

          {dataTab === 'loans' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <form
                onSubmit={handleCreateLoan}
                className="lg:col-span-4 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4 h-fit"
              >
                <h2 className="font-display text-base font-bold text-[#111C17]">
                  Catat Peminjaman Buku
                </h2>
                <div>
                  <label htmlFor="l-member" className="block text-xs font-semibold text-[#111C17]">
                    Anggota Peminjam
                  </label>
                  <select
                    id="l-member"
                    value={loanMemberCode}
                    onChange={(e) => setLoanMemberCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-sm"
                  >
                    {db.members.map((m) => (
                      <option key={m.id} value={m.nomorInduk}>
                        {m.nomorInduk} — {m.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="l-book" className="block text-xs font-semibold text-[#111C17]">
                    Pilih Buku
                  </label>
                  <select
                    id="l-book"
                    value={loanBookCode}
                    onChange={(e) => setLoanBookCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-sm"
                  >
                    {db.books.map((b) => (
                      <option key={b.id} value={b.kodeBuku}>
                        {b.kodeBuku} — {b.judul} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="w-full rounded-lg px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                >
                  Catat Peminjaman (7 Hari)
                </button>
              </form>

              <div className="lg:col-span-8 rounded-2xl border border-[#E2E8E5] bg-white p-5 overflow-x-auto">
                <h2 className="font-display text-base font-bold text-[#111C17] mb-4">
                  Riwayat Sirkulasi Peminjaman ({db.loans.length})
                </h2>
                <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8E5] text-xs font-semibold text-[#4A5D54]">
                      <th className="py-2.5 pr-3">Anggota</th>
                      <th className="py-2.5 px-3">Buku</th>
                      <th className="py-2.5 px-3">Pinjam / Batas</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F0]">
                    {db.loans.map((ln) => (
                      <tr key={ln.id} className="hover:bg-[#F8FAF9]">
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-[#111C17]">{ln.namaAnggota}</div>
                          <div className="font-mono-tabular text-xs text-[#4A5D54]">{ln.nomorInduk}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-[#111C17]">{ln.judulBuku}</div>
                          <div className="font-mono-tabular text-xs text-[#4A5D54]">{ln.kodeBuku}</div>
                        </td>
                        <td className="py-3 px-3 font-mono-tabular text-xs text-[#4A5D54]">
                          {ln.tanggalPinjam} s.d. {ln.batasKembali}
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold">
                          <span className={ln.status === 'Dikembalikan' ? 'text-emerald-700' : 'text-amber-700'}>
                            {ln.status}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          {ln.status !== 'Dikembalikan' ? (
                            <button
                              type="button"
                              onClick={() => handleReturnLoan(ln.id)}
                              className="rounded-lg border border-[#DCE4DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
                            >
                              Tandai Kembali
                            </button>
                          ) : (
                            <span className="text-xs text-[#6B7D74] font-mono-tabular">
                              {ln.tanggalKembali}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dataTab === 'passport' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <form
                onSubmit={handleVerifyPassport}
                className="lg:col-span-5 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4 h-fit"
              >
                <h2 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Validasi Misi & Poin E-Paspor
                </h2>
                <div>
                  <label htmlFor="p-member" className="block text-xs font-semibold text-[#111C17]">
                    Pilih Anggota
                  </label>
                  <select
                    id="p-member"
                    value={pasMemberCode}
                    onChange={(e) => setPasMemberCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-sm"
                  >
                    {db.members.map((m) => (
                      <option key={m.id} value={m.nomorInduk}>
                        {m.nomorInduk} — {m.nama} ({m.poin} pts)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="p-mission" className="block text-xs font-semibold text-[#111C17]">
                    Misi yang Diselesaikan
                  </label>
                  <select
                    id="p-mission"
                    value={pasMissionId}
                    onChange={(e) => setPasMissionId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-sm"
                  >
                    {db.missions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.judul} (+{m.poin} pts · {m.zona})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="p-note" className="block text-xs font-semibold text-[#111C17]">
                    Catatan Pendamping
                  </label>
                  <textarea
                    id="p-note"
                    rows={3}
                    value={pasNote}
                    onChange={(e) => setPasNote(e.target.value)}
                    placeholder="Contoh: Anak berhasil menceritakan ulang kisah dengan percaya diri."
                    className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: db.config.accentColor }}
                  className="w-full rounded-lg px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                >
                  Verifikasi & Beri Stempel Poin
                </button>
              </form>

              <div className="lg:col-span-7 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-[#111C17]">
                  Log Validasi E-Paspor Terbaru
                </h2>
                <div className="divide-y divide-[#EEF3F0]">
                  {db.passportLogs.map((log) => (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#111C17]">
                          {log.namaAnggota} · {log.misi}
                        </p>
                        <p className="text-xs text-[#4A5D54]">{log.catatan}</p>
                        <p className="mt-1 text-[11px] text-[#6B7D74]">
                          {log.tanggal} · {log.zona} · Pendamping: {log.pendamping}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-xs font-bold shrink-0" style={{ color: 'var(--brand-primary-ink)' }}>
                        +{log.poin} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAGE 2: DASHBOARD PENDAMPING, KEGIATAN & LAPORAN */}
      {activePage === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5">
              <p className="text-xs text-[#4A5D54]">Total Buku Selesai Dibaca</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums" style={{ color: 'var(--brand-primary-ink)' }}>
                {companionDashboard.totalBooksRead}
              </p>
              <p className="text-[11px] text-[#4A5D54] mt-1">
                {companionDashboard.activeReadersCount} anggota aktif membaca
              </p>
            </div>
            <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5">
              <p className="text-xs text-[#4A5D54]">Total Aktivitas Membaca</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums" style={{ color: 'var(--brand-primary-ink)' }}>
                {companionDashboard.totalReadingActivities}
              </p>
              <p className="text-[11px] text-[#4A5D54] mt-1">
                {companionDashboard.totalJournals} catatan jurnal pembaca
              </p>
            </div>
            <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5">
              <p className="text-xs text-[#4A5D54]">Peminjaman Berjalan</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums" style={{ color: 'var(--brand-accent-ink)' }}>
                {stats.activeLoans}
              </p>
              <p className="text-[11px] text-[#4A5D54] mt-1">
                {stats.totalTitles} judul aktif
              </p>
            </div>
            <div className="rounded-2xl border border-[#E2E8E5] bg-white p-5">
              <p className="text-xs text-[#4A5D54]">Total Poin Literasi</p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-[#111C17]">
                {stats.totalPointsAwarded}
              </p>
              <p className="text-[11px] text-[#4A5D54] mt-1">
                {stats.verifiedMissions} stempel E-Paspor
              </p>
            </div>
          </div>

          {/* Dashboard Pendamping: Kategori Paling Disukai & Daftar Anggota Aktif Membaca */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="lg:col-span-4 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-[#111C17]">
                Kategori Buku Paling Disukai
              </h2>
              <div className="space-y-3">
                {companionDashboard.favoriteCategories.slice(0, 6).map((cat) => {
                  const maxScore = companionDashboard.favoriteCategories[0]?.skor || 1;
                  const widthPct = Math.max(12, Math.round((cat.skor / maxScore) * 100));
                  return (
                    <div key={cat.kategori} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#111C17]">{cat.kategori}</span>
                        <span className="font-mono-tabular text-[#4A5D54]">Skor {cat.skor}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${widthPct}%`, backgroundColor: db.config.primaryColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="lg:col-span-8 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4 overflow-x-auto">
              <h2 className="font-display text-base font-bold text-[#111C17]">
                Dashboard Pendamping: Perkembangan Literasi & Anggota Aktif Membaca
              </h2>
              <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8E5] font-semibold text-[#4A5D54]">
                    <th className="py-2 pr-3">Anggota</th>
                    <th className="py-2 px-2">Buku Dibaca</th>
                    <th className="py-2 px-2">Kategori Favorit</th>
                    <th className="py-2 px-2">Poin & Jenjang</th>
                    <th className="py-2 pl-2 text-right">Target Mingguan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F0]">
                  {companionDashboard.memberReports.map((rep) => (
                    <tr key={rep.member.id} className="hover:bg-[#F8FAF9]">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-[#111C17]">{rep.member.nama}</div>
                        <div className="font-mono-tabular text-[11px] text-[#4A5D54]">
                          {rep.member.nomorInduk} · {rep.member.jenjangUsia}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono-tabular">
                        <span className="font-bold text-[#111C17]">{rep.booksReadCount}</span> buku
                        <span className="block text-[11px] text-[#4A5D54]">
                          {rep.journalsCount} jurnal · {rep.favoriteCount} favorit
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-[#111C17]">{rep.topCategory}</td>
                      <td className="py-3 px-2">
                        <span className="font-mono-tabular font-bold" style={{ color: 'var(--brand-primary-ink)' }}>
                          {rep.member.poin} pts
                        </span>
                        <span className="block text-[11px] text-[#4A5D54]">
                          {rep.levelInfo.currentLevel}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right font-mono-tabular">
                        {rep.booksReadCount}/{rep.weeklyTarget} buku
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Jurnal Membaca Terbaru dari Anak */}
          <section className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
              <NotebookPen className="h-4 w-4" style={{ color: 'var(--brand-accent-ink)' }} />
              Catatan Jurnal Membaca Terbaru
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(db.readingJournals ?? []).slice(0, 6).map((j) => (
                <div key={j.id} className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#4A5D54]">
                    <span className="font-bold text-[#111C17]">{j.namaAnggota}</span>
                    <span className="font-mono-tabular">{j.tanggal}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                    {j.judulBuku}
                  </p>
                  <p className="text-xs text-[#4A5D54] line-clamp-2">{j.catatan}</p>
                </div>
              ))}
            </div>
          </section>

          <CollectionZoneInfographic
            books={db.books}
            schedules={db.schedules}
            config={db.config}
          />

          <MemberAgeDistributionChart members={db.members} config={db.config} />

          <section className="rounded-2xl border border-[#E2E8E5] bg-white p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111C17]">
                Ekspor Rekap Laporan (CSV)
              </h2>
              <p className="text-xs text-[#4A5D54]">
                Unduh laporan bulanan untuk arsip desa, orang tua, atau mitra donatur.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDownloadCsv('members')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
              >
                <Download className="h-3.5 w-3.5" />
                CSV Anggota
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv('books')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
              >
                <Download className="h-3.5 w-3.5" />
                CSV Katalog
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv('loans')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
              >
                <Download className="h-3.5 w-3.5" />
                CSV Peminjaman
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleAddSchedule}
              className="lg:col-span-4 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-3.5 h-fit"
            >
              <h2 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah Jadwal Kegiatan
              </h2>
              <div>
                <label htmlFor="s-hari" className="block text-xs font-semibold text-[#111C17]">
                  Hari
                </label>
                <input
                  id="s-hari"
                  type="text"
                  value={schHari}
                  onChange={(e) => setSchHari(e.target.value)}
                  placeholder="Contoh: Minggu ke-2"
                  className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="s-waktu" className="block text-xs font-semibold text-[#111C17]">
                  Waktu
                </label>
                <input
                  id="s-waktu"
                  type="text"
                  value={schWaktu}
                  onChange={(e) => setSchWaktu(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="s-prog" className="block text-xs font-semibold text-[#111C17]">
                  Nama Program
                </label>
                <input
                  id="s-prog"
                  type="text"
                  value={schProgram}
                  onChange={(e) => setSchProgram(e.target.value)}
                  placeholder="Contoh: Panggung Almahyra"
                  className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="s-akt" className="block text-xs font-semibold text-[#111C17]">
                  Aktivitas & Misi
                </label>
                <textarea
                  id="s-akt"
                  rows={2}
                  value={schAktivitas}
                  onChange={(e) => setSchAktivitas(e.target.value)}
                  placeholder="Deskripsi singkat kegiatan"
                  className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: db.config.primaryColor }}
                className="w-full rounded-lg px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95"
              >
                Simpan Agenda
              </button>
            </form>

            <div className="lg:col-span-8 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-[#111C17]">
                Daftar Jadwal Mingguan ({db.schedules.length})
              </h2>
              <div className="divide-y divide-[#EEF3F0]">
                {db.schedules.map((sch) => (
                  <div key={sch.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono-tabular text-[#4A5D54]">
                        {sch.hari} · {sch.waktu}
                      </p>
                      <h3 className="font-display text-sm font-bold text-[#111C17]">
                        {sch.program}
                      </h3>
                      <p className="text-xs text-[#4A5D54]">{sch.aktivitas}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDb({
                          ...db,
                          schedules: db.schedules.filter((s) => s.id !== sch.id),
                        })
                      }
                      aria-label={`Hapus jadwal ${sch.program}`}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 3: PENGATURAN TAMPILAN LANDING PAGE, ICON LOGO & GOOGLE SPREADSHEET */}
      {activePage === 'appearance' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT: GOOGLE SPREADSHEET CONNECTOR */}
          <section className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" style={{ color: 'var(--brand-primary-ink)' }} />
                    Database Google Spreadsheet
                  </h2>
                  <p className="mt-1 text-xs text-[#4A5D54]">
                    Hubungkan aplikasi ke Google Spreadsheet menggunakan ID Spreadsheet Anda.
                  </p>
                </div>
              </div>

              {/* Google Sign-In Status */}
              <div className="border-t border-[#EEF3F0] pt-4 space-y-3">
                <p className="text-xs font-semibold text-[#111C17]">
                  1. Otorisasi Akun Google Sheets
                </p>
                {googleToken ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-emerald-800 font-medium truncate">
                      Terhubung: {googleUserEmail || 'Google Sheets Aktif'}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOutGoogleSheets();
                        setGoogleToken(null);
                        setGoogleUserEmail('');
                      }}
                      className="rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-1 text-xs font-semibold text-[#111C17]"
                    >
                      Putus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={syncLoading}
                    className="gsi-material-button w-full"
                  >
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg viewBox="0 0 48 48" style={{ display: 'block' }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents">Sign in with Google</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Spreadsheet ID Input + Copy Button */}
              <div className="space-y-2">
                <label htmlFor="sheet-id-input" className="block text-xs font-semibold text-[#111C17]">
                  2. Copy / Tempel Spreadsheet ID (atau URL Sheet)
                </label>
                <div className="flex gap-2">
                  <input
                    id="sheet-id-input"
                    type="text"
                    value={spreadsheetInput}
                    onChange={(e) => setSpreadsheetInput(e.target.value)}
                    placeholder="Tempel Spreadsheet ID di sini..."
                    className="w-full rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 font-mono-tabular text-xs text-[#111C17]"
                  />
                  <button
                    type="button"
                    onClick={handleCopySpreadsheetId}
                    aria-label="Copy Spreadsheet ID"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] shrink-0"
                  >
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId ? 'Tersalin' : 'Copy ID'}
                  </button>
                </div>
                {db.config.lastSyncedAt && (
                  <p className="font-mono-tabular text-[11px] text-[#4A5D54]">
                    Sinkron terakhir: {new Date(db.config.lastSyncedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Sync Buttons */}
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={handleCreateNewSpreadsheet}
                  disabled={syncLoading}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                >
                  <Database className="h-4 w-4" />
                  Buat Template Spreadsheet Baru di Google Drive
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={requestPullFromSheet}
                    disabled={syncLoading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] disabled:opacity-60"
                  >
                    <CloudDownload className="h-4 w-4" />
                    Tarik Data
                  </button>
                  <button
                    type="button"
                    onClick={requestPushToSheet}
                    disabled={syncLoading}
                    style={{ backgroundColor: db.config.accentColor }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                  >
                    <CloudUpload className="h-4 w-4" />
                    Simpan ke Sheet
                  </button>
                </div>
              </div>

              <div className="border-t border-[#EEF3F0] pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmState({
                      open: true,
                      title: 'Reset data ke bawaan proposal?',
                      description: 'Data lokal akan dikembalikan ke data awal proposal Rumah Baca Almahyra.',
                      confirmLabel: 'Reset Data',
                      variant: 'danger',
                      action: async () => {
                        await onResetDb();
                        notify('ok', 'Data dikembalikan ke bawaan awal.');
                      },
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A5D54] hover:text-red-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Database Lokal ke Bawaan Awal
                </button>
              </div>
            </div>

            {/* SUPERADMIN ONLY: MANAJEMEN AKUN PENGELOLA */}
            {session.role === 'superadmin' && (
              <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-[#111C17]">
                  Manajemen Akun Pengelola (Khusus Superadmin)
                </h2>
                <div className="divide-y divide-[#EEF3F0] text-xs">
                  {db.admins.map((adm) => (
                    <div key={adm.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#111C17]">{adm.nama}</p>
                        <p className="font-mono-tabular text-[#4A5D54]">
                          {adm.username} · {adm.role}
                        </p>
                      </div>
                      {adm.role !== 'superadmin' && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateDb({
                              ...db,
                              admins: db.admins.filter((a) => a.id !== adm.id),
                            })
                          }
                          aria-label={`Hapus pengelola ${adm.nama}`}
                          className="text-red-600 hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddStaff} className="space-y-2.5 pt-2 border-t border-[#EEF3F0]">
                  <p className="text-xs font-semibold text-[#111C17]">Tambah Akun Admin Baru</p>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Nama lengkap admin"
                    className="w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={staffUser}
                      onChange={(e) => setStaffUser(e.target.value)}
                      placeholder="Username"
                      className="w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-xs"
                    />
                    <input
                      type="password"
                      value={staffPass}
                      onChange={(e) => setStaffPass(e.target.value)}
                      placeholder="Kata sandi"
                      className="w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: db.config.primaryColor }}
                    className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-white"
                  >
                    Tambah Admin
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* RIGHT: PENGATURAN LOGO, WARNA & KONTEN LANDING PAGE */}
          <form
            onSubmit={handleSaveAppearance}
            className="lg:col-span-7 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-6 h-fit"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                  <Palette className="h-5 w-5" style={{ color: 'var(--brand-accent-ink)' }} />
                  Pengelola Icon Logo, Warna & Tampilan Landing Page
                </h2>
                <p className="mt-1 text-xs text-[#4A5D54]">
                  Unggah icon logo untuk mengekstrak tema warna aplikasi dan sesuaikan teks 2 halaman publik.
                </p>
              </div>
            </div>

            {/* Logo Upload & Auto Color Palette */}
            <div className="border-y border-[#EEF3F0] py-5 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ResilientImage
                  src={draftConfig.logoUrl}
                  fallbackSrc={DEFAULT_LOGO_URL}
                  alt="Pratinjau Icon Logo"
                  loading="eager"
                  className="h-16 w-16 rounded-2xl border border-[#DCE4DF] bg-white object-cover shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-[#111C17]">
                    Masukkan Icon Logo Aplikasi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]">
                      <Upload className="h-3.5 w-3.5" />
                      Unggah Gambar Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="sr-only"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleExtractColorsFromCurrentLogo}
                      className="rounded-lg border border-[#DCE4DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
                    >
                      Ekstrak Warna dari Logo
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          logoUrl: DEFAULT_LOGO_URL,
                          primaryColor: '#136B36',
                          secondaryColor: '#1F8A44',
                          accentColor: '#D98200',
                        }))
                      }
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#4A5D54] hover:text-[#111C17]"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex items-center justify-between rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-xs">
                  <span className="font-medium text-[#111C17]">Warna Utama</span>
                  <input
                    type="color"
                    value={draftConfig.primaryColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-xs">
                  <span className="font-medium text-[#111C17]">Warna Sekunder</span>
                  <input
                    type="color"
                    value={draftConfig.secondaryColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))
                    }
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-xs">
                  <span className="font-medium text-[#111C17]">Warna Aksen</span>
                  <input
                    type="color"
                    value={draftConfig.accentColor}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({ ...prev, accentColor: e.target.value }))
                    }
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                  />
                </label>
              </div>
            </div>

            {/* Text & Section Controls */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cfg-appname" className="block text-xs font-semibold text-[#111C17]">
                  Nama Aplikasi (Header)
                </label>
                <input
                  id="cfg-appname"
                  type="text"
                  value={draftConfig.appName}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, appName: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="cfg-slogan" className="block text-xs font-semibold text-[#111C17]">
                  Slogan Utama
                </label>
                <input
                  id="cfg-slogan"
                  type="text"
                  value={draftConfig.slogan}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, slogan: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cfg-herotitle" className="block text-xs font-semibold text-[#111C17]">
                Judul Hero (Halaman 1 Publik)
              </label>
              <input
                id="cfg-herotitle"
                type="text"
                value={draftConfig.heroTitle}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, heroTitle: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="cfg-herosub" className="block text-xs font-semibold text-[#111C17]">
                Subjudul Hero (Halaman 1 Publik)
              </label>
              <textarea
                id="cfg-herosub"
                rows={3}
                value={draftConfig.heroSubtitle}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, heroSubtitle: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="cfg-announce" className="block text-xs font-semibold text-[#111C17]">
                Teks Pengumuman Atas
              </label>
              <input
                id="cfg-announce"
                type="text"
                value={draftConfig.announcementText}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, announcementText: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="cfg-page2title" className="block text-xs font-semibold text-[#111C17]">
                Judul Halaman 2 Publik (Katalog & Jadwal)
              </label>
              <input
                id="cfg-page2title"
                type="text"
                value={draftConfig.page2Title}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, page2Title: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-2">
              {[
                { key: 'showAnnouncement', label: 'Tampilkan Pengumuman' },
                { key: 'showTelagaSection', label: 'Pilar TELAGA' },
                { key: 'showZonesSection', label: '6 Zona Petualangan' },
                { key: 'showLevelsSection', label: 'Tabel Jenjang Poin' },
                { key: 'showCatalogSection', label: 'Katalog Publik' },
                { key: 'showScheduleSection', label: 'Jadwal Mingguan' },
              ].map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-center gap-2 rounded-lg border border-[#E7EEEA] bg-[#F8FAF9] px-3 py-2 text-xs font-medium text-[#111C17]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(
                      draftConfig[toggle.key as keyof LandingConfig],
                    )}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        [toggle.key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-[#1B4332]"
                  />
                  <span>{toggle.label}</span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              style={{ backgroundColor: draftConfig.primaryColor }}
              className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Simpan Pengaturan Tampilan & Landing Page
            </button>
          </form>
        </div>
      )}

      {/* 3D E-Kartu Preview Modal for Admin */}
      {previewMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau 3D E-Kartu Anggota"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#DCE4DF] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#111C17]">
                E-Kartu Anggota 3D · {previewMember.nomorInduk}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewMember(null)}
                aria-label="Tutup pratinjau kartu"
                className="rounded-lg p-1.5 text-[#4A5D54] hover:bg-[#F2F6F4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Card3DPassport member={previewMember} config={db.config} />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        loading={syncLoading}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={async () => {
          const act = confirmState.action;
          setConfirmState((prev) => ({ ...prev, open: false }));
          if (act) await act();
        }}
      />
    </main>
  );
}
