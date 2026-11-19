import { useMemo, useState } from 'react';
import { BookMarked, Check, Copy, HeartHandshake, MessageCircle } from 'lucide-react';
import type { AlmahyraDatabase } from '../types/almahyra';
import {
  buildBorrowWhatsAppMessage,
  buildDonationWhatsAppMessage,
  buildWhatsAppShareHref,
  DEFAULT_MANAGER_WHATSAPP_DISPLAY,
} from '../utils/almahyra';

interface BorrowDonationPanelProps {
  db: AlmahyraDatabase;
  defaultTab?: 'borrow' | 'donate';
}

export function BorrowDonationPanel({
  db,
  defaultTab = 'borrow',
}: BorrowDonationPanelProps) {
  const [activeTab, setActiveTab] = useState<'borrow' | 'donate'>(defaultTab);
  const availableBooks = useMemo(
    () => db.books.filter((b) => b.aktif !== false),
    [db.books],
  );

  // Borrow state
  const [borrowerName, setBorrowerName] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(availableBooks[0]?.id ?? '');
  const [borrowDate, setBorrowDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [borrowNotes, setBorrowNotes] = useState('');

  // Donation state
  const [donorName, setDonorName] = useState('');
  const [donorOrigin, setDonorOrigin] = useState('');
  const [bookCount, setBookCount] = useState(2);
  const [bookTopics, setBookTopics] = useState('Buku cerita bergambar & ensiklopedia anak SD');
  const [condition, setCondition] = useState('Layak baca & bersih');
  const [donationNotes, setDonationNotes] = useState('');

  const [copiedMsg, setCopiedMsg] = useState(false);

  const selectedBook = useMemo(
    () => availableBooks.find((b) => b.id === selectedBookId) ?? availableBooks[0],
    [availableBooks, selectedBookId],
  );

  const composedMessage = useMemo(() => {
    if (activeTab === 'borrow') {
      return buildBorrowWhatsAppMessage({
        borrowerName,
        memberCode,
        bookCode: selectedBook?.kodeBuku,
        bookTitle: selectedBook?.judul ?? 'Koleksi Rumah Baca',
        borrowDate,
        notes: borrowNotes,
      });
    }
    return buildDonationWhatsAppMessage({
      donorName,
      donorOrigin,
      bookCount,
      bookTopics,
      condition,
      notes: donationNotes,
    });
  }, [
    activeTab,
    borrowerName,
    memberCode,
    selectedBook,
    borrowDate,
    borrowNotes,
    donorName,
    donorOrigin,
    bookCount,
    bookTopics,
    condition,
    donationNotes,
  ]);

  const managerPhoneDisplay =
    db.config.whatsappNumber?.trim() || DEFAULT_MANAGER_WHATSAPP_DISPLAY;

  const waHref = useMemo(
    () => buildWhatsAppShareHref(composedMessage, managerPhoneDisplay),
    [composedMessage, managerPhoneDisplay],
  );

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(composedMessage);
      }
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2400);
    } catch {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2400);
    }
  };

  return (
    <section
      id="formulir-pinjam-donasi"
      aria-label="Formulir Peminjaman dan Donasi Buku Instan"
      className="scroll-mt-20 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#EEF3F0] pb-4">
        <div className="space-y-1">
          <p
            className="text-xs font-semibold"
            style={{ color: 'var(--brand-accent-ink)' }}
          >
            Layanan Instan Teras Dusun Grontol
          </p>
          <h2 className="font-display text-2xl font-bold text-[#111C17]">
            Formulir Peminjaman & Donasi Buku Instan
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5D54]">
            Susun otomatis ringkasan pesan siap kirim ke WhatsApp pengelola Rumah Baca Almahyra (
            <strong className="font-mono-tabular text-[#111C17]">{managerPhoneDisplay}</strong>).
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Pilih layanan formulir instan"
          className="inline-flex items-center rounded-xl bg-[#EEF3F0] p-1 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'borrow'}
            onClick={() => setActiveTab('borrow')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'borrow'
                ? 'bg-white text-[#111C17] shadow-xs'
                : 'text-[#4A5D54] hover:text-[#111C17]'
            }`}
          >
            <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
            Pinjam Buku Fisik
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'donate'}
            onClick={() => setActiveTab('donate')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'donate'
                ? 'bg-white text-[#111C17] shadow-xs'
                : 'text-[#4A5D54] hover:text-[#111C17]'
            }`}
          >
            <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
            Donasi Buku
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Form Inputs */}
        <div className="lg:col-span-6 space-y-4">
          {activeTab === 'borrow' ? (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="wa-borrow-name" className="block text-xs font-semibold text-[#111C17]">
                  Nama Peminjam / Orang Tua
                </label>
                <input
                  id="wa-borrow-name"
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Contoh: Ibu Siti Aminah"
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17] placeholder:text-[#8A9B92]"
                />
              </div>
              <div>
                <label htmlFor="wa-borrow-code" className="block text-xs font-semibold text-[#111C17]">
                  Nomor Anggota (Opsional)
                </label>
                <input
                  id="wa-borrow-code"
                  type="text"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  placeholder="Mis. ALMA-001"
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17] placeholder:text-[#8A9B92]"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="wa-borrow-book" className="block text-xs font-semibold text-[#111C17]">
                  Pilih Judul Buku
                </label>
                <select
                  id="wa-borrow-book"
                  value={selectedBook?.id ?? ''}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-medium text-[#111C17]"
                >
                  {availableBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.status}] {b.kodeBuku} — {b.judul}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="wa-borrow-date" className="block text-xs font-semibold text-[#111C17]">
                  Rencana Tanggal Ambil
                </label>
                <input
                  id="wa-borrow-date"
                  type="date"
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17]"
                />
              </div>
              <div>
                <label htmlFor="wa-borrow-notes" className="block text-xs font-semibold text-[#111C17]">
                  Catatan Tambahan
                </label>
                <input
                  id="wa-borrow-notes"
                  type="text"
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  placeholder="Diambil sore saat Sabtu Dongeng..."
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17] placeholder:text-[#8A9B92]"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="wa-donor-name" className="block text-xs font-semibold text-[#111C17]">
                  Nama Donatur / Sahabat
                </label>
                <input
                  id="wa-donor-name"
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Contoh: Keluarga Pak Budi"
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17] placeholder:text-[#8A9B92]"
                />
              </div>
              <div>
                <label htmlFor="wa-donor-origin" className="block text-xs font-semibold text-[#111C17]">
                  Asal / Komunitas
                </label>
                <input
                  id="wa-donor-origin"
                  type="text"
                  value={donorOrigin}
                  onChange={(e) => setDonorOrigin(e.target.value)}
                  placeholder="Desa Tlogosari / Alumni"
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17] placeholder:text-[#8A9B92]"
                />
              </div>
              <div>
                <label htmlFor="wa-donor-count" className="block text-xs font-semibold text-[#111C17]">
                  Perkiraan Jumlah Buku
                </label>
                <input
                  id="wa-donor-count"
                  type="number"
                  min={1}
                  max={500}
                  value={bookCount}
                  onChange={(e) => setBookCount(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17]"
                />
              </div>
              <div>
                <label htmlFor="wa-donor-condition" className="block text-xs font-semibold text-[#111C17]">
                  Kondisi Buku
                </label>
                <select
                  id="wa-donor-condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-medium text-[#111C17]"
                >
                  <option value="Baru">Baru</option>
                  <option value="Layak baca & bersih">Layak baca & bersih</option>
                  <option value="Campuran baru & layak baca">Campuran baru & layak baca</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="wa-donor-topics" className="block text-xs font-semibold text-[#111C17]">
                  Judul atau Topik Buku
                </label>
                <input
                  id="wa-donor-topics"
                  type="text"
                  value={bookTopics}
                  onChange={(e) => setBookTopics(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17]"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="wa-donor-notes" className="block text-xs font-semibold text-[#111C17]">
                  Jadwal Antar / Jemput
                </label>
                <input
                  id="wa-donor-notes"
                  type="text"
                  value={donationNotes}
                  onChange={(e) => setDonationNotes(e.target.value)}
                  placeholder="Siap diantar ke Teras Almahyra akhir pekan ini..."
                  className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17] placeholder:text-[#8A9B92]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Live WhatsApp Preview & Actions */}
        <div className="lg:col-span-6 rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#111C17]">
            <span>Pratinjau Pesan WhatsApp Siap Kirim</span>
            <span className="font-mono-tabular text-[11px] font-bold text-[#087C3B] dark:text-[#6EE7B7]">
              WA Pengelola: {managerPhoneDisplay}
            </span>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-[#E2E8E5] bg-white p-3.5 font-sans text-xs leading-relaxed text-[#4A5D54]">
            {composedMessage}
          </pre>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: db.config.primaryColor }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Kirim via WhatsApp ({managerPhoneDisplay})
            </a>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
            >
              {copiedMsg ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  Pesan Disalin!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Salin Ringkasan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
