import type {
  AlmahyraDatabase,
  AuthSession,
  Book,
  Loan,
  Member,
  PassportLog,
} from '../types/almahyra';

export interface LevelInfo {
  currentLevel: string;
  nextLevel: string | null;
  minPoints: number;
  nextTarget: number;
  pointsToNext: number;
  progressPercent: number;
  rewardHint: string;
}

export const LEVEL_TIERS = [
  {
    name: 'Penjelajah Pemula',
    min: 0,
    target: 5,
    reward: 'Stiker atau alat tulis sederhana',
  },
  {
    name: 'Petualang Cerita',
    min: 5,
    target: 15,
    reward: 'Buku tulis kecil atau bibit tanaman',
  },
  {
    name: 'Penjelajah Pengetahuan',
    min: 15,
    target: 30,
    reward: 'Sertifikat dan hadiah edukatif',
  },
  {
    name: 'Duta Literasi Almahyra',
    min: 30,
    target: 50,
    reward: 'Pin/sertifikat dan kesempatan membantu kegiatan',
  },
] as const;

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  const idMatch = trimmed.match(/^[a-zA-Z0-9-_]{15,100}$/);
  return idMatch ? idMatch[0] : '';
}

export function calculateLevelInfo(points: number): LevelInfo {
  const safePoints = Math.max(0, Math.floor(points));

  if (safePoints >= 50) {
    return {
      currentLevel: 'Duta Literasi Almahyra',
      nextLevel: null,
      minPoints: 50,
      nextTarget: 50,
      pointsToNext: 0,
      progressPercent: 100,
      rewardHint: 'Pin/sertifikat dan kesempatan membantu kegiatan',
    };
  }

  if (safePoints >= 30) {
    return {
      currentLevel: 'Penjelajah Pengetahuan',
      nextLevel: 'Duta Literasi Almahyra',
      minPoints: 30,
      nextTarget: 50,
      pointsToNext: 50 - safePoints,
      progressPercent: Math.round(((safePoints - 30) / (50 - 30)) * 100),
      rewardHint: 'Sertifikat dan hadiah edukatif',
    };
  }

  if (safePoints >= 15) {
    return {
      currentLevel: 'Petualang Cerita',
      nextLevel: 'Penjelajah Pengetahuan',
      minPoints: 15,
      nextTarget: 30,
      pointsToNext: 30 - safePoints,
      progressPercent: Math.round(((safePoints - 15) / (30 - 15)) * 100),
      rewardHint: 'Buku tulis kecil atau bibit tanaman',
    };
  }

  if (safePoints >= 5) {
    return {
      currentLevel: 'Penjelajah Pemula',
      nextLevel: 'Petualang Cerita',
      minPoints: 5,
      nextTarget: 15,
      pointsToNext: 15 - safePoints,
      progressPercent: Math.round(((safePoints - 5) / (15 - 5)) * 100),
      rewardHint: 'Stiker atau alat tulis sederhana',
    };
  }

  return {
    currentLevel: 'Penjelajah Pemula',
    nextLevel: 'Petualang Cerita',
    minPoints: 0,
    nextTarget: 5,
    pointsToNext: 5 - safePoints,
    progressPercent: Math.round((safePoints / 5) * 100),
    rewardHint: 'Capai 5 poin untuk stiker atau alat tulis pertama',
  };
}

