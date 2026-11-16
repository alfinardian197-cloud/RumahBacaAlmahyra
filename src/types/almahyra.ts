export type UserRole = 'superadmin' | 'admin' | 'anggota';

export interface AuthSession {
  role: UserRole;
  username: string;
  displayName: string;
  memberId?: string;
  nomorInduk?: string;
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

export interface AlmahyraDatabase {
  config: LandingConfig;
  members: Member[];
  books: Book[];
  loans: Loan[];
  passportLogs: PassportLog[];
  schedules: ActivitySchedule[];
  missions: MissionItem[];
  admins: AdminAccount[];
}
