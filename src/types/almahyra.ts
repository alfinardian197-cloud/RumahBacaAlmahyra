export type UserRole = 'superadmin' | 'admin' | 'anggota';
export type ThemeMode = 'light' | 'dark';

export interface AuthSession {
  role: UserRole;
  username: string;
  displayName: string;
  memberId?: string;
  nomorInduk?: string;
  token?: string;
}

export interface LandingConfig {
  appName: string;
  tagline: string;
  slogan: string;
  location: string;
  coordinator: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroImageUrl: string;
  announcementText: string;
  showAnnouncement: boolean;
  page1IntroTitle: string;
  page1IntroBody: string;
  showTelagaSection: boolean;
  showZonesSection: boolean;
  showLevelsSection: boolean;
  page2Title: string;
  page2Subtitle: string;
  showCatalogSection: boolean;
  showScheduleSection: boolean;
  showInnovationsSection: boolean;
  spreadsheetId: string;
  spreadsheetTitle: string;
  lastSyncedAt: string;
  autoSyncEnabled: boolean;
}

export interface Member {
  id: string;
  nomorInduk: string;
  nama: string;
  jenjangUsia: 'PAUD' | 'SD' | 'SMP' | 'Umum';
  orangTua: string;
  poin: number;
  lencana: string[];
  status: 'Aktif' | 'Nonaktif';
  bergabungSejak: string;
  password: string;
  targetMingguan?: number;
}

export interface BookPage {
  judulBab: string;
  isi: string;
  pesanMoral?: string;
}

export interface BookQuizQuestion {
  pertanyaan: string;
  pilihan: string[];
  jawabanBenar: number;
  penjelasan: string;
}

export interface Book {
  id: string;
  kodeBuku: string;
  judul: string;
  penulis: string;
  kategori: string;
  zona: string;
  status: 'Tersedia' | 'Dipinjam';
  stok: number;
  lokasiRak: string;
  deskripsi: string;
  coverUrl?: string;
  jenjangPembaca?: string;
  estimasiMenit?: number;
  aktif?: boolean;
  pilihanAlmahyra?: boolean;
  dibacaCount?: number;
  tanggalTerbit?: string;
  pdfUrl?: string;
  pdfNamaFile?: string;
  lisensi?: string;
  subtema?: string;
  sasaranUsia?: string;
  format?: string;
  bahasa?: string;
  sumberResmiUrl?: string;
  caraIntegrasi?: string;
  statusKurasi?: string;
  catatanKurasi?: string;
  sumberKatalog?: string;
  isiBacaan?: BookPage[];
  kuis?: BookQuizQuestion[];
}

export interface Loan {
  id: string;
  nomorInduk: string;
  namaAnggota: string;
  kodeBuku: string;
  judulBuku: string;
  tanggalPinjam: string;
  batasKembali: string;
  tanggalKembali?: string;
  status: 'Dipinjam' | 'Dikembalikan' | 'Terlambat';
}

export interface PassportLog {
  id: string;
  nomorInduk: string;
  namaAnggota: string;
  misi: string;
  zona: string;
  poin: number;
  pendamping: string;
  catatan: string;
  tanggal: string;
  stempel: boolean;
  judulBuku?: string;
  kategoriBuku?: string;
}

export interface ReadingProgress {
  id: string;
  viewerKey: string; // nomorInduk anggota atau 'guest'
  bookId: string;
  lastPage: number;
  totalPages: number;
  isFavorite: boolean;
  completedCount: number;
  lastReadAt: string;
  quizScore?: number;
}

export interface ReadingJournalEntry {
  id: string;
  nomorInduk: string;
  namaAnggota: string;
  bookId: string;
  judulBuku: string;
  kategoriBuku: string;
  tanggal: string;
  catatan: string;
  peringkatBintang: number;
  poinDiperoleh: number;
}

export interface ReadingChallenge {
  id: string;
  judul: string;
  deskripsi: string;
  targetBuku: number;
  bonusPoin: number;
  periode: string;
  lencanaHadiah: string;
}

export interface ActivitySchedule {
  id: string;
  hari: string;
  waktu: string;
  program: string;
  aktivitas: string;
  zona: string;
  kuota: number;
  pesertaTerdaftar: number;
}

export interface MissionItem {
  id: string;
  judul: string;
  zona: string;
  tugas: string;
  verifikasi: string;
  poin: number;
}

export interface AdminAccount {
  id: string;
  username: string;
  password: string;
  role: 'superadmin' | 'admin';
  nama: string;
  jabatan: string;
}

export type CreationCategory =
  | 'Cerita pendek'
  | 'Puisi'
  | 'Gambar'
  | 'Komik'
  | 'Resensi buku'
  | 'Kerajinan';

export interface CreationWork {
  id: string;
  judul: string;
  kategori: CreationCategory;
  namaSamaran: string;
  jenjangUsia: string;
  memberNomorInduk?: string;
  ringkasan: string;
  konten: string;
  imageUrl?: string;
  createdAt: string;
  parentApproved: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  catatanModerator?: string;
}

export interface TestimonialItem {
  id: string;
  nama: string;
  peran: string;
  komunitas: string;
  kutipan: string;
  rating: number;
}

export interface AlmahyraDatabase {
  config: LandingConfig;
  members: Member[];
  books: Book[];
  loans: Loan[];
  passportLogs: PassportLog[];
  schedules: ActivitySchedule[];
  missions: MissionItem[];
  admins: AdminAccount[];
  categories?: string[];
  readerLevels?: string[];
  readingProgress?: ReadingProgress[];
  readingJournals?: ReadingJournalEntry[];
  challenges?: ReadingChallenge[];
  creations?: CreationWork[];
  testimonials?: TestimonialItem[];
}
