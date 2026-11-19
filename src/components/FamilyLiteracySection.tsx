import { BookOpen, Calendar, HeartHandshake, NotebookPen, Sparkles, Target, Users } from 'lucide-react';
import type { AlmahyraDatabase, Book } from '../types/almahyra';
import { SAHABAT_GALLERY_PHOTOS } from '../utils/almahyra';
import { ResilientImage } from './ResilientImage';
import { DEFAULT_HERO_IMAGE_URL } from '../data/defaultDb';

interface FamilyLiteracySectionProps {
  db: AlmahyraDatabase;
  onOpenLogin: () => void;
  onReadBook: (book: Book) => void;
}

export function FamilyLiteracySection({
  db,
  onOpenLogin,
  onReadBook,
}: FamilyLiteracySectionProps) {
  const familyRecommended = db.books.slice(0, 2);

  return (
    <section
      id="dunia-keluarga"
      aria-label="Dunia Keluarga Rumah Baca Almahyra"
      className="scroll-mt-20 rounded-3xl border border-[#DCE4DF] bg-white p-6 sm:p-8 space-y-7"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-wide text-[#08A9EF] flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            Pilar Literasi Keluarga · Orang Tua & Anak
          </p>
          <h2 className="font-display text-2xl font-bold text-[#111C17]">
            Dunia Keluarga Almahyra
          </h2>
          <p className="mt-1 text-sm text-[#4A5D54]">
            Kebiasaan membaca lahir dari kehangatan keluarga. Dampingi anak menulis jurnal bersama, ikuti tantangan mingguan keluarga, dan kenali sahabat cilik Teras Grontol.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLogin}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#087C3B] px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 whitespace-nowrap shrink-0"
        >
          <HeartHandshake className="h-4 w-4" aria-hidden="true" />
          Buka Dasbor Orang Tua
        </button>
      </div>

      {/* 3-Card Family Feature Highlights */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E7EEEA] bg-[#F8FAF9] p-5 space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6F7FE] text-[#08A9EF]">
            <NotebookPen className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-bold text-[#111C17]">
            Jurnal Baca Bersama Orang Tua
          </h3>
          <p className="text-xs leading-relaxed text-[#4A5D54]">
            {(db.readingJournals ?? [])[0]?.catatan ||
              'Catat 10 menit diskusi hangat setelah mendampingi anak membaca cerita sebelum tidur.'}
          </p>
          <p className="text-[11px] font-semibold text-[#087C3B] dark:text-[#6EE7B7]">
            {(db.readingJournals ?? []).length} catatan jurnal tersimpan
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7EEEA] bg-[#F8FAF9] p-5 space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8DF] text-[#B45309]">
            <Target className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-bold text-[#111C17]">
            {(db.challenges ?? [])[0]?.judul ?? 'Tantangan Keluarga Minggu Ini'}
          </h3>
          <p className="text-xs leading-relaxed text-[#4A5D54]">
            {(db.challenges ?? [])[0]?.deskripsi ??
              'Baca 2 cerita Nusantara bersama lalu ceritakan kembali pesan kebaikannya di rumah.'}
          </p>
          <p className="font-mono-tabular text-[11px] font-bold text-[#B45309]">
            Hadiah: {(db.challenges ?? [])[0]?.lencanaHadiah ?? 'Lencana Keluarga Literat'} (+
            {(db.challenges ?? [])[0]?.bonusPoin ?? 10} Poin)
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7EEEA] bg-[#F8FAF9] p-5 space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF8EE] text-[#087C3B]">
            <Calendar className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-bold text-[#111C17]">
            Rekomendasi Pendampingan Usia
          </h3>
          <p className="text-xs leading-relaxed text-[#4A5D54]">
            Pilih bacaan sesuai jenjang PAUD, TK, SD Awal, hingga SMP agar anak menikmati ritme belajar tanpa tekanan.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {familyRecommended.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onReadBook(b)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#DCE4DF] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#111C17] hover:bg-[#F2F6F4]"
              >
                <BookOpen className="h-3 w-3 text-[#087C3B]" aria-hidden="true" />
                {b.judul.split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Album Foto Nyata Sahabat Almahyra Dusun Grontol */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-[#111C17] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F58220]" aria-hidden="true" />
            Momen Hangat Sahabat Cilik Teras Almahyra
          </h3>
          <span className="text-xs text-[#4A5D54]">Dusun Grontol, Desa Tlogosari</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SAHABAT_GALLERY_PHOTOS.map((photo) => (
            <figure
              key={photo.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8E5] bg-[#F8FAF9]"
            >
              <div className="flex h-[320px] sm:h-[300px] lg:h-[360px] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#FFFDF6] to-[#EAF5EE] p-2">
                <ResilientImage
                  src={photo.src}
                  fallbackSrc={DEFAULT_HERO_IMAGE_URL}
                  alt={photo.name}
                  className="h-full w-full rounded-xl object-contain"
                />
              </div>
              <figcaption className="p-3.5 space-y-1">
                <p className="font-display text-sm font-bold text-[#111C17]">{photo.name}</p>
                <p className="text-xs text-[#4A5D54] leading-relaxed">{photo.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
