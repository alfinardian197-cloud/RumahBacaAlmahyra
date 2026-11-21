import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FilePenLine,
  GraduationCap,
  Lightbulb,
  Lock,
  LogIn,
  MessageCircle,
  User,
  X,
} from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../data/defaultDb';
import type { AuthSession, LandingConfig } from '../types/almahyra';
import {
  buildAccountRegistrationWhatsAppMessage,
  buildAdminContactWhatsAppMessage,
  buildLoginHelpWhatsAppMessage,
  buildWhatsAppShareHref,
  DEFAULT_MANAGER_WHATSAPP_DISPLAY,
  validateAccountRegistration,
} from '../utils/almahyra';
import { ResilientImage } from './ResilientImage';

interface LoginModalProps {
  open: boolean;
  config: LandingConfig;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}

type ModalView = 'login' | 'help' | 'register' | 'contact';

const AGE_LEVEL_OPTIONS = ['PAUD', 'TK', 'SD', 'SMP', 'Umum'] as const;

const ADMIN_TOPICS = [
  'Aktivasi Akun Baru',
  'Lupa Sandi / PIN',
  'Konfirmasi Pendaftaran',
  'Tanya Layanan Rumah Baca',
] as const;

export function LoginModal({
  open,
  config,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const [mode, setMode] = useState<'pengelola' | 'anggota'>('anggota');
  const [view, setView] = useState<ModalView>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bantuan Login state
  const [helpIdentifier, setHelpIdentifier] = useState('');

  // Daftar Akun Baru state
  const [regFullName, setRegFullName] = useState('');
  const [regParentOrOrg, setRegParentOrOrg] = useState('');
  const [regAgeLevel, setRegAgeLevel] = useState<string>('SD');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regNotes, setRegNotes] = useState('');
  const [regError, setRegError] = useState('');
  const [regConfirmedMessage, setRegConfirmedMessage] = useState<string | null>(null);

  // Hubungi Admin state
  const [contactTopic, setContactTopic] = useState<string>(ADMIN_TOPICS[0]);
  const [contactNote, setContactNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!open) return null;

  const adminWaDisplay =
    config.whatsappNumber?.trim() || DEFAULT_MANAGER_WHATSAPP_DISPLAY;
  const appBrandName = config.appName?.trim() || 'Rumah Baca Almahyra';

  const resetAndClose = () => {
    setError('');
    setRegError('');
    setRegConfirmedMessage(null);
    setView('login');
    onClose();
  };

  const handleCopyMessage = async (key: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2400);
    } catch {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2400);
    }
  };

  const handleSubmitLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Mohon isi username / nomor induk dan kata sandi terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Gagal masuk. Periksa kembali data akun Anda.');
        return;
      }
      onSuccess(json.session as AuthSession);
      setUsername('');
      setPassword('');
      setView('login');
      onClose();
    } catch {
      setError('Tidak dapat terhubung ke server. Coba beberapa saat lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRegistration = (e: FormEvent) => {
    e.preventDefault();
    setRegError('');
    const result = validateAccountRegistration({
      role: mode,
      fullName: regFullName,
      parentOrOrg: regParentOrOrg,
      ageLevel: mode === 'anggota' ? regAgeLevel : 'Pengelola / Relawan',
      whatsappNumber: regWhatsapp,
      notes: regNotes,
    });
    if (!result.ok) {
      setRegError(result.error);
      return;
    }
    const msg = buildAccountRegistrationWhatsAppMessage(result.data, appBrandName);
    setRegConfirmedMessage(msg);
  };

  const helpWaMessage = buildLoginHelpWhatsAppMessage({
    role: mode,
    identifier: helpIdentifier || username,
    appName: appBrandName,
  });
  const helpWaHref = buildWhatsAppShareHref(helpWaMessage, adminWaDisplay);

  const contactWaMessage = buildAdminContactWhatsAppMessage({
    role: mode,
    topic: contactTopic,
    customNote: contactNote,
    appName: appBrandName,
  });
  const contactWaHref = buildWhatsAppShareHref(contactWaMessage, adminWaDisplay);

  const regWaHref = regConfirmedMessage
    ? buildWhatsAppShareHref(regConfirmedMessage, adminWaDisplay)
    : '#';

  const roleShortLabel = mode === 'pengelola' ? 'Pengelola' : 'Anggota';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0D2418]/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="relative my-auto w-full max-w-[430px] rounded-[28px] border-[3px] border-[#3B2818] bg-[#FFFBF0] p-5 sm:p-7 shadow-[0_8px_0_#3B2818,0_22px_40px_rgba(16,40,27,0.32)] preserve-light">
        {/* Close Button */}
        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Tutup form masuk"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#3B2818] bg-[#FFF2DF] text-[#3B2818] shadow-[0_2px_0_#3B2818] transition-transform hover:scale-105 active:translate-y-0.5"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Centered Brand Logo & Greeting Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 overflow-hidden rounded-[22%] drop-shadow-[0_4px_10px_rgba(8,124,59,0.2)]">
            <ResilientImage
              src={config.logoUrl}
              fallbackSrc={DEFAULT_LOGO_URL}
              alt={appBrandName}
              loading="eager"
              className="h-full w-full scale-[1.06] object-cover"
            />
          </div>
          <h2
            id="login-modal-title"
            className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-[#7C3AED]"
          >
            Selamat Datang
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-[#5A4A3A]">
            Pilih peran Anda untuk masuk ke ekosistem {appBrandName}
          </p>
        </div>

        {/* 2 Big Tactile Role Selector Cards */}
        <div
          role="group"
          aria-label="Pilih peran akun"
          className="mt-5 grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            aria-pressed={mode === 'pengelola'}
            onClick={() => {
              setMode('pengelola');
              setError('');
              setRegError('');
              setRegConfirmedMessage(null);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-[2.5px] border-[#3B2818] px-3 py-3.5 shadow-[0_4px_0_#3B2818] transition-all active:translate-y-0.5 ${
              mode === 'pengelola'
                ? 'bg-gradient-to-b from-[#4DA3FF] to-[#246BFD] text-white'
                : 'bg-[#FFF0E0] text-[#3B2818] hover:bg-[#FFE6CC]'
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#3B2818] bg-[#FFFBF0] text-[#3B2818]">
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-extrabold">
              Pengelola / Admin
            </span>
          </button>

          <button
            type="button"
            aria-pressed={mode === 'anggota'}
            onClick={() => {
              setMode('anggota');
              setError('');
              setRegError('');
              setRegConfirmedMessage(null);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-[2.5px] border-[#3B2818] px-3 py-3.5 shadow-[0_4px_0_#3B2818] transition-all active:translate-y-0.5 ${
              mode === 'anggota'
                ? 'bg-gradient-to-b from-[#4DA3FF] to-[#246BFD] text-white'
                : 'bg-[#FFF0E0] text-[#3B2818] hover:bg-[#FFE6CC]'
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#3B2818] bg-[#FFFBF0] text-[#3B2818]">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-extrabold">
              Anggota / Anak
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: MAIN LOGIN FORM                                        */}
        {/* ============================================================== */}
        {view === 'login' && (
          <form onSubmit={handleSubmitLogin} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
              >
                {mode === 'anggota' ? 'NOMOR INDUK ANGGOTA' : 'USERNAME / ID PENGELOLA'}
              </label>
              <div className="relative mt-1.5">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E7E91]"
                  aria-hidden="true"
                />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === 'anggota' ? 'Contoh: ALMA-001' : 'Contoh: admin'}
                  autoComplete="username"
                  className="w-full rounded-2xl border-[2.5px] border-[#3B2818] bg-[#EEF5FF] py-3 pl-10 pr-4 text-sm font-bold text-[#1D1A16] placeholder:font-medium placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
              >
                PASSWORD
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E7E91]"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === 'anggota' ? 'Sandi anggota (default: 123)' : 'Masukkan password'
                  }
                  autoComplete="current-password"
                  className="w-full rounded-2xl border-[2.5px] border-[#3B2818] bg-[#EEF5FF] py-3 pl-10 pr-11 text-sm font-bold text-[#1D1A16] placeholder:font-medium placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'Sembunyikan karakter sandi' : 'Tampilkan karakter sandi'
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#5A6B7D] hover:bg-white/70 hover:text-[#3B2818]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border-2 border-[#B91C1C] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-bold text-[#991B1B]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-[2.5px] border-[#3B2818] bg-gradient-to-b from-[#FFB443] to-[#F37316] px-4 py-3 font-display text-base font-extrabold text-white shadow-[0_4px_0_#3B2818] transition-transform hover:brightness-105 active:translate-y-0.5 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>
                {submitting
                  ? 'Memeriksa Akun...'
                  : `Masuk sebagai ${roleShortLabel}`}
              </span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: BANTUAN LOGIN + KONFIRMASI WHATSAPP ADMIN              */}
        {/* ============================================================== */}
        {view === 'help' && (
          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView('login')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3B2818] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Kembali ke Masuk
              </button>
              <span className="rounded-full border border-[#3B2818] bg-[#FFF4C2] px-2.5 py-0.5 text-[11px] font-extrabold text-[#3B2818]">
                Bantuan Login
              </span>
            </div>

            <div className="rounded-2xl border-2 border-[#3B2818] bg-[#FFF8DB] p-3.5 text-xs text-[#3B2818] space-y-1.5 leading-relaxed">
              {mode === 'anggota' ? (
                <>
                  <p className="font-extrabold">Panduan Masuk Anggota / Anak:</p>
                  <p>
                    Gunakan <strong>Nomor Induk Anggota</strong> (contoh:{' '}
                    <span className="font-mono-tabular font-extrabold">ALMA-001</span>) dan sandi
                    standar <span className="font-mono-tabular font-extrabold">123</span>. Anak
                    tidak memerlukan email pribadi.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-extrabold">Panduan Masuk Pengelola / Admin:</p>
                  <p>
                    Gunakan username pengelola (contoh:{' '}
                    <span className="font-mono-tabular font-extrabold">admin</span>) dan kata sandi
                    resmi pengurus Rumah Baca Almahyra.
                  </p>
                </>
              )}
            </div>

            <div>
              <label
                htmlFor="help-identifier"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
              >
                NAMA / NOMOR INDUK YANG TERKENDALA (OPSIONAL)
              </label>
              <input
                id="help-identifier"
                type="text"
                value={helpIdentifier}
                onChange={(e) => setHelpIdentifier(e.target.value)}
                placeholder={mode === 'anggota' ? 'Contoh: ALMA-001 / Nadia' : 'Contoh: Admin Teras'}
                className="mt-1 w-full rounded-2xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3.5 py-2.5 text-xs font-bold text-[#1D1A16] placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border-2 border-[#3B2818] bg-white p-3 text-[11px] text-[#3B2818] whitespace-pre-line leading-relaxed">
              {helpWaMessage}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={helpWaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#087C3B] px-3.5 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_#3B2818] hover:brightness-105 active:translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Konfirmasi WA Admin</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopyMessage('help', helpWaMessage)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#FFF0E0] px-3.5 py-2.5 text-xs font-extrabold text-[#3B2818] shadow-[0_3px_0_#3B2818] hover:bg-[#FFE6CC] active:translate-y-0.5"
              >
                {copiedKey === 'help' ? (
                  <>
                    <Check className="h-4 w-4 text-[#087C3B]" aria-hidden="true" />
                    <span>Pesan Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: DAFTAR AKUN BARU + KONFIRMASI WHATSAPP ADMIN           */}
        {/* ============================================================== */}
        {view === 'register' && (
          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setRegConfirmedMessage(null);
                  setRegError('');
                  setView('login');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3B2818] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Kembali ke Masuk
              </button>
              <span className="rounded-full border border-[#3B2818] bg-[#E4F1FF] px-2.5 py-0.5 text-[11px] font-extrabold text-[#3B2818]">
                Daftar Akun {roleShortLabel}
              </span>
            </div>

            {regConfirmedMessage ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#087C3B] bg-[#E6F7ED] p-3.5 text-[#10281B]">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#087C3B]"
                    aria-hidden="true"
                  />
                  <div className="text-xs leading-relaxed">
                    <p className="font-extrabold">Formulir Siap Dikonfirmasi ke Admin!</p>
                    <p className="mt-0.5 text-[#3C4F46]">
                      Tekan tombol hijau di bawah untuk mengirim konfirmasi pendaftaran langsung ke
                      WhatsApp Admin ({adminWaDisplay}).
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-[#3B2818] bg-white p-3 text-[11px] text-[#3B2818] whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                  {regConfirmedMessage}
                </div>

                <a
                  href={regWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#087C3B] px-4 py-3 font-display text-sm font-extrabold text-white shadow-[0_4px_0_#3B2818] hover:brightness-105 active:translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Konfirmasi ke WhatsApp Admin ({adminWaDisplay})</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyMessage('register', regConfirmedMessage)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#3B2818] bg-[#FFF0E0] px-3 py-2 text-xs font-extrabold text-[#3B2818] shadow-[0_2px_0_#3B2818]"
                  >
                    {copiedKey === 'register' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#087C3B]" aria-hidden="true" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegConfirmedMessage(null)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#3B2818] bg-white px-3 py-2 text-xs font-extrabold text-[#3B2818] shadow-[0_2px_0_#3B2818]"
                  >
                    Ubah Data
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitRegistration} className="space-y-3">
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
                  >
                    {mode === 'anggota' ? 'NAMA LENGKAP ANAK / ANGGOTA *' : 'NAMA LENGKAP PENGELOLA *'}
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder={mode === 'anggota' ? 'Contoh: Rafa Pratama' : 'Contoh: Ibu Dewi'}
                    className="mt-1 w-full rounded-xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3.5 py-2 text-xs font-bold text-[#1D1A16] placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="reg-parent"
                      className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
                    >
                      {mode === 'anggota' ? 'ORANG TUA / WALI' : 'PERAN / INSTANSI'}
                    </label>
                    <input
                      id="reg-parent"
                      type="text"
                      value={regParentOrOrg}
                      onChange={(e) => setRegParentOrOrg(e.target.value)}
                      placeholder={
                        mode === 'anggota' ? 'Contoh: Ibu Sari' : 'Contoh: Relawan Grontol'
                      }
                      className="mt-1 w-full rounded-xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3 py-2 text-xs font-bold text-[#1D1A16] placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {mode === 'anggota' ? (
                    <div>
                      <label
                        htmlFor="reg-age-level"
                        className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
                      >
                        JENJANG USIA
                      </label>
                      <select
                        id="reg-age-level"
                        value={regAgeLevel}
                        onChange={(e) => setRegAgeLevel(e.target.value)}
                        className="mt-1 w-full rounded-xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3 py-2 text-xs font-bold text-[#1D1A16] focus:bg-white focus:outline-none"
                      >
                        {AGE_LEVEL_OPTIONS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="reg-wa-inline"
                        className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
                      >
                        NO. WHATSAPP AKTIF *
                      </label>
                      <input
                        id="reg-wa-inline"
                        type="tel"
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="mt-1 w-full rounded-xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3 py-2 text-xs font-bold text-[#1D1A16] placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {mode === 'anggota' && (
                  <div>
                    <label
                      htmlFor="reg-wa"
                      className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
                    >
                      NO. WHATSAPP ORANG TUA / PEMOHON *
                    </label>
                    <input
                      id="reg-wa"
                      type="tel"
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="mt-1 w-full rounded-xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3.5 py-2 text-xs font-bold text-[#1D1A16] placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="reg-notes"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
                  >
                    CATATAN TAMBAHAN (OPSIONAL)
                  </label>
                  <input
                    id="reg-notes"
                    type="text"
                    value={regNotes}
                    onChange={(e) => setRegNotes(e.target.value)}
                    placeholder="Contoh: Ingin ikut jadwal Sabtu Dongeng"
                    className="mt-1 w-full rounded-xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3.5 py-2 text-xs font-bold text-[#1D1A16] placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
                  />
                </div>

                {regError && (
                  <div
                    role="alert"
                    className="rounded-xl border-2 border-[#B91C1C] bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#991B1B]"
                  >
                    {regError}
                  </div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-[2.5px] border-[#3B2818] bg-gradient-to-b from-[#FFB443] to-[#F37316] px-4 py-2.5 font-display text-sm font-extrabold text-white shadow-[0_4px_0_#3B2818] hover:brightness-105 active:translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Siapkan Konfirmasi WhatsApp Admin</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: HUBUNGI & KONFIRMASI WHATSAPP ADMIN                    */}
        {/* ============================================================== */}
        {view === 'contact' && (
          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView('login')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3B2818] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Kembali ke Masuk
              </button>
              <span className="rounded-full border border-[#3B2818] bg-[#DFF9EA] px-2.5 py-0.5 text-[11px] font-extrabold text-[#3B2818]">
                WA Admin: {adminWaDisplay}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]">
                PILIH KEPERLUAN KONFIRMASI
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ADMIN_TOPICS.map((topic) => {
                  const active = contactTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setContactTopic(topic)}
                      aria-pressed={active}
                      className={`rounded-xl border-2 border-[#3B2818] px-2.5 py-1 text-[11px] font-extrabold transition-colors ${
                        active
                          ? 'bg-[#087C3B] text-white'
                          : 'bg-[#FFF0E0] text-[#3B2818] hover:bg-[#FFE6CC]'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-note"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3B2818]"
              >
                PESAN SINGKAT (OPSIONAL)
              </label>
              <input
                id="contact-note"
                type="text"
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                placeholder="Tulis nama atau pertanyaan Anda..."
                className="mt-1 w-full rounded-xl border-2 border-[#3B2818] bg-[#EEF5FF] px-3.5 py-2 text-xs font-bold text-[#1D1A16] placeholder:text-[#7D8DA1] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border-2 border-[#3B2818] bg-white p-3 text-[11px] text-[#3B2818] whitespace-pre-line leading-relaxed">
              {contactWaMessage}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={contactWaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#087C3B] px-3.5 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_#3B2818] hover:brightness-105 active:translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Kirim ke WA Admin</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopyMessage('contact', contactWaMessage)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#FFF0E0] px-3.5 py-2.5 text-xs font-extrabold text-[#3B2818] shadow-[0_3px_0_#3B2818] hover:bg-[#FFE6CC] active:translate-y-0.5"
              >
                {copiedKey === 'contact' ? (
                  <>
                    <Check className="h-4 w-4 text-[#087C3B]" aria-hidden="true" />
                    <span>Pesan Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dashed Divider + 3 Tactile Bottom Service Cards */}
        <div className="mt-6 border-t-2 border-dashed border-[#E6C79C] pt-4">
          <p className="text-center text-xs font-extrabold text-[#5A4A3A]">
            Layanan Akun {roleShortLabel}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setView('help')}
              aria-pressed={view === 'help'}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#FFF4C2] px-2 py-3 text-center shadow-[0_4px_0_#3B2818] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${
                view === 'help' ? 'ring-2 ring-[#F58220] ring-offset-1' : ''
              }`}
            >
              <Lightbulb className="h-5 w-5 text-[#D97706]" aria-hidden="true" />
              <span className="text-[11px] font-extrabold leading-tight text-[#3B2818]">
                Bantuan Login
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRegConfirmedMessage(null);
                setRegError('');
                setView('register');
              }}
              aria-pressed={view === 'register'}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#E4F1FF] px-2 py-3 text-center shadow-[0_4px_0_#3B2818] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${
                view === 'register' ? 'ring-2 ring-[#246BFD] ring-offset-1' : ''
              }`}
            >
              <FilePenLine className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
              <span className="text-[11px] font-extrabold leading-tight text-[#3B2818]">
                Daftar Akun {roleShortLabel}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setView('contact')}
              aria-pressed={view === 'contact'}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-[2.5px] border-[#3B2818] bg-[#DFF9EA] px-2 py-3 text-center shadow-[0_4px_0_#3B2818] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${
                view === 'contact' ? 'ring-2 ring-[#087C3B] ring-offset-1' : ''
              }`}
            >
              <MessageCircle className="h-5 w-5 text-[#087C3B]" aria-hidden="true" />
              <span className="text-[11px] font-extrabold leading-tight text-[#3B2818]">
                Hubungi Admin
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
