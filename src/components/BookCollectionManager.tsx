import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  BookPlus,
  Download,
  Edit3,
  FileText,
  FileUp,
  Layers,
  Plus,
  Power,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { DEFAULT_BOOK_COVER_URL } from '../data/defaultDb';
import type {
  AlmahyraDatabase,
  Book,
  BookPage,
  BookQuizQuestion,
} from '../types/almahyra';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_READER_LEVELS,
  parseBulkBooksCsv,
} from '../utils/almahyra';

interface BookCollectionManagerProps {
  db: AlmahyraDatabase;
  onUpdateDb: (nextDb: AlmahyraDatabase) => Promise<void>;
  onNotify: (type: 'ok' | 'err', text: string) => void;
  onRequestDeleteBook: (book: Book) => void;
}

const ZONES = [
  'Zona Imajinasi',
  'Zona Pengetahuan',
  'Zona Kreativitas',
  'Zona Eksplorasi',
  'Zona Sahabat Bumi',
  'Zona Panggung Cerita',
];

export function BookCollectionManager({
  db,
  onUpdateDb,
  onNotify,
  onRequestDeleteBook,
}: BookCollectionManagerProps) {
  const categories = db.categories && db.categories.length > 0 ? db.categories : [...DEFAULT_CATEGORIES];
  const readerLevels = db.readerLevels && db.readerLevels.length > 0 ? db.readerLevels : [...DEFAULT_READER_LEVELS];

  // Filter / Table search
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCatFilter, setAdminCatFilter] = useState('Semua');

  // Book Form State (Add / Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kodeBuku, setKodeBuku] = useState('');
  const [judul, setJudul] = useState('');
  const [penulis, setPenulis] = useState('');
  const [kategori, setKategori] = useState(categories[0]);
  const [jenjangPembaca, setJenjangPembaca] = useState(readerLevels[1] || 'SD Awal');
  const [estimasiMenit, setEstimasiMenit] = useState(5);
  const [zona, setZona] = useState('Zona Imajinasi');
  const [stok, setStok] = useState(2);
  const [lokasiRak, setLokasiRak] = useState('Rak Rendah A1');
  const [deskripsi, setDeskripsi] = useState('');
  const [lisensi, setLisensi] = useState('Lisensi Terbuka Rumah Baca Almahyra');
  const [coverUrl, setCoverUrl] = useState(DEFAULT_BOOK_COVER_URL);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [pdfNamaFile, setPdfNamaFile] = useState<string | undefined>(undefined);
  const [aktif, setAktif] = useState(true);
  const [pilihanAlmahyra, setPilihanAlmahyra] = useState(false);
  const [isiBacaan, setIsiBacaan] = useState<BookPage[]>([
    {
      judulBab: 'Bagian 1 · Awal Petualangan',
      isi: '',
      pesanMoral: '',
    },
  ]);
  const [kuis, setKuis] = useState<BookQuizQuestion[]>([
    {
      pertanyaan: '',
      pilihan: ['', '', ''],
      jawabanBenar: 0,
      penjelasan: '',
    },
  ]);

  // Taxonomy & Bulk Import toggles
  const [showTaxonomy, setShowTaxonomy] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLevelName, setNewLevelName] = useState('');

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [csvText, setCsvText] = useState(
    'Kode Buku,Judul,Penulis,Kategori,Jenjang Pembaca,Estimasi Menit,Zona,Sinopsis,Isi Bacaan\nBK-101,"Kisah Pohon Mangga Tlogosari","Bu Aminah","Lingkungan dan Alam","SD Awal",5,"Zona Sahabat Bumi","Tentang merawat pohon buah bersama warga","Bab 1 Menanam bibit mangga.|Bab 2 Merawat dengan kompos."',
  );

  const filteredAdminBooks = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return db.books.filter((b) => {
      if (adminCatFilter !== 'Semua' && b.kategori !== adminCatFilter) return false;
      if (!q) return true;
      return (
        b.judul.toLowerCase().includes(q) ||
        b.penulis.toLowerCase().includes(q) ||
        b.kodeBuku.toLowerCase().includes(q) ||
        b.kategori.toLowerCase().includes(q)
      );
    });
  }, [db.books, adminSearch, adminCatFilter]);

  const resetForm = () => {
    setEditingId(null);
    setKodeBuku('');
    setJudul('');
    setPenulis('');
    setKategori(categories[0]);
    setJenjangPembaca(readerLevels[1] || 'SD Awal');
    setEstimasiMenit(5);
    setZona('Zona Imajinasi');
    setStok(2);
    setLokasiRak('Rak Rendah A1');
    setDeskripsi('');
    setLisensi('Lisensi Terbuka Rumah Baca Almahyra');
    setCoverUrl(DEFAULT_BOOK_COVER_URL);
    setPdfUrl(undefined);
    setPdfNamaFile(undefined);
    setAktif(true);
    setPilihanAlmahyra(false);
    setIsiBacaan([{ judulBab: 'Bagian 1 · Awal Petualangan', isi: '', pesanMoral: '' }]);
    setKuis([{ pertanyaan: '', pilihan: ['', '', ''], jawabanBenar: 0, penjelasan: '' }]);
  };

  const handleEditBook = (b: Book) => {
    setEditingId(b.id);
    setKodeBuku(b.kodeBuku);
    setJudul(b.judul);
    setPenulis(b.penulis);
    setKategori(b.kategori);
    setJenjangPembaca(b.jenjangPembaca ?? 'Semua Usia');
    setEstimasiMenit(b.estimasiMenit ?? 5);
    setZona(b.zona);
    setStok(b.stok);
    setLokasiRak(b.lokasiRak);
    setDeskripsi(b.deskripsi);
    setLisensi(b.lisensi ?? 'Lisensi Terbuka Rumah Baca Almahyra');
    setCoverUrl(b.coverUrl ?? DEFAULT_BOOK_COVER_URL);
    setPdfUrl(b.pdfUrl);
    setPdfNamaFile(b.pdfNamaFile);
    setAktif(b.aktif !== false);
    setPilihanAlmahyra(Boolean(b.pilihanAlmahyra));
    setIsiBacaan(
      b.isiBacaan && b.isiBacaan.length > 0
        ? b.isiBacaan
        : [{ judulBab: 'Bagian 1 · Awal Cerita', isi: '', pesanMoral: '' }],
    );
    setKuis(
      b.kuis && b.kuis.length > 0
        ? b.kuis
        : [{ pertanyaan: '', pilihan: ['', '', ''], jawabanBenar: 0, penjelasan: '' }],
    );
  };

  const handleCoverUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      if (result) {
        setCoverUrl(result);
        onNotify('ok', `Sampul "${file.name}" berhasil dimuat.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      onNotify('err', 'Ukuran PDF maksimal 12 MB agar ringan untuk peramban anak.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      if (result) {
        setPdfUrl(result);
        setPdfNamaFile(file.name);
        onNotify('ok', `Materi PDF berizin "${file.name}" siap ditautkan ke buku.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !penulis.trim()) {
      onNotify('err', 'Judul buku dan nama penulis wajib diisi.');
      return;
    }

    const cleanedPages = isiBacaan.filter((p) => p.isi.trim().length > 0);
    const cleanedQuiz = kuis.filter(
      (q) => q.pertanyaan.trim().length > 0 && q.pilihan.some((p) => p.trim().length > 0),
    );

    if (editingId) {
      const nextBooks = db.books.map((existing) =>
        existing.id !== editingId
          ? existing
          : {
              ...existing,
              kodeBuku: kodeBuku.trim() || existing.kodeBuku,
              judul: judul.trim(),
              penulis: penulis.trim(),
              kategori,
              jenjangPembaca,
              estimasiMenit: Math.max(1, Number(estimasiMenit) || 5),
              zona,
              stok: Math.max(1, Number(stok) || 1),
              lokasiRak: lokasiRak.trim() || 'Rak Utama',
              deskripsi:
                deskripsi.trim() ||
                `${judul.trim()} — bacaan kategori ${kategori} di ${zona}.`,
              lisensi: lisensi.trim(),
              coverUrl,
              pdfUrl,
              pdfNamaFile,
              aktif,
              pilihanAlmahyra,
              isiBacaan: cleanedPages.length > 0 ? cleanedPages : existing.isiBacaan,
              kuis: cleanedQuiz.length > 0 ? cleanedQuiz : existing.kuis,
            },
      );
      await onUpdateDb({ ...db, books: nextBooks });
      onNotify('ok', `Informasi buku "${judul.trim()}" berhasil diperbarui.`);
      resetForm();
      return;
    }

    const finalCode =
      kodeBuku.trim() || `BK-${String(db.books.length + 1).padStart(3, '0')}`;
    const newBook: Book = {
      id: `bk-${Date.now()}`,
      kodeBuku: finalCode,
      judul: judul.trim(),
      penulis: penulis.trim(),
      kategori,
      jenjangPembaca,
      estimasiMenit: Math.max(1, Number(estimasiMenit) || 5),
      zona,
      status: 'Tersedia',
      stok: Math.max(1, Number(stok) || 1),
      lokasiRak: lokasiRak.trim() || 'Rak Utama',
      deskripsi:
        deskripsi.trim() || `${judul.trim()} — koleksi ${kategori} di ${zona}.`,
      lisensi: lisensi.trim(),
      coverUrl,
      pdfUrl,
      pdfNamaFile,
      aktif,
      pilihanAlmahyra,
      dibacaCount: 0,
      tanggalTerbit: new Date().toISOString().slice(0, 10),
      isiBacaan: cleanedPages.length > 0 ? cleanedPages : undefined,
      kuis: cleanedQuiz.length > 0 ? cleanedQuiz : undefined,
    };

    await onUpdateDb({ ...db, books: [newBook, ...db.books] });
    onNotify('ok', `Buku baru "${newBook.judul}" (${finalCode}) berhasil ditambahkan.`);
    resetForm();
  };

  const handleToggleActive = async (book: Book) => {
    const nextActive = book.aktif === false;
    await onUpdateDb({
      ...db,
      books: db.books.map((b) =>
        b.id === book.id ? { ...b, aktif: nextActive } : b,
      ),
    });
    onNotify(
      'ok',
      `Buku "${book.judul}" sekarang ${nextActive ? 'Aktif di Katalog' : 'Dinonaktifkan'}.`,
    );
  };

  const handleTogglePilihan = async (book: Book) => {
    const nextVal = !book.pilihanAlmahyra;
    await onUpdateDb({
      ...db,
      books: db.books.map((b) =>
        b.id === book.id ? { ...b, pilihanAlmahyra: nextVal } : b,
      ),
    });
    onNotify(
      'ok',
      nextVal
        ? `"${book.judul}" ditambahkan ke Rak Pilihan ALMAHYRA.`
        : `"${book.judul}" dilepas dari Rak Pilihan.`,
    );
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;
    if (categories.includes(clean)) {
      onNotify('err', `Kategori "${clean}" sudah tersedia.`);
      return;
    }
    await onUpdateDb({ ...db, categories: [...categories, clean] });
    setNewCategoryName('');
    onNotify('ok', `Kategori "${clean}" berhasil ditambahkan.`);
  };

  const handleDeleteCategory = async (cat: string) => {
    await onUpdateDb({
      ...db,
      categories: categories.filter((c) => c !== cat),
    });
    onNotify('ok', `Kategori "${cat}" dihapus dari daftar filter.`);
  };

  const handleAddLevel = async (e: FormEvent) => {
    e.preventDefault();
    const clean = newLevelName.trim();
    if (!clean) return;
    if (readerLevels.includes(clean)) {
      onNotify('err', `Jenjang "${clean}" sudah ada.`);
      return;
    }
    await onUpdateDb({ ...db, readerLevels: [...readerLevels, clean] });
    setNewLevelName('');
    onNotify('ok', `Jenjang pembaca "${clean}" berhasil ditambahkan.`);
  };

  const handleDeleteLevel = async (lvl: string) => {
    await onUpdateDb({
      ...db,
      readerLevels: readerLevels.filter((l) => l !== lvl),
    });
    onNotify('ok', `Jenjang pembaca "${lvl}" dihapus.`);
  };

  const handleBulkImportSubmit = async () => {
    const imported = parseBulkBooksCsv(csvText, DEFAULT_BOOK_COVER_URL);
    if (imported.length === 0) {
      onNotify('err', 'Tidak ada baris buku valid ditemukan pada CSV.');
      return;
    }
    await onUpdateDb({ ...db, books: [...imported, ...db.books] });
    onNotify('ok', `${imported.length} judul buku baru berhasil diimpor sekaligus tanpa ubah kode!`);
    setShowBulkImport(false);
  };

  const handleCsvFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''));
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvTemplate = () => {
    const sample = [
      'Kode Buku,Judul,Penulis,Kategori,Jenjang Pembaca,Estimasi Menit,Zona,Sinopsis,Isi Bacaan',
      'IMP-001,"Legenda Desa Tlogosari","Ibu Dewi","Cerita Nusantara","SD Awal",5,"Zona Imajinasi","Kisah kebersamaan warga menanam bambu","Bab 1 Awal mula.|Bab 2 Gotong royong warga."',
      'IMP-002,"Komik Energi Matahari","Tim Sains","Komik Edukasi","SD Lanjut",4,"Zona Pengetahuan","Komik ceria tentang panel surya","Panel 1 Cahaya pagi.|Panel 2 Lampu menyala."',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-impor-buku-almahyra.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Manage Categories / Reader Levels & Bulk CSV Import */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8E5] bg-white p-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#111C17]">
            Sistem Manajemen Koleksi Digital & Fisik ({db.books.length} Buku)
          </h2>
          <p className="text-xs text-[#4A5D54]">
            Tambah ratusan buku via formulir atau impor CSV, unggah sampul/PDF berizin, kelola kategori & jenjang pembaca.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowTaxonomy((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
          >
            <Layers className="h-3.5 w-3.5" />
            Kelola Kategori & Jenjang ({categories.length}/{readerLevels.length})
          </button>

          <button
            type="button"
            onClick={() => setShowBulkImport((v) => !v)}
            style={{ backgroundColor: db.config.accentColor }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white hover:opacity-95"
          >
            <FileUp className="h-3.5 w-3.5" />
            Impor Ratusan Buku (CSV)
          </button>
        </div>
      </div>

      {/* Category & Reader Level Taxonomy Manager */}
      {showTaxonomy && (
        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#E2E8E5] bg-white p-5 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#111C17]">
              Kelola Kategori Buku ({categories.length})
            </h3>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 rounded-lg border border-[#DCE4DF] px-3 py-1.5 text-xs"
              />
              <button
                type="submit"
                style={{ backgroundColor: db.config.primaryColor }}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-[#F8FAF9] px-2.5 py-1 text-xs font-medium text-[#111C17]"
                >
                  {cat}
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      aria-label={`Hapus kategori ${cat}`}
                      className="text-[#4A5D54] hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#111C17]">
              Kelola Jenjang Pembaca ({readerLevels.length})
            </h3>
            <form onSubmit={handleAddLevel} className="flex gap-2">
              <input
                type="text"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Contoh: Pra-Remaja"
                className="flex-1 rounded-lg border border-[#DCE4DF] px-3 py-1.5 text-xs"
              />
              <button
                type="submit"
                style={{ backgroundColor: db.config.primaryColor }}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </button>
            </form>
            <div className="flex flex-wrap gap-1.5">
              {readerLevels.map((lvl) => (
                <span
                  key={lvl}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-[#F8FAF9] px-2.5 py-1 text-xs font-medium text-[#111C17]"
                >
                  {lvl}
                  {readerLevels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLevel(lvl)}
                      aria-label={`Hapus jenjang ${lvl}`}
                      className="text-[#4A5D54] hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bulk CSV Import Panel */}
      {showBulkImport && (
        <section className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-[#111C17]">
                Impor Massal Koleksi Buku (CSV)
              </h3>
              <p className="text-xs text-[#4A5D54]">
                Unggah file CSV atau tempel baris data untuk menambah puluhan hingga ratusan judul buku sekaligus tanpa menyentuh kode program.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-1.5 text-xs font-semibold text-[#111C17]"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh Template CSV
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4]">
                <Upload className="h-3.5 w-3.5" />
                Pilih File .CSV
                <input type="file" accept=".csv,text/csv" onChange={handleCsvFileUpload} className="sr-only" />
              </label>
            </div>
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            aria-label="Konten CSV impor massal buku"
            className="w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] p-3 font-mono-tabular text-xs text-[#111C17]"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkImport(false)}
              className="rounded-xl border border-[#DCE4DF] px-4 py-2 text-xs font-semibold text-[#111C17]"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleBulkImportSubmit}
              style={{ backgroundColor: db.config.primaryColor }}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-white"
            >
              Proses & Tambah Semua Buku
            </button>
          </div>
        </section>
      )}

      {/* Main Split: Book Add/Edit Form + Catalog Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmitBook}
          className="lg:col-span-5 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-3.5 h-fit"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
              <BookPlus className="h-4 w-4" />
              {editingId ? 'Edit Informasi Buku' : 'Tambah Koleksi Buku Baru'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-[#4A5D54] hover:text-[#111C17]"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1">
              <label htmlFor="bk-kode" className="block text-xs font-semibold text-[#111C17]">
                Kode
              </label>
              <input
                id="bk-kode"
                type="text"
                value={kodeBuku}
                onChange={(e) => setKodeBuku(e.target.value)}
                placeholder="Auto"
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-2.5 py-2 text-xs font-mono-tabular"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="bk-judul" className="block text-xs font-semibold text-[#111C17]">
                Judul Buku *
              </label>
              <input
                id="bk-judul"
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Misteri Hutan Bambu"
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bk-penulis" className="block text-xs font-semibold text-[#111C17]">
              Nama Penulis *
            </label>
            <input
              id="bk-penulis"
              type="text"
              value={penulis}
              onChange={(e) => setPenulis(e.target.value)}
              placeholder="Nama penulis atau relawan"
              className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="bk-kat" className="block text-xs font-semibold text-[#111C17]">
                Kategori
              </label>
              <select
                id="bk-kat"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-2 text-xs"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bk-lvl" className="block text-xs font-semibold text-[#111C17]">
                Jenjang Pembaca
              </label>
              <select
                id="bk-lvl"
                value={jenjangPembaca}
                onChange={(e) => setJenjangPembaca(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-2 text-xs"
              >
                {readerLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="bk-menit" className="block text-xs font-semibold text-[#111C17]">
                Menit Baca
              </label>
              <input
                id="bk-menit"
                type="number"
                min={1}
                value={estimasiMenit}
                onChange={(e) => setEstimasiMenit(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-2.5 py-2 text-xs font-mono-tabular"
              />
            </div>
            <div>
              <label htmlFor="bk-stok" className="block text-xs font-semibold text-[#111C17]">
                Stok
              </label>
              <input
                id="bk-stok"
                type="number"
                min={1}
                value={stok}
                onChange={(e) => setStok(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-2.5 py-2 text-xs font-mono-tabular"
              />
            </div>
            <div>
              <label htmlFor="bk-rak" className="block text-xs font-semibold text-[#111C17]">
                Rak
              </label>
              <input
                id="bk-rak"
                type="text"
                value={lokasiRak}
                onChange={(e) => setLokasiRak(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-2.5 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="bk-zona" className="block text-xs font-semibold text-[#111C17]">
                Zona Petualangan
              </label>
              <select
                id="bk-zona"
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-2 text-xs"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bk-lisensi" className="block text-xs font-semibold text-[#111C17]">
                Lisensi Materi
              </label>
              <input
                id="bk-lisensi"
                type="text"
                value={lisensi}
                onChange={(e) => setLisensi(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-2.5 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bk-desc" className="block text-xs font-semibold text-[#111C17]">
              Sinopsis / Deskripsi Buku
            </label>
            <textarea
              id="bk-desc"
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Ringkasan menarik tentang isi buku..."
              className="mt-1 w-full rounded-lg border border-[#DCE4DF] px-3 py-2 text-xs"
            />
          </div>

          {/* Cover Upload & PDF Material Upload */}
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3">
            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold text-[#111C17]">
                Sampul Buku
              </span>
              <div className="flex items-center gap-2">
                <img
                  src={coverUrl}
                  alt="Pratinjau sampul"
                  className="h-10 w-10 rounded-lg object-cover border border-[#DCE4DF]"
                />
                <label className="cursor-pointer rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#111C17] hover:bg-[#F2F6F4]">
                  Unggah Sampul
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="sr-only" />
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[11px] font-semibold text-[#111C17]">
                PDF / Materi Berizin
              </span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#111C17] hover:bg-[#F2F6F4]">
                <FileText className="h-3.5 w-3.5" />
                {pdfNamaFile ? 'Ganti PDF' : 'Unggah PDF'}
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="sr-only" />
              </label>
              {pdfNamaFile && (
                <p className="truncate text-[10px] text-emerald-700 font-medium">{pdfNamaFile}</p>
              )}
            </div>
          </div>

          {/* Chapter Content Builder */}
          <div className="space-y-2 rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111C17]">
                Isi Bacaan Digital ({isiBacaan.length} Bab)
              </span>
              <button
                type="button"
                onClick={() =>
                  setIsiBacaan((prev) => [
                    ...prev,
                    { judulBab: `Bagian ${prev.length + 1}`, isi: '' },
                  ])
                }
                className="text-[11px] font-semibold hover:underline"
                style={{ color: 'var(--brand-primary-ink)' }}
              >
                + Tambah Halaman
              </button>
            </div>
            {isiBacaan.map((pg, idx) => (
              <div key={idx} className="space-y-1.5 rounded-lg bg-white p-2 border border-[#E2E8E5]">
                <input
                  type="text"
                  value={pg.judulBab}
                  onChange={(e) =>
                    setIsiBacaan((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, judulBab: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Judul Bab"
                  className="w-full rounded border border-[#DCE4DF] px-2 py-1 text-xs font-semibold"
                />
                <textarea
                  rows={2}
                  value={pg.isi}
                  onChange={(e) =>
                    setIsiBacaan((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, isi: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Tulis teks cerita / dialog komik..."
                  className="w-full rounded border border-[#DCE4DF] px-2 py-1 text-xs"
                />
              </div>
            ))}
          </div>

          {/* Quick Quiz Question Input */}
          <div className="space-y-2 rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-3">
            <span className="block text-xs font-semibold text-[#111C17]">
              Kuis Pemahaman (Opsional)
            </span>
            <input
              type="text"
              value={kuis[0]?.pertanyaan ?? ''}
              onChange={(e) =>
                setKuis((prev) => [
                  { ...prev[0], pertanyaan: e.target.value },
                  ...prev.slice(1),
                ])
              }
              placeholder="Pertanyaan kuis utama..."
              className="w-full rounded border border-[#DCE4DF] bg-white px-2.5 py-1.5 text-xs"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={kuis[0]?.pilihan[0] ?? ''}
                onChange={(e) =>
                  setKuis((prev) => [
                    {
                      ...prev[0],
                      pilihan: [e.target.value, prev[0].pilihan[1] ?? '', prev[0].pilihan[2] ?? ''],
                      jawabanBenar: 0,
                    },
                    ...prev.slice(1),
                  ])
                }
                placeholder="Jawaban Benar"
                className="rounded border border-emerald-200 bg-white px-2 py-1 text-[11px]"
              />
              <input
                type="text"
                value={kuis[0]?.pilihan[1] ?? ''}
                onChange={(e) =>
                  setKuis((prev) => [
                    {
                      ...prev[0],
                      pilihan: [prev[0].pilihan[0] ?? '', e.target.value, prev[0].pilihan[2] ?? ''],
                    },
                    ...prev.slice(1),
                  ])
                }
                placeholder="Pilihan Pengecoh"
                className="rounded border border-[#DCE4DF] bg-white px-2 py-1 text-[11px]"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 font-medium text-[#111C17]">
              <input
                type="checkbox"
                checked={aktif}
                onChange={(e) => setAktif(e.target.checked)}
                className="h-4 w-4 accent-[#136B36]"
              />
              Aktif di Katalog Publik
            </label>
            <label className="inline-flex items-center gap-1.5 font-medium text-[#111C17]">
              <input
                type="checkbox"
                checked={pilihanAlmahyra}
                onChange={(e) => setPilihanAlmahyra(e.target.checked)}
                className="h-4 w-4 accent-[#D98200]"
              />
              Tampilkan di Rak Pilihan
            </label>
          </div>

          <button
            type="submit"
            style={{ backgroundColor: db.config.primaryColor }}
            className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95"
          >
            {editingId ? 'Simpan Perubahan Buku' : 'Simpan Buku ke Katalog'}
          </button>
        </form>

        {/* Right: Catalog Table with Search, Filter, Toggle Active & Edit */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7D74]" />
              <input
                type="search"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Cari kode, judul, atau penulis..."
                aria-label="Cari buku admin"
                className="w-full rounded-lg border border-[#DCE4DF] bg-white py-2 pl-9 pr-3 text-xs"
              />
            </div>
            <select
              aria-label="Filter kategori admin"
              value={adminCatFilter}
              onChange={(e) => setAdminCatFilter(e.target.value)}
              className="rounded-lg border border-[#DCE4DF] bg-white px-3 py-2 text-xs font-medium"
            >
              <option value="Semua">Semua Kategori ({db.books.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8E5] font-semibold text-[#4A5D54]">
                  <th className="py-2.5 pr-3">Buku</th>
                  <th className="py-2.5 px-2">Kategori & Jenjang</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 pl-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F0]">
                {filteredAdminBooks.map((b) => {
                  const isActiveBook = b.aktif !== false;
                  return (
                    <tr key={b.id} className="hover:bg-[#F8FAF9]">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          {b.coverUrl && (
                            <img
                              src={b.coverUrl}
                              alt={b.judul}
                              className="h-10 w-10 rounded-lg object-cover border border-[#E2E8E5] shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-[#111C17]">{b.judul}</div>
                            <div className="font-mono-tabular text-[11px] text-[#4A5D54]">
                              {b.kodeBuku} · {b.penulis} · {b.estimasiMenit ?? 5} mnt
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#111C17]">{b.kategori}</div>
                        <div className="text-[11px] text-[#4A5D54]">
                          {b.jenjangPembaca ?? 'Semua Usia'} · {b.dibacaCount ?? 0}x dibaca
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`font-semibold ${
                            isActiveBook ? 'text-emerald-700' : 'text-[#6B7D74]'
                          }`}
                        >
                          {isActiveBook ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePilihan(b)}
                          title="Tandai Rak Pilihan"
                          aria-label={`Tandai ${b.judul} sebagai Pilihan`}
                          className={`rounded-lg p-1.5 ${
                            b.pilihanAlmahyra
                              ? 'text-amber-500 hover:bg-[#F2F6F4]'
                              : 'text-[#6B7D74] hover:bg-[#F2F6F4]'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${b.pilihanAlmahyra ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(b)}
                          title={isActiveBook ? 'Nonaktifkan Buku' : 'Aktifkan Buku'}
                          aria-label={isActiveBook ? `Nonaktifkan ${b.judul}` : `Aktifkan ${b.judul}`}
                          className={`rounded-lg p-1.5 ${
                            isActiveBook ? 'text-emerald-700 hover:bg-emerald-50' : 'text-[#6B7D74] hover:bg-[#F2F6F4]'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditBook(b)}
                          aria-label={`Edit buku ${b.judul}`}
                          className="rounded-lg p-1.5 text-[#111C17] hover:bg-[#F2F6F4]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteBook(b)}
                          aria-label={`Hapus buku ${b.judul}`}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
