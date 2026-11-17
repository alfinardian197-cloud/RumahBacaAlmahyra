import { useMemo, useState, type FormEvent } from 'react';
import { BookOpen, CheckCircle2, Palette, Plus, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { AlmahyraDatabase, AuthSession, CreationCategory, CreationWork } from '../types/almahyra';
import { CREATION_CATEGORIES, filterApprovedCreations } from '../utils/almahyra';
import { ResilientImage } from './ResilientImage';
import { DEFAULT_HERO_IMAGE_URL } from '../data/defaultDb';

interface CreationGallerySectionProps {
  db: AlmahyraDatabase;
  session: AuthSession | null;
  onSubmitCreation: (payload: {
    judul: string;
    kategori: CreationCategory;
    namaSamaran: string;
    jenjangUsia: string;
    ringkasan: string;
    konten: string;
  }) => Promise<{ ok: boolean; message: string }>;
}

const CATEGORY_TINTS: Record<CreationCategory, { bg: string; text: string }> = {
  'Cerita pendek': { bg: '#E6F7FE', text: '#0369A1' },
  Puisi: { bg: '#FFF8DF', text: '#B45309' },
  Gambar: { bg: '#FFF1E5', text: '#C2410C' },
  Komik: { bg: '#F1FBE5', text: '#15803D' },
  'Resensi buku': { bg: '#EAF8EE', text: '#087C3B' },
  Kerajinan: { bg: '#F5F3FF', text: '#6D28D9' },
};

export function CreationGallerySection({
  db,
  session,
  onSubmitCreation,
}: CreationGallerySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | CreationCategory>('Semua');
  const [activeWork, setActiveWork] = useState<CreationWork | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  // Submission form state
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<CreationCategory>('Cerita pendek');
  const [namaSamaran, setNamaSamaran] = useState(() =>
    session?.displayName ? session.displayName.split(' ')[0] : '',
  );
  const [jenjangUsia, setJenjangUsia] = useState('SD Awal');
  const [ringkasan, setRingkasan] = useState('');
  const [konten, setKonten] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const visibleCreations = useMemo(
    () => filterApprovedCreations(db.creations, selectedCategory),
    [db.creations, selectedCategory],
  );

  const handleOpenSubmit = () => {
    setFeedback(null);
    if (session?.displayName && !namaSamaran) {
      setNamaSamaran(session.displayName.split(' ')[0] ?? '');
    }
    setSubmitModalOpen(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !namaSamaran.trim() || !konten.trim()) {
      setFeedback({ ok: false, text: 'Judul karya, nama samaran anak, dan isi karya wajib diisi.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await onSubmitCreation({
        judul: judul.trim(),
        kategori,
        namaSamaran: namaSamaran.trim(),
        jenjangUsia,
        ringkasan: ringkasan.trim(),
        konten: konten.trim(),
      });
      setFeedback({ ok: res.ok, text: res.message });
      if (res.ok) {
        setJudul('');
        setRingkasan('');
        setKonten('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="galeri-karya"
      aria-label="Galeri Karya Anak Almahyra"
      className="scroll-mt-20 rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-[#F58220] flex items-center gap-1.5">
            <Palette className="h-4 w-4" aria-hidden="true" />
            Pilar Berkarya · Ruang Ekspresi Anak Indonesia
          </p>
          <h2 className="font-display text-2xl font-bold text-[#111C17]">
            Galeri Karya Sahabat Almahyra ({visibleCreations.length} Karya Terbit)
          </h2>
          <p className="mt-1 text-sm text-[#4A5D54]">
            Menampilkan cerita pendek, puisi, gambar, komik, resensi buku, dan kerajinan yang telah disetujui orang tua &amp; moderator (menggunakan nama samaran aman).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenSubmit}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#F58220] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Kirim Karya Saya
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['Semua', ...CREATION_CATEGORIES] as const).map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={active}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                active
                  ? 'bg-[#087C3B] text-white'
                  : 'border border-[#DCE4DF] bg-[#F8FAF9] text-[#4A5D54] hover:text-[#111C17]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Polaroid / Framed Karya Grid */}
      {visibleCreations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CBD6D0] bg-[#F8FAF9] p-8 text-center text-sm text-[#4A5D54]">
          Belum ada karya terbit di kategori ini. Ayo jadi sahabat pertama yang mengirim karya!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCreations.map((work, idx) => {
            const tint = CATEGORY_TINTS[work.kategori] ?? { bg: '#EAF8EE', text: '#087C3B' };
            return (
              <article
                key={work.id}
                className={`card-3d-tilt flex flex-col justify-between rounded-2xl border border-[#E2E8E5] bg-[#FFFDF6] p-4 shadow-xs ${
                  idx % 2 === 1 ? 'sm:rotate-[0.6deg]' : 'sm:-rotate-[0.5deg]'
                }`}
              >
                <div className="space-y-3">
                  {work.imageUrl && (
                    <div className="aspect-16/9 w-full overflow-hidden rounded-xl border border-[#E7EEEA] bg-[#EEF3F0]">
                      <ResilientImage
                        src={work.imageUrl}
                        fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                        alt={`Karya ${work.judul}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span
                      className="rounded-lg px-2.5 py-1 font-bold"
                      style={{ backgroundColor: tint.bg, color: tint.text }}
                    >
                      {work.kategori}
                    </span>
                    <span className="font-mono-tabular text-[#4A5D54]">{work.createdAt}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#111C17] leading-snug">
                    {work.judul}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#4A5D54] line-clamp-3">
                    {work.ringkasan}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EEF3F0] pt-3">
                  <div className="text-xs">
                    <span className="font-bold text-[#111C17]">{work.namaSamaran}</span>
                    <span className="ml-1.5 text-[#4A5D54]">· {work.jenjangUsia}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveWork(work)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#087C3B] px-3 py-1.5 text-xs font-bold text-white hover:opacity-95"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    Baca Karya
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail Work Reader Modal */}
      {activeWork && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detail Karya ${activeWork.judul}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#F58220]">
                  {activeWork.kategori} · {activeWork.jenjangUsia}
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-[#111C17]">
                  {activeWork.judul}
                </h3>
                <p className="mt-1 text-xs text-[#4A5D54]">
                  Karya: <strong>{activeWork.namaSamaran}</strong> · Diterbitkan {activeWork.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveWork(null)}
                aria-label="Tutup karya"
                className="rounded-xl p-2 text-[#4A5D54] hover:bg-[#F2F6F4]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {activeWork.imageUrl && (
              <div className="aspect-16/9 w-full overflow-hidden rounded-2xl border border-[#E7EEEA]">
                <ResilientImage
                  src={activeWork.imageUrl}
                  fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                  alt={activeWork.judul}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="rounded-2xl border border-[#E7EEEA] bg-[#FFF8E8] p-5 text-sm leading-relaxed text-[#111C17] whitespace-pre-line">
              {activeWork.konten}
            </div>

            <div className="flex items-center justify-between text-xs text-[#4A5D54]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Terverifikasi Orang Tua &amp; Moderator Almahyra
              </span>
              <button
                type="button"
                onClick={() => setActiveWork(null)}
                className="rounded-xl bg-[#087C3B] px-4 py-2 font-bold text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {submitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Formulir Kirim Karya Anak"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#DCE4DF] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#087C3B] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Kirim Karya Literasi Anak
                </p>
                <h3 className="font-display text-xl font-bold text-[#111C17]">
                  Bagikan Cerita, Puisi, Komik, atau Resensimu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                aria-label="Tutup formulir karya"
                className="rounded-xl p-2 text-[#4A5D54] hover:bg-[#F2F6F4]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-[#FFF8DF] px-3.5 py-2.5 text-xs text-[#78350F]">
              <strong>Perlindungan Privasi Anak:</strong> Gunakan nama panggilan/samaran (bukan alamat atau nomor telepon). Karya akan masuk antrean moderasi Admin &amp; persetujuan Orang Tua sebelum tayang ke publik.
            </div>

            {feedback && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                  feedback.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="cr-judul" className="block text-xs font-bold text-[#111C17]">
                  Judul Karya
                </label>
                <input
                  id="cr-judul"
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Petualangan Lentera Hutan Grontol"
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-sm text-[#111C17]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="cr-kat" className="block text-xs font-bold text-[#111C17]">
                    Kategori Karya
                  </label>
                  <select
                    id="cr-kat"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as CreationCategory)}
                    className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-sm text-[#111C17]"
                  >
                    {CREATION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cr-jenjang" className="block text-xs font-bold text-[#111C17]">
                    Jenjang Usia
                  </label>
                  <select
                    id="cr-jenjang"
                    value={jenjangUsia}
                    onChange={(e) => setJenjangUsia(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-sm text-[#111C17]"
                  >
                    <option value="PAUD/TK">PAUD / TK</option>
                    <option value="SD Awal">SD Awal (Kelas 1–3)</option>
                    <option value="SD Lanjut">SD Lanjut (Kelas 4–6)</option>
                    <option value="SMP">SMP</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cr-nama" className="block text-xs font-bold text-[#111C17]">
                  Nama Panggilan / Samaran Aman
                </label>
                <input
                  id="cr-nama"
                  type="text"
                  value={namaSamaran}
                  onChange={(e) => setNamaSamaran(e.target.value)}
                  placeholder="Contoh: Nadia P. (Grontol)"
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-sm text-[#111C17]"
                />
              </div>

              <div>
                <label htmlFor="cr-ringkas" className="block text-xs font-bold text-[#111C17]">
                  Ringkasan Singkat (Opsional)
                </label>
                <input
                  id="cr-ringkas"
                  type="text"
                  value={ringkasan}
                  onChange={(e) => setRingkasan(e.target.value)}
                  placeholder="Satu kalimat tentang karyamu"
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-sm text-[#111C17]"
                />
              </div>

              <div>
                <label htmlFor="cr-isi" className="block text-xs font-bold text-[#111C17]">
                  Isi Karya / Deskripsi Gambar atau Kerajinan
                </label>
                <textarea
                  id="cr-isi"
                  rows={4}
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  placeholder="Tuliskan cerita, bait puisi, dialog komik, resensi buku, atau bahan & langkah kerajinanmu di sini..."
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-sm text-[#111C17]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="rounded-xl border border-[#DCE4DF] px-4 py-2 text-xs font-semibold text-[#4A5D54]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#087C3B] px-5 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-60"
                >
                  {submitting ? 'Mengirim...' : 'Kirim ke Antrean Moderasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