export function authenticateUser(
  rawUsername: string,
  rawPassword: string,
  db: Pick<AlmahyraDatabase, 'admins' | 'members'>,
): AuthSession | null {
  const username = rawUsername.trim();
  const password = rawPassword.trim();
  if (!username || !password) return null;

  const lowerUser = username.toLowerCase();

  // Check fixed requested credentials first + custom admin list
  if (lowerUser === 'admin' && password === 'admin@123') {
    const superAdmin = db.admins.find((a) => a.role === 'superadmin');
    return {
      role: 'superadmin',
      username: 'admin',
      displayName: superAdmin?.nama ?? 'Superadmin Almahyra',
    };
  }

  if (lowerUser === 'admin' && password === 'admin123') {
    const regularAdmin = db.admins.find((a) => a.role === 'admin');
    return {
      role: 'admin',
      username: 'admin',
      displayName: regularAdmin?.nama ?? 'Admin Perpustakaan',
    };
  }

  const matchedAdmin = db.admins.find(
    (a) => a.username.toLowerCase() === lowerUser && a.password === password,
  );
  if (matchedAdmin) {
    return {
      role: matchedAdmin.role,
      username: matchedAdmin.username,
      displayName: matchedAdmin.nama,
    };
  }

  // Member login via Nomor Induk Anggota + password (default '123')
  const matchedMember = db.members.find(
    (m) => m.nomorInduk.toLowerCase() === lowerUser && m.password === password,
  );
  if (matchedMember) {
    return {
      role: 'anggota',
      username: matchedMember.nomorInduk,
      displayName: matchedMember.nama,
      memberId: matchedMember.id,
      nomorInduk: matchedMember.nomorInduk,
    };
  }

  return null;
}

export function computeLibraryStats(
  db: Pick<AlmahyraDatabase, 'members' | 'books' | 'loans' | 'passportLogs'>,
) {
  const activeMembers = db.members.filter((m) => m.status === 'Aktif').length;
  const totalBooks = db.books.reduce((sum, b) => sum + Math.max(0, b.stok), 0);
  const availableTitles = db.books.filter((b) => b.status === 'Tersedia').length;
  const activeLoans = db.loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat').length;
  const verifiedMissions = db.passportLogs.filter((p) => p.stempel).length;
  const totalPointsAwarded = db.passportLogs.reduce((sum, p) => sum + p.poin, 0);

  return {
    activeMembers,
    totalMembers: db.members.length,
    totalTitles: db.books.length,
    totalBooks,
    availableTitles,
    activeLoans,
    verifiedMissions,
    totalPointsAwarded,
  };
}

export function recordsToSheetRows<T extends object>(
  columns: { key: keyof T; header: string }[],
  records: T[],
): string[][] {
  const headerRow = columns.map((c) => c.header);
  const dataRows = records.map((rec) =>
    columns.map((c) => {
      const val = rec[c.key];
      if (Array.isArray(val)) return val.join(', ');
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (val === undefined || val === null) return '';
      return String(val);
    }),
  );
  return [headerRow, ...dataRows];
}

export function sheetRowsToRecords(rows: string[][]): Record<string, string>[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h).trim());
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        if (header) {
          obj[header] = String(row[idx] ?? '').trim();
        }
      });
      return obj;
    });
}

export function filterBooks(
  books: Book[],
  query: string,
  category: string,
): Book[] {
  const q = query.trim().toLowerCase();
  return books.filter((b) => {
    const matchCategory = category === 'Semua' || b.kategori === category;
    if (!matchCategory) return false;
    if (!q) return true;
    return (
      b.judul.toLowerCase().includes(q) ||
      b.penulis.toLowerCase().includes(q) ||
      b.kodeBuku.toLowerCase().includes(q) ||
      b.zona.toLowerCase().includes(q)
    );
  });
}

export function getMemberLoans(loans: Loan[], nomorInduk: string): Loan[] {
  return loans.filter((l) => l.nomorInduk.toLowerCase() === nomorInduk.toLowerCase());
}

export function getMemberPassportLogs(
  logs: PassportLog[],
  nomorInduk: string,
): PassportLog[] {
  return logs.filter((l) => l.nomorInduk.toLowerCase() === nomorInduk.toLowerCase());
}

export function generateDeterministicQrMatrix(seedText: string, size = 19): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  // Place 3 finder patterns (7x7 corners) like a real QR code
  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rowOffset + r][colOffset + c] = isBorder || isCore;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (Math.abs(hash) % 10) < 5;
    }
  }

  return matrix;
}

export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(color.trim());
}

export function exportRecordsToCsv<T extends object>(
  columns: { key: keyof T; header: string }[],
  records: T[],
): string {
  const rows = recordsToSheetRows(columns, records);
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(','),
    )
    .join('\n');
}
