import { useMemo, useState, type FormEvent } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogIn,
  RotateCcw,
  Sparkles,
  Stamp,
  Star,
  Trophy,
  UserCheck,
  XCircle,
} from 'lucide-react';
import type { AlmahyraDatabase, Member } from '../types/almahyra';
import {
  calculateLevelInfo,
  evaluateMiniQuiz,
  MINI_QUIZ_TEBAK_CERITA,
  recordQuizAttemptInLocalPassport,
  type LocalDigitalPassportState,
} from '../utils/almahyra';
import { Card3DPassport } from './Card3DPassport';

interface PassportAndQuizHubProps {
  db: AlmahyraDatabase;
  passport: LocalDigitalPassportState;
  onUpdatePassport: (next: LocalDigitalPassportState) => void;
  onOpenCatalog: () => void;
  onOpenLogin: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function PassportAndQuizHub({
  db,
  passport,
  onUpdatePassport,
  onOpenCatalog,
  onOpenLogin,
}: PassportAndQuizHubProps) {
  const [nameInput, setNameInput] = useState(passport.childName);
  const [nameSavedNotice, setNameSavedNotice] = useState(false);

  // Interactive 5-question quiz state
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const levelInfo = useMemo(() => calculateLevelInfo(passport.points), [passport.points]);

  const previewMember: Member = useMemo(
    () => ({
      id: 'local-guest',
      nomorInduk: 'ALMA-PETUALANG',
      nama: passport.childName.trim() || 'Sahabat Cilik Almahyra',
      jenjangUsia: 'SD',
      orangTua: 'Keluarga Dusun Grontol',
      poin: passport.points,
      lencana: passport.badges,
      status: 'Aktif',
      bergabungSejak: new Date().toISOString().slice(0, 10),
      password: '',
    }),
    [passport],
  );

  const currentQuestion = MINI_QUIZ_TEBAK_CERITA[questionIdx] ?? MINI_QUIZ_TEBAK_CERITA[0];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === MINI_QUIZ_TEBAK_CERITA.length;

  const quizResult = useMemo(
    () => (submitted ? evaluateMiniQuiz(MINI_QUIZ_TEBAK_CERITA, answers) : null),
    [answers, submitted],
  );

  const handleSaveName = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    onUpdatePassport({
      ...passport,
      childName: cleaned,
    });
    setNameSavedNotice(true);
    setTimeout(() => setNameSavedNotice(false), 2600);
  };

  const handleSelectOption = (qIndex: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    if (!allAnswered || submitted) return;
    const evaluated = evaluateMiniQuiz(MINI_QUIZ_TEBAK_CERITA, answers);
    const updatedPassport = recordQuizAttemptInLocalPassport(
      passport,
      evaluated.scorePercent,
    );
    onUpdatePassport(updatedPassport);
    setSubmitted(true);
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setQuestionIdx(0);
    setSubmitted(false);
  };

