import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  FlaskConical,
  Leaf,
  Palette,
  Recycle,
  Sparkles,
  Star,
} from 'lucide-react';
import type { Book } from '../types/almahyra';
import {
  getBookRealActionMission,
  REAL_ACTION_BADGE_NAME,
  type LocalRealActionRecord,
} from '../utils/almahyra';

interface RealActionMissionCardProps {
  book: Book;
  existingRecord?: LocalRealActionRecord;
  onClaimRealAction: (book: Book, note?: string) => { alreadyClaimed: boolean };
}

export function RealActionMissionCard({
  book,
  existingRecord,
  onClaimRealAction,
}: RealActionMissionCardProps) {
  const mission = useMemo(() => getBookRealActionMission(book), [book]);

  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [selectedCreativeIdx, setSelectedCreativeIdx] = useState<Record<number, boolean>>({});
  const [observationNote, setObservationNote] = useState(existingRecord?.note ?? '');
  const [validationError, setValidationError] = useState('');
  const [justCelebrated, setJustCelebrated] = useState(false);

  useEffect(() => {
    setCheckedSteps({});
    setSelectedCreativeIdx({});
    setObservationNote(existingRecord?.note ?? '');
    setValidationError('');
    setJustCelebrated(false);
  }, [book.id, existingRecord?.note]);

  const isCompleted = Boolean(existingRecord) || justCelebrated;

  const toggleChecklistStep = (idx: number) => {
    setValidationError('');
    setCheckedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleCreativeOption = (idx: number) => {
    setValidationError('');
    setSelectedCreativeIdx((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleSubmitMission = () => {
    if (isCompleted) return;

    if (mission.theme === 'kompos-lingkungan') {
      const stepsTotal = mission.checklistSteps?.length ?? 3;
      const doneCount = Object.values(checkedSteps).filter(Boolean).length;
      if (doneCount < stepsTotal) {
        setValidationError(
          `Yuk centang semua ${stepsTotal} langkah pemilahan sampah di atas dulu (${doneCount}/${stepsTotal} tercentang)!`,
        );
        return;
      }
      onClaimRealAction(book, 'Menyelesaikan 3 langkah pemilahan sampah organik & anorganik di rumah.');
      setJustCelebrated(true);
      return;
    }

    if (mission.theme === 'sains-dapur-kebun') {
      const cleanNote = observationNote.trim();
      if (cleanNote.length < 4) {
        setValidationError(
          'Tuliskan catatan pengamatan singkat dari eksperimenmu dulu ya (minimal 4 huruf)!',
        );
        return;
      }
      onClaimRealAction(book, cleanNote);
      setJustCelebrated(true);
      return;
    }

    // Tema Alam & Dongeng
    const cleanNote = observationNote.trim();
    const anyOptionChecked = Object.values(selectedCreativeIdx).some(Boolean);
    if (!anyOptionChecked && cleanNote.length < 3) {
      setValidationError(
        'Centang aksi pilihanmu atau tuliskan 2 tanaman / gambarmu di bawah ini ya!',
      );
      return;
    }
    const chosenSummary = (mission.creativeOptions ?? [])
      .filter((_, idx) => selectedCreativeIdx[idx])
      .join(' & ');
    const finalNote = cleanNote
      ? chosenSummary
        ? `${chosenSummary}: ${cleanNote}`
        : cleanNote
      : chosenSummary;
    onClaimRealAction(book, finalNote);
    setJustCelebrated(true);
  };

  const themeIcon =
    mission.theme === 'kompos-lingkungan' ? (
      <Recycle className="h-5 w-5" aria-hidden="true" />
    ) : mission.theme === 'sains-dapur-kebun' ? (
      <FlaskConical className="h-5 w-5" aria-hidden="true" />
    ) : (
      <Palette className="h-5 w-5" aria-hidden="true" />
    );

  const completedChecklistCount = (mission.checklistSteps ?? []).filter(
    (_, idx) => checkedSteps[idx],
  ).length;

  return (
    <section
      id="misi-petualang-nyata"
      aria-label="Misi Petualang Nyata: Tantangan Aksi Nyata di Rumah"
      className="rounded-3xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 sm:p-6 text-white shadow-md"
    >
      {/* Top Banner Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold text-amber-100">
            <Leaf className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            <span>Misi Petualang Nyata · {mission.themeLabel}</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Tantangan Aksi Nyata di Rumah!
          </h3>
          <p className="text-sm font-semibold text-emerald-50">{mission.missionTitle}</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-amber-300 px-3.5 py-2 text-[#111C17] shadow-xs shrink-0 self-start">
          <Star className="h-4 w-4 fill-current text-amber-700" aria-hidden="true" />
          <span className="font-mono-tabular text-xs font-extrabold whitespace-nowrap">
            +2 Bintang Ekstra · {REAL_ACTION_BADGE_NAME}
          </span>
        </div>
      </div>

      {/* Inner High-Contrast Action Card */}
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-[#FFFDF7] p-4 sm:p-5 text-[#111C17] dark:border-emerald-700/60 dark:bg-[#0D1E16] dark:text-[#EEF7F2] space-y-4">
        <div className="flex items-start gap-2.5 text-sm leading-relaxed text-[#2C4237] dark:text-[#CBE0D5]">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            {themeIcon}
          </span>
          <p>{mission.instruction}</p>
        </div>

        {isCompleted ? (
          /* CELEBRATION STATE AFTER COMPLETION */
          <div className="animate-celebrate-pop rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 text-center space-y-3 dark:border-amber-500/50 dark:bg-amber-950/35">
            <div className="flex items-center justify-center gap-3">
              <Star
                className="animate-confetti-float h-6 w-6 text-amber-500 fill-current"
                aria-hidden="true"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Award className="h-7 w-7 text-amber-300" aria-hidden="true" />
              </div>
              <Star
                className="animate-confetti-float h-6 w-6 text-emerald-500 fill-current"
                aria-hidden="true"
              />
            </div>

            <h4 className="font-display text-lg sm:text-xl font-extrabold text-[#111C17] dark:text-white">
              Hebat! Misi Petualang Nyata Berhasil Diselesaikan!
            </h4>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              +2 Bintang Ekstra telah ditambahkan ke Paspor Baca Digital dan Lencana Khusus{' '}
              <span className="underline decoration-amber-400 decoration-2">
                {REAL_ACTION_BADGE_NAME}
              </span>{' '}
              resmi terbuka!
            </p>
            {(existingRecord?.note || observationNote.trim()) && (
              <p className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-white px-3.5 py-2 text-xs text-[#2C4237] dark:border-emerald-700 dark:bg-[#12261C] dark:text-[#D5EAE0]">
                Catatan Aksi: &ldquo;{existingRecord?.note || observationNote.trim()}&rdquo;
              </p>
            )}
          </div>
        ) : (
          /* INTERACTIVE THEME-SPECIFIC MISSION CONTROLS */
          <div className="space-y-4">
            {mission.theme === 'kompos-lingkungan' && mission.checklistSteps && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Daftar Periksa (Checklist) Pemilahan Sampah</span>
                  <span className="font-mono-tabular">
                    {completedChecklistCount}/{mission.checklistSteps.length} langkah selesai
                  </span>
                </div>
                <div className="space-y-2">
                  {mission.checklistSteps.map((step, idx) => {
                    const checked = Boolean(checkedSteps[idx]);
                    return (
                      <label
                        key={step}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                          checked
                            ? 'border-emerald-400 bg-emerald-50 text-[#111C17] dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-white'
                            : 'border-[#DCE4DF] bg-white hover:border-emerald-300 dark:border-[#243B30] dark:bg-[#13251C]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleChecklistStep(idx)}
                          className="mt-0.5 h-4 w-4 rounded accent-emerald-600 shrink-0"
                        />
                        <span className={checked ? 'font-semibold' : ''}>{step}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {mission.theme === 'sains-dapur-kebun' && (
              <div className="space-y-2">
                <label
                  htmlFor={`real-action-note-${book.id}`}
                  className="block text-xs font-bold text-emerald-800 dark:text-emerald-300"
                >
                  {mission.observationPrompt}
                </label>
                <textarea
                  id={`real-action-note-${book.id}`}
                  rows={3}
                  value={observationNote}
                  onChange={(e) => {
                    setValidationError('');
                    setObservationNote(e.target.value);
                  }}
                  placeholder={mission.observationPlaceholder}
                  className="w-full rounded-xl border border-[#DCE4DF] bg-white px-3.5 py-2.5 text-sm text-[#111C17] placeholder:text-[#7E9287] focus:border-emerald-600 focus:outline-none dark:border-[#243B30] dark:bg-[#13251C] dark:text-white"
                />
              </div>
            )}

            {mission.theme === 'alam-dongeng' && (
              <div className="space-y-3">
                {mission.creativeOptions && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {mission.creativeOptions.map((opt, idx) => {
                      const checked = Boolean(selectedCreativeIdx[idx]);
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-xs sm:text-sm transition-colors ${
                            checked
                              ? 'border-emerald-400 bg-emerald-50 font-semibold text-[#111C17] dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-white'
                              : 'border-[#DCE4DF] bg-white hover:border-emerald-300 dark:border-[#243B30] dark:bg-[#13251C]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCreativeOption(idx)}
                            className="mt-0.5 h-4 w-4 rounded accent-emerald-600 shrink-0"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor={`real-action-note-${book.id}`}
                    className="block text-xs font-bold text-emerald-800 dark:text-emerald-300"
                  >
                    {mission.observationPrompt}
                  </label>
                  <textarea
                    id={`real-action-note-${book.id}`}
                    rows={2}
                    value={observationNote}
                    onChange={(e) => {
                      setValidationError('');
                      setObservationNote(e.target.value);
                    }}
                    placeholder={mission.observationPlaceholder}
                    className="w-full rounded-xl border border-[#DCE4DF] bg-white px-3.5 py-2.5 text-sm text-[#111C17] placeholder:text-[#7E9287] focus:border-emerald-600 focus:outline-none dark:border-[#243B30] dark:bg-[#13251C] dark:text-white"
                  />
                </div>
              </div>
            )}

            {validationError && (
              <p
                role="alert"
                className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200"
              >
                {validationError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-[#4A5D54] dark:text-[#A5C0B4] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                Hadiah: +2 Bintang Ekstra &amp; Lencana &ldquo;{REAL_ACTION_BADGE_NAME}&rdquo;
              </p>
              <button
                type="button"
                onClick={handleSubmitMission}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#111C17] shadow-sm transition-colors hover:bg-amber-300 whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 text-amber-900 shrink-0" aria-hidden="true" />
                Saya Sudah Melakukan Misi Ini!
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
