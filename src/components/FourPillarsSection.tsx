import { ArrowRight, BookOpen, Compass, PlayCircle, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface FourPillarsSectionProps {
  onExploreRead: () => void;
  onExploreVideos: () => void;
  onExploreAdventure: () => void;
  onExploreAchievement: () => void;
}

const PILLARS = [
  {
    id: 'baca',
    title: 'BACA',
    subtitle: 'Temukan buku menarik untuk menambah ilmu.',
    actionLabel: 'Buka Rak Buku',
    color: '#0369A1',
    darkTitle: '#7DD3FC',
    bgClass: 'bg-gradient-to-br from-[#EAF7FF] to-[#D6EEFE] dark:from-[#0C2B3B] dark:to-[#0F3547]',
    borderClass: 'border-[#9AD8FC] dark:border-[#1E5370]',
    iconBgClass: 'bg-white text-[#0284C7] dark:bg-[#153D52] dark:text-[#7DD3FC]',
    arrowBgClass: 'bg-[#0284C7] text-white',
    Icon: BookOpen,
  },
  {
    id: 'video',
    title: 'VIDEO EDUKASI',
    subtitle: 'Tonton 10 kanal edukasi pilihan di 6 zona belajar.',
    actionLabel: 'Buka Video Edukasi',
    color: '#C2410C',
    darkTitle: '#FDBA74',
    bgClass: 'bg-gradient-to-br from-[#FFF1E6] to-[#FFE1CC] dark:from-[#361D12] dark:to-[#432415]',
    borderClass: 'border-[#FDC89B] dark:border-[#6E3B21]',
    iconBgClass: 'bg-white text-[#DC2626] dark:bg-[#4A2717] dark:text-[#FCA5A5]',
    arrowBgClass: 'bg-[#DC2626] text-white',
    Icon: PlayCircle,
  },
  {
    id: 'bertualang',
    title: 'BERTUALANG',
    subtitle: 'Selesaikan misi seru dan jelajahi dunia baru.',
    actionLabel: 'Jelajahi 6 Zona',
    color: '#075A32',
    darkTitle: '#86EFAC',
    bgClass: 'bg-gradient-to-br from-[#ECFAE4] to-[#D6F5C7] dark:from-[#0E2E1D] dark:to-[#133A25]',
    borderClass: 'border-[#A6E299] dark:border-[#245C3B]',
    iconBgClass: 'bg-white text-[#087C3B] dark:bg-[#19472D] dark:text-[#86EFAC]',
    arrowBgClass: 'bg-[#087C3B] text-white',
    Icon: Compass,
  },
  {
    id: 'prestasi',
    title: 'RAIH PRESTASI',
    subtitle: 'Kumpulkan bintang dan raih lencana!',
    actionLabel: 'Lihat E-Paspor',
    color: '#92400E',
    darkTitle: '#FDE047',
    bgClass: 'bg-gradient-to-br from-[#FFF9DF] to-[#FFEFB5] dark:from-[#35280D] dark:to-[#423210]',
    borderClass: 'border-[#FDE07D] dark:border-[#6B511A]',
    iconBgClass: 'bg-white text-[#D97706] dark:bg-[#4C3812] dark:text-[#FDE047]',
    arrowBgClass: 'bg-[#D97706] text-white',
    Icon: Trophy,
  },
] as const;

export function FourPillarsSection({
  onExploreRead,
  onExploreVideos,
  onExploreAdventure,
  onExploreAchievement,
}: FourPillarsSectionProps) {
  const actionHandlers: Record<(typeof PILLARS)[number]['id'], () => void> = {
    baca: onExploreRead,
    video: onExploreVideos,
    bertualang: onExploreAdventure,
    prestasi: onExploreAchievement,
  };

  return (
    <section aria-label="Empat Pilar Almahyra App">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((pillar, index) => {
          const Icon = pillar.Icon;
          return (
            <motion.button
              key={pillar.id}
              type="button"
              onClick={actionHandlers[pillar.id]}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              whileHover={{ y: -3 }}
              aria-label={`${pillar.title} — ${pillar.actionLabel}`}
              className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-left shadow-xs transition-shadow hover:shadow-md ${pillar.bgClass} ${pillar.borderClass}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-xs ${pillar.iconBgClass}`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <h3
                    className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#10281B] dark:text-[#EEF7F2]"
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-xs leading-snug text-[#3E5B4C] dark:text-[#CBE0D5] line-clamp-2">
                    {pillar.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-xs transition-transform group-hover:translate-x-0.5 ${pillar.arrowBgClass}`}
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