  return (
    <section
      aria-label="Paspor Baca Digital dan Mini Kuis Literasi"
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <p
              className="text-xs font-semibold tracking-wide"
              style={{ color: 'var(--brand-accent-ink)' }}
            >
              Ruang Petualangan Cilik · Tersimpan Otomatis di Perangkat Ini
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111C17]">
              Paspor Baca Digital & Kuis Tebak Cerita
            </h1>
            <p className="text-sm leading-relaxed text-[#4A5D54]">
              Tulis namamu pada E-Paspor, kumpulkan stempel setiap kali menamatkan buku, dan taklukkan 5 soal Mini Kuis Tebak Cerita untuk meraih lencana prestasi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenCatalog}
              style={{ backgroundColor: db.config.primaryColor }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Cari Buku & Klaim Stempel
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-4 py-2.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Masuk Akun Anggota Resmi
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: PASPOR BACA DIGITAL (localStorage) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Child Name Setup + Live 3D Passport Card */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSaveName}
            className="rounded-2xl border border-[#E2E8E5] bg-white p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="passport-child-name"
                className="font-display text-sm font-bold text-[#111C17] flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" style={{ color: 'var(--brand-primary-ink)' }} aria-hidden="true" />
                Nama Pemilik Paspor Baca
              </label>
              {nameSavedNotice && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Nama tersimpan!
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="passport-child-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Masukkan nama panggilanmu..."
                className="flex-1 rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3.5 py-2.5 text-sm text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#047857] focus:outline-none"
              />
              <button
                type="submit"
                style={{ backgroundColor: db.config.primaryColor }}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
              >
                Simpan Nama
              </button>
            </div>
            <p className="text-xs text-[#4A5D54]">
              Progres stempel, poin, dan lencanamu disimpan otomatis di browser perangkat ini (<code className="font-mono-tabular">localStorage</code>).
            </p>
          </form>

          <Card3DPassport member={previewMember} config={db.config} />
        </div>

        {/* Right: Level Progress, Badges & Stamp Collection */}
        <div className="lg:col-span-7 space-y-5">
          {/* Level & Summary Strip */}
          <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#4A5D54]">Jenjang Petualang Saat Ini</p>
                <h2 className="font-display text-xl font-bold text-[#111C17] flex items-center gap-2">
                  <Trophy className="h-5 w-5" style={{ color: 'var(--brand-accent-ink)' }} aria-hidden="true" />
                  {levelInfo.currentLevel}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-right font-mono-tabular">
                <div>
                  <p className="text-[11px] text-[#4A5D54]">Poin Terkumpul</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--brand-primary-ink)' }}>
                    {passport.points} pts
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#4A5D54]">Stempel Buku</p>
                  <p className="text-lg font-bold text-[#111C17]">{passport.stamps.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#4A5D54]">Skor Kuis Terbaik</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--brand-accent-ink)' }}>
                    {passport.bestQuizScore}%
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EEF3F0]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${levelInfo.progressPercent}%`,
                    backgroundColor: '#EAB308',
                  }}
                />
              </div>
              <p className="text-xs text-[#4A5D54]">
                {levelInfo.nextLevel
                  ? `${levelInfo.pointsToNext} poin lagi menuju ${levelInfo.nextLevel} — ${levelInfo.rewardHint}`
                  : levelInfo.rewardHint}
              </p>
            </div>

            {/* Lencana Prestasi */}
            <div className="border-t border-[#EEF3F0] pt-4 space-y-2.5">
              <p className="text-xs font-semibold text-[#111C17] flex items-center gap-1.5">
                <Award className="h-4 w-4" style={{ color: 'var(--brand-accent-ink)' }} aria-hidden="true" />
                Lencana Prestasi Diperoleh ({passport.badges.length})
              </p>
              {passport.badges.length === 0 ? (
                <p className="text-xs text-[#4A5D54]">
                  Belum ada lencana terbuka. Baca 1 buku atau selesaikan kuis Tebak Cerita untuk membuka lencana pertamamu!
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {passport.badges.map((badge) => (
                    <div
                      key={badge}
                      className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2 text-xs font-semibold text-[#111C17]"
                    >
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-current shrink-0" aria-hidden="true" />
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Koleksi Stempel Buku */}
          <div className="rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[#111C17] flex items-center gap-2">
                <Stamp className="h-5 w-5" style={{ color: 'var(--brand-primary-ink)' }} aria-hidden="true" />
                Koleksi Stempel Baca ({passport.stamps.length})
              </h2>
              <span className="text-xs text-[#4A5D54]">+5 poin per buku selesai</span>
            </div>

            {passport.stamps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CBD6D0] bg-[#F8FAF9] p-6 text-center space-y-3">
                <p className="text-sm font-semibold text-[#111C17]">
                  Belum ada stempel di Paspor Baca Digitalmu
                </p>
                <p className="text-xs text-[#4A5D54] max-w-md mx-auto">
                  Klik "Baca Sekarang" pada salah satu buku di Rak Pilihan, lalu tekan tombol "Selesai Baca & Klaim Stempel" di layar pembaca!
                </p>
                <button
                  type="button"
                  onClick={onOpenCatalog}
                  style={{ backgroundColor: db.config.primaryColor }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Pilih Buku Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {passport.stamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[#E2E8E5] bg-[#F8FAF9] p-3.5"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                        {stamp.category}
                      </p>
                      <h3 className="font-display text-sm font-bold text-[#111C17] line-clamp-2">
                        {stamp.bookTitle}
                      </h3>
                      <p className="font-mono-tabular text-[11px] text-[#4A5D54]">
                        Diklaim {stamp.claimedAt}
                      </p>
                    </div>
                    <div
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white font-mono-tabular shadow-xs"
                      style={{ backgroundColor: '#D97706' }}
                    >
                      <span className="text-[10px] font-bold">STEMPEL</span>
                      <span className="text-[10px]">+{stamp.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: MINI KUIS TEBAK CERITA (5 SOAL INTERAKTIF) */}
      <div
        id="mini-kuis-literasi"
        className="rounded-2xl border border-[#E2E8E5] bg-white p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col gap-3 border-b border-[#EEF3F0] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--brand-accent-ink)' }}
            >
              Tantangan 5 Soal Interaktif
            </p>
            <h2 className="font-display text-2xl font-bold text-[#111C17] flex items-center gap-2">
              <HelpCircle className="h-6 w-6" style={{ color: 'var(--brand-primary-ink)' }} aria-hidden="true" />
              Mini Kuis Tebak Cerita Almahyra
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#4A5D54] font-mono-tabular">
            <span>Terjawab: {answeredCount}/{MINI_QUIZ_TEBAK_CERITA.length}</span>
            <span aria-hidden="true">·</span>
            <span>Skor terbaik: {passport.bestQuizScore}%</span>
          </div>
        </div>

        {!submitted ? (
          <div className="space-y-6">
            {/* Step Progress Dots/Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {MINI_QUIZ_TEBAK_CERITA.map((q, idx) => {
                  const isCurrent = idx === questionIdx;
                  const isDone = answers[idx] !== undefined;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuestionIdx(idx)}
                      aria-label={`Pilih soal ${idx + 1}`}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`h-9 min-w-10 rounded-lg px-3 font-mono-tabular text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'text-white shadow-xs'
                          : isDone
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border border-[#DCE4DF] bg-[#F8FAF9] text-[#4A5D54] hover:text-[#111C17]'
                      }`}
                      style={isCurrent ? { backgroundColor: db.config.primaryColor } : undefined}
                    >
                      Soal {idx + 1}
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-medium text-[#4A5D54]">
                Referensi: <strong className="text-[#111C17]">{currentQuestion.storyRef}</strong>
              </span>
            </div>

            {/* Active Question Card */}
            <div className="rounded-2xl border border-[#E7EEEA] bg-[#F8FAF9] p-5 sm:p-6 space-y-4">
              <p className="font-mono-tabular text-xs font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                Pertanyaan {questionIdx + 1} dari {MINI_QUIZ_TEBAK_CERITA.length}
              </p>
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#111C17] leading-snug">
                {currentQuestion.question}
              </h3>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const selected = answers[questionIdx] === optIdx;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(questionIdx, optIdx)}
                      aria-pressed={selected}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors ${
                        selected
                          ? 'border-transparent text-white shadow-xs'
                          : 'border-[#DCE4DF] bg-white text-[#111C17] hover:border-[#BFD0C7]'
                      }`}
                      style={selected ? { backgroundColor: db.config.primaryColor } : undefined}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono-tabular text-xs font-bold ${
                          selected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#EEF3F0] text-[#111C17]'
                        }`}
                      >
                        {OPTION_LETTERS[optIdx]}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={questionIdx === 0}
                onClick={() => setQuestionIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-xs font-semibold text-[#111C17] disabled:opacity-45 hover:bg-[#F2F6F4]"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Soal Sebelumnya
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                {questionIdx < MINI_QUIZ_TEBAK_CERITA.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionIdx((i) => Math.min(MINI_QUIZ_TEBAK_CERITA.length - 1, i + 1))
                    }
                    style={{ backgroundColor: db.config.primaryColor }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                  >
                    Soal Berikutnya
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={!allAnswered}
                  onClick={handleSubmitQuiz}
                  style={{
                    backgroundColor: allAnswered ? '#D97706' : undefined,
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold transition-colors ${
                    allAnswered
                      ? 'text-white hover:opacity-95 shadow-xs'
                      : 'border border-[#DCE4DF] bg-[#EEF3F0] text-[#6B7D74] cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {allAnswered
                    ? 'Selesai & Cek Skor Kuis!'
                    : `Jawab Semua Soal (${answeredCount}/${MINI_QUIZ_TEBAK_CERITA.length})`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CELEBRATION & QUIZ REVIEW RESULT */
          quizResult && (
            <div className="space-y-6">
              <div className="animate-celebrate-pop relative overflow-hidden rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/75 dark:bg-amber-950/30 p-6 sm:p-8 text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <Star className="animate-confetti-float h-6 w-6 text-amber-500 fill-current" aria-hidden="true" />
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: db.config.primaryColor }}
                  >
                    <Trophy className="h-7 w-7 text-amber-300" aria-hidden="true" />
                  </div>
                  <Star className="animate-confetti-float h-6 w-6 text-emerald-600 fill-current" aria-hidden="true" />
                </div>

                <h3 className="font-display text-2xl font-extrabold text-[#111C17]">
                  {quizResult.passed
                    ? `Hebat Sekali, ${passport.childName.trim() || 'Petualang Cilik'}!`
                    : `Bagus Usahamu, ${passport.childName.trim() || 'Petualang Cilik'}!`}
                </h3>
                <p className="font-mono-tabular text-3xl font-extrabold" style={{ color: 'var(--brand-primary-ink)' }}>
                  Skor {quizResult.scorePercent}/100 ({quizResult.correctCount} dari {quizResult.total} Benar)
                </p>
                <p className="mx-auto max-w-lg text-sm text-[#4A5D54]">
                  {quizResult.passed
                    ? 'Lencana Bintang Kuis Tebak Cerita tercatat di Paspor Baca Digitalmu beserta tambahan poin petualang.'
                    : 'Ayo baca ulang bukunya lalu coba lagi untuk mencapai nilai 60+ dan membuka lencana kuis!'}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    style={{ backgroundColor: db.config.primaryColor }}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white hover:opacity-95"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Main Kuis Lagi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {MINI_QUIZ_TEBAK_CERITA.map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 space-y-1.5 ${
                        idx === MINI_QUIZ_TEBAK_CERITA.length - 1 &&
                        MINI_QUIZ_TEBAK_CERITA.length % 2 === 1
                          ? 'md:col-span-2'
                          : ''
                      } ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-xs font-bold text-[#111C17]">
                          {idx + 1}. {q.storyRef}
                        </p>
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                        )}
                      </div>
                      <p className="text-xs text-[#111C17]">{q.question}</p>
                      <p className="text-xs font-medium text-[#4A5D54]">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}
