import { useMemo, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  MessageSquarePlus,
  MessageSquareQuote,
  Send,
  Star,
} from 'lucide-react';
import type { TestimonialItem } from '../types/almahyra';
import type { CreateTestimonialInput } from '../utils/almahyra';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  onSubmitTestimonial: (
    payload: CreateTestimonialInput,
  ) => Promise<{ ok: boolean; message: string }>;
}

const ROLE_PRESETS = [
  'Orang Tua / Wali',
  'Sahabat Baca (Anak / Pelajar)',
  'Guru / Pendidik',
  'Relawan / Donatur Buku',
  'Warga Dusun Grontol / Umum',
] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Perlu banyak perbaikan',
  2: 'Cukup membantu',
  3: 'Bagus & bermanfaat',
  4: 'Sangat bagus',
  5: 'Luar biasa & sangat bermanfaat!',
};

export function TestimonialsSection({
  testimonials,
  onSubmitTestimonial,
}: TestimonialsSectionProps) {
  const [formOpen, setFormOpen] = useState(true);
  const [nama, setNama] = useState('');
  const [peran, setPeran] = useState<string>(ROLE_PRESETS[0]);
  const [komunitas, setKomunitas] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [kutipan, setKutipan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const avgRating = useMemo(() => {
    if (testimonials.length === 0) return '5.0';
    const sum = testimonials.reduce(
      (acc, item) => acc + Math.min(5, Math.max(1, Number(item.rating) || 5)),
      0,
    );
    return (sum / testimonials.length).toFixed(1);
  }, [testimonials]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (nama.trim().length < 2) {
      setFeedback({ type: 'error', text: 'Silakan isi nama Anda (minimal 2 huruf).' });
      return;
    }
    if (kutipan.trim().length < 10) {
      setFeedback({
        type: 'error',
        text: 'Tuliskan testimoni minimal 10 karakter agar cerita Anda bermakna.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmitTestimonial({
        nama: nama.trim(),
        peran,
        komunitas: komunitas.trim() || 'Sahabat Rumah Baca Almahyra',
        kutipan: kutipan.trim(),
        rating,
      });

      if (res.ok) {
        setNama('');
        setKomunitas('');
        setKutipan('');
        setRating(5);
        setFeedback({ type: 'success', text: res.message });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="bagian-testimoni"
      aria-label="Testimoni Orang Tua, Relawan, dan Anak"
      className="scroll-mt-20 space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-[#087C3B] dark:text-[#6EE7B7] flex items-center gap-1.5">
            <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
            Suara Hangat Warga &amp; Keluarga Dusun Grontol
          </p>
          <h2 className="font-display text-2xl font-bold text-[#111C17]">
            Cerita Mereka Bersama Rumah Baca Almahyra
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#4A5D54]">
            Rata-rata rating{' '}
            <strong className="font-mono-tabular text-[#111C17]">{avgRating}/5</strong> dari{' '}
            <strong className="font-mono-tabular text-[#111C17]">{testimonials.length}</strong>{' '}
            testimoni pembaca, orang tua, dan sahabat literasi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen((prev) => !prev)}
          aria-expanded={formOpen}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 self-start rounded-xl bg-[#087C3B] px-4 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 whitespace-nowrap shrink-0 sm:self-auto"
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          {formOpen ? 'Sembunyikan Formulir' : 'Tulis Testimoni Anda'}
        </button>
      </div>

      {/* Interactive Testimonial Submission Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          data-testid="testimonial-form"
          className="rounded-2xl border border-[#DCE4DF] bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[#EEF3F0] pb-3">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#111C17]">
                Tulis Testimoni Tentang Aplikasi Rumah Baca Almahyra
              </h3>
              <p className="text-xs text-[#4A5D54]">
                Bagikan pengalaman Anda membaca flipbook, menonton video edukasi, atau berkegiatan bersama anak.
              </p>
            </div>
          </div>

          {/* Star Rating Picker */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-[#111C17]">
              Penilaian Anda
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Pilih rating bintang">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const active = starVal <= rating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      role="radio"
                      aria-checked={rating === starVal}
                      aria-label={`Beri rating ${starVal} bintang`}
                      onClick={() => setRating(starVal)}
                      className="rounded-lg p-1.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#087C3B]"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          active
                            ? 'fill-[#FFC51B] text-[#B45309]'
                            : 'text-[#CBD5CF] hover:text-[#FFC51B]'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-[#4A5D54]">
                {rating}/5 · {RATING_LABELS[rating]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div>
              <label htmlFor="testi-nama" className="block text-xs font-semibold text-[#111C17]">
                Nama Anda <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="testi-nama"
                type="text"
                required
                maxLength={60}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Ibu Dewi Lestari"
                className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs sm:text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#087C3B] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="testi-peran" className="block text-xs font-semibold text-[#111C17]">
                Peran Anda
              </label>
              <select
                id="testi-peran"
                value={peran}
                onChange={(e) => setPeran(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs sm:text-sm font-medium text-[#111C17] focus:border-[#087C3B] focus:outline-none"
              >
                {ROLE_PRESETS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="testi-komunitas" className="block text-xs font-semibold text-[#111C17]">
                Asal / Komunitas (Opsional)
              </label>
              <input
                id="testi-komunitas"
                type="text"
                maxLength={80}
                value={komunitas}
                onChange={(e) => setKomunitas(e.target.value)}
                placeholder="Contoh: Warga Desa Tlogosari"
                className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs sm:text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#087C3B] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="testi-kutipan" className="block text-xs font-semibold text-[#111C17]">
                Testimoni Anda <span className="text-[#DC2626]">*</span>
              </label>
              <span className="font-mono-tabular text-[11px] text-[#6B7D74]">
                {kutipan.length}/400
              </span>
            </div>
            <textarea
              id="testi-kutipan"
              required
              rows={3}
              maxLength={400}
              value={kutipan}
              onChange={(e) => setKutipan(e.target.value)}
              placeholder="Ceritakan pengalaman Anda atau anak-anak menggunakan aplikasi Rumah Baca Almahyra..."
              className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2.5 text-xs sm:text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#087C3B] focus:outline-none"
            />
          </div>

          {feedback && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200'
              }`}
            >
              {feedback.type === 'success' && (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-[#6B7D74]">
              Testimoni Anda akan langsung tampil di daftar cerita warga di bawah ini.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#087C3B] px-5 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 disabled:opacity-60 whitespace-nowrap"
            >
              <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {submitting ? 'Mengirim Testimoni...' : 'Kirim Testimoni'}
            </button>
          </div>
        </form>
      )}

      {/* Testimonial Cards Grid */}
      <div
        data-testid="testimonials-grid"
        className="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        {testimonials.map((t) => (
          <article
            key={t.id}
            className="flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4 shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1" aria-label={`Rating ${t.rating} dari 5`}>
                  {Array.from({ length: Math.min(5, Math.max(1, t.rating)) }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-[#FFC51B] text-[#B45309]"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                {t.tanggal && (
                  <span className="font-mono-tabular text-[11px] text-[#6B7D74]">
                    {t.tanggal}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-[#4A5D54]">
                &ldquo;{t.kutipan}&rdquo;
              </p>
            </div>

            <div className="border-t border-[#EEF3F0] pt-3">
              <p className="font-display text-sm font-bold text-[#111C17]">{t.nama}</p>
              <p className="text-xs text-[#4A5D54]">
                {t.peran} · {t.komunitas}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
