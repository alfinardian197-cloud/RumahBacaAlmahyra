import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Shield, UserCheck, X } from 'lucide-react';
import type { AuthSession, LandingConfig } from '../types/almahyra';

interface LoginModalProps {
  open: boolean;
  config: LandingConfig;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}

export function LoginModal({
  open,
  config,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const [mode, setMode] = useState<'pengelola' | 'anggota'>('anggota');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Mohon isi nama pengguna/nomor induk dan kata sandi.');
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
      onClose();
    } catch {
      setError('Tidak dapat terhubung ke server. Coba beberapa saat lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#DCE4DF] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={config.logoUrl}
              alt={config.appName}
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-xl border border-[#DCE4DF] object-cover shrink-0"
            />
            <div>
              <h2
                id="login-modal-title"
                className="font-display text-lg font-bold text-[#111C17]"
              >
                Masuk {config.appName}
              </h2>
              <p className="text-xs text-[#4A5D54]">
                Pilih peran Anda untuk mengakses portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form masuk"
            className="rounded-lg p-1.5 text-[#4A5D54] hover:bg-[#F2F6F4] hover:text-[#111C17]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Interactive Segmented Role Switcher */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-[#F2F6F4] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('anggota');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              mode === 'anggota'
                ? 'bg-white text-[#111C17] shadow-xs'
                : 'text-[#4A5D54] hover:text-[#111C17]'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Anggota / Anak
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('pengelola');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              mode === 'pengelola'
                ? 'bg-white text-[#111C17] shadow-xs'
                : 'text-[#4A5D54] hover:text-[#111C17]'
            }`}
          >
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Admin / Superadmin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold text-[#111C17]"
            >
              {mode === 'anggota' ? 'Nomor Induk Anggota' : 'Username Pengelola'}
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === 'anggota' ? 'Contoh: ALMA-001' : 'admin'}
              autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-[#DCE4DF] bg-white px-3.5 py-2.5 text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#1B4332] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#111C17]"
            >
              Kata Sandi
            </label>
            <div className="relative mt-1.5">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'anggota' ? 'Sandi anggota (default: 123)' : 'Masukkan kata sandi'}
                autoComplete="current-password"
                className="w-full rounded-lg border border-[#DCE4DF] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#1B4332] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan karakter sandi' : 'Tampilkan karakter sandi'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#4A5D54] hover:text-[#111C17]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: 'var(--brand-primary)' }}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {submitting ? 'Memeriksa Akun...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3 text-xs text-[#4A5D54] leading-relaxed">
          {mode === 'anggota' ? (
            <p>
              Anak tidak perlu email atau ponsel pribadi. Gunakan <span className="font-mono-tabular font-semibold text-[#111C17]">Nomor Induk (mis. ALMA-001)</span> dan sandi default <span className="font-mono-tabular font-semibold text-[#111C17]">123</span>.
            </p>
          ) : (
            <p>
              Masuk sebagai <span className="font-semibold text-[#111C17]">Admin</span> atau <span className="font-semibold text-[#111C17]">Superadmin</span> menggunakan username <span className="font-mono-tabular font-semibold text-[#111C17]">admin</span> untuk mengelola database spreadsheet dan tampilan landing page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
