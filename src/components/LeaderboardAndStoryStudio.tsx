import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Copy,
  HelpCircle,
  Sparkles,
  Square,
  Trophy,
  Volume2,
} from 'lucide-react';
import type { AlmahyraDatabase } from '../types/almahyra';
import {
  computeTopReadersLeaderboard,
  generateBedtimeStoryAndPrompts,
  STORY_GENERATOR_CHARACTERS,
  STORY_GENERATOR_MORALS,
  STORY_GENERATOR_SETTINGS,
} from '../utils/almahyra';

interface LeaderboardAndStoryStudioProps {
  db: AlmahyraDatabase;
  onOpenLogin: () => void;
}

export function LeaderboardAndStoryStudio({
  db,
  onOpenLogin,
}: LeaderboardAndStoryStudioProps) {
  const leaderboard = useMemo(
    () => computeTopReadersLeaderboard(db.members, 5),
    [db.members],
  );

  const [characterId, setCharacterId] = useState<string>(STORY_GENERATOR_CHARACTERS[0].id);
  const [settingId, setSettingId] = useState<string>(STORY_GENERATOR_SETTINGS[0].id);
  const [moralId, setMoralId] = useState<string>(STORY_GENERATOR_MORALS[0].id);
  const [childName, setChildName] = useState<string>('');
  const [copiedStory, setCopiedStory] = useState(false);
  const [speakingStory, setSpeakingStory] = useState(false);

  const generatedStory = useMemo(
    () =>
      generateBedtimeStoryAndPrompts({
        characterId,
        settingId,
        moralId,
        childName,
      }),
    [characterId, settingId, moralId, childName],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeakStory = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingStory) {
      window.speechSynthesis.cancel();
      setSpeakingStory(false);
      return;
    }
    window.speechSynthesis.cancel();
    const text = `${generatedStory.title}. ${generatedStory.paragraphs.join(' ')}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'id-ID';
    utter.rate = 0.94;
    utter.onend = () => setSpeakingStory(false);
    utter.onerror = () => setSpeakingStory(false);
    setSpeakingStory(true);
    window.speechSynthesis.speak(utter);
  };

  const handleCopyStory = async () => {
    const formatted =
      `${generatedStory.title}\n\n` +
      `${generatedStory.paragraphs.join('\n\n')}\n\n` +
      `3 Pertanyaan Pemantik Diskusi:\n` +
      generatedStory.discussionQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formatted);
      }
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 2400);
    } catch {
      setCopiedStory(true);
      setTimeout(() => setCopiedStory(false), 2400);
    }
  };

  return (
    <section
      aria-label="Papan Peringkat Sahabat Baca dan Generator Dongeng"
      className="scroll-mt-20 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
    >
      {/* Left: Top 5 Sahabat Baca Bulan Ini Leaderboard (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-[#EEF3F0] pb-4">
          <div className="space-y-1">
            <p
              className="text-xs font-semibold flex items-center gap-1.5"
              style={{ color: 'var(--brand-accent-ink)' }}
            >
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              Papan Peringkat Literasi
            </p>
            <h2 className="font-display text-xl font-bold text-[#111C17]">
              Top 5 Sahabat Baca Bulan Ini
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap shrink-0"
          >
            Paspor Saya
          </button>
        </div>

        <ol className="space-y-2.5">
          {leaderboard.map((entry) => {
            const isTop = entry.rank === 1;
            return (
              <li
                key={entry.member.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${
                  isTop
                    ? 'border-[#BFD0C7] bg-[#F2F6F4]'
                    : 'border-[#EEF3F0] bg-[#F8FAF9]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono-tabular text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        entry.rank === 1
                          ? db.config.accentColor
                          : entry.rank <= 3
                            ? db.config.primaryColor
                            : '#4A5D54',
                    }}
                  >
                    0{entry.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-[#111C17] truncate">
                      {entry.member.nama}
                    </p>
                    <p className="text-[11px] text-[#4A5D54] truncate">
                      {entry.member.nomorInduk} · {entry.levelInfo.currentLevel}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="font-mono-tabular text-sm font-bold"
                    style={{ color: 'var(--brand-primary-ink)' }}
                  >
                    {entry.member.poin} pts
                  </p>
                  <p className="text-[11px] text-[#4A5D54] inline-flex items-center gap-1">
                    <Award className="h-3 w-3" aria-hidden="true" />
                    {entry.member.lencana.length} lencana
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="text-xs leading-relaxed text-[#4A5D54]">
          Setiap buku yang selesai dibaca, kuis pemahaman, dan jurnal cerita di Teras Almahyra menambah poin dan naik peringkat!
        </p>
      </div>

      {/* Right: Generator Dongeng & Pertanyaan Pemantik (7 cols) */}
      <div className="lg:col-span-7 rounded-2xl border border-[#E2E8E5] bg-white p-6 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-[#EEF3F0] pb-4">
          <div className="space-y-1">
            <p
              className="text-xs font-semibold flex items-center gap-1.5"
              style={{ color: 'var(--brand-primary-ink)' }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Alat Bantu Orang Tua & Kakak Relawan
            </p>
            <h2 className="font-display text-xl font-bold text-[#111C17]">
              Generator Dongeng & Pertanyaan Pemantik
            </h2>
          </div>
          <span className="text-xs text-[#4A5D54]">
            Cerita pengantar tidur + 3 pertanyaan diskusi
          </span>
        </div>

        {/* Selector Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="gen-character" className="block text-xs font-semibold text-[#111C17]">
              Pilih Tokoh Utama
            </label>
            <select
              id="gen-character"
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-medium text-[#111C17]"
            >
              {STORY_GENERATOR_CHARACTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gen-setting" className="block text-xs font-semibold text-[#111C17]">
              Pilih Latar Tempat
            </label>
            <select
              id="gen-setting"
              value={settingId}
              onChange={(e) => setSettingId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-medium text-[#111C17]"
            >
              {STORY_GENERATOR_SETTINGS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gen-moral" className="block text-xs font-semibold text-[#111C17]">
              Pilih Pesan Moral
            </label>
            <select
              id="gen-moral"
              value={moralId}
              onChange={(e) => setMoralId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs font-medium text-[#111C17]"
            >
              {STORY_GENERATOR_MORALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gen-child-name" className="block text-xs font-semibold text-[#111C17]">
              Nama Anak (Opsional)
            </label>
            <input
              id="gen-child-name"
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Mis. Nadia / Rafi..."
              className="mt-1 w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3 py-2 text-xs text-[#111C17] placeholder:text-[#8A9B92] focus:border-[#136B36] focus:outline-none"
            />
          </div>
        </div>

        {/* Story Output */}
        <div className="rounded-xl border border-[#E7EEEA] bg-[#F8FAF9] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8E5] pb-3">
            <div>
              <p className="text-[11px] font-semibold" style={{ color: 'var(--brand-primary-ink)' }}>
                Dongeng Siap Baca · Moral: {generatedStory.moralLabel}
              </p>
              <h3 className="font-display text-base font-bold text-[#111C17]">
                {generatedStory.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSpeakStory}
                aria-pressed={speakingStory}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
              >
                {speakingStory ? (
                  <>
                    <Square className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                    Hentikan Suara
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Bacakan Dongeng
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyStory}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE4DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111C17] hover:bg-[#F2F6F4] whitespace-nowrap"
              >
                {copiedStory ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Salin Teks
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 text-sm leading-relaxed text-[#111C17]">
            {generatedStory.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div className="border-t border-[#E2E8E5] pt-3 space-y-2">
            <p className="text-xs font-bold text-[#111C17] flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5" style={{ color: 'var(--brand-accent-ink)' }} />
              3 Pertanyaan Pemantik Diskusi Orang Tua & Anak
            </p>
            <ol className="space-y-1.5 text-xs text-[#4A5D54]">
              {generatedStory.discussionQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono-tabular font-bold text-[#111C17]">0{idx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-[#4A5D54]">
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Ubah tokoh, latar, atau pesan moral kapan saja untuk membuat cerita baru bersama anak.
        </p>
      </div>
    </section>
  );
}
