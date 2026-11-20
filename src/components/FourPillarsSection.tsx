import { ArrowRight, BookOpen, Compass, PlayCircle, Trophy } from 'lucide-react';

interface FourPillarsSectionProps {
  onExploreRead: () => void;
  onExploreVideos: () => void;
  onExploreAdventure: () => void;
  onExploreAchievement: () => void;
}

export function FourPillarsSection({
  onExploreRead,
  onExploreVideos,
  onExploreAdventure,
  onExploreAchievement,
}: FourPillarsSectionProps) {
  const pillars = [
    {
      title: 'BACA',
      desc: 'Temukan buku menarik untuk menambah ilmu.',
      icon: BookOpen,
      cardBg: 'from-[#D8F2FF] to-[#BCE7FF] border-[#9AD8FF]',
      iconBg: 'bg-[#08A9EF] text-white',
      arrowBg: 'bg-[#08A9EF] text-white',
      onClick: onExploreRead,
    },
    {
      title: 'VIDEO EDUKASI',
      desc: 'Tonton 10 kanal pilihan sesuai 6 zona belajar.',
      icon: PlayCircle,
      cardBg: 'from-[#FFE4D6] to-[#FFD2BC] border-[#FFBFA0]',
      iconBg: 'bg-[#F58220] text-white',
      arrowBg: 'bg-[#F58220] text-white',
      onClick: onExploreVideos,
    },
    {
      title: 'BERTUALANG',
      desc: 'Selesaikan misi seru dan jelajahi dunia baru.',
      icon: Compass,
      cardBg: 'from-[#DCF8C6] to-[#C3F0A3] border-[#A3E27D]',
      iconBg: 'bg-[#087C3B] text-white',
      arrowBg: 'bg-[#087C3B] text-white',
      onClick: onExploreAdventure,
    },
    {
      title: 'RAIH PRESTASI',
      desc: 'Kumpulkan bintang dan raih lencana!',
      icon: Trophy,
      cardBg: 'from-[#FFF1C2] to-[#FFE394] border-[#FFD363]',
      iconBg: 'bg-[#E59E00] text-white',
      arrowBg: 'bg-[#E59E00] text-white',
      onClick: onExploreAchievement,
    },
  ];

  return (
    <section aria-label="Empat pilar kegiatan Almahyra">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <button
              key={pillar.title}
              type="button"
              onClick={pillar.onClick}
              className={`group flex items-center gap-3.5 rounded-3xl border-2 bg-gradient-to-br p-4 text-left shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md ${pillar.cardBg} dark:border-[#244536] dark:from-[#12261E] dark:to-[#163026]`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${pillar.iconBg}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-extrabold tracking-tight text-[#10281B] dark:text-white">
                  {pillar.title}
                </h2>
                <p className="mt-0.5 text-xs font-semibold leading-snug text-[#2F483C] dark:text-[#B5CFC2]">
                  {pillar.desc}
                </p>
              </div>

              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs transition-transform group-hover:translate-x-0.5 ${pillar.arrowBg}`}
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
