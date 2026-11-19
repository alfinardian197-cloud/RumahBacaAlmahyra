import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  ExternalLink,
  Filter,
  Play,
  PlayCircle,
  RotateCcw,
  Search,
  Sparkles,
  Tv,
} from 'lucide-react';
import {
  EDUCATIONAL_CHANNELS,
  EDUCATIONAL_VIDEOS,
  filterEducationalVideos,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  groupEducationalVideosByChannel,
  groupEducationalVideosByZone,
  type EducationalVideo,
} from '../data/educationalVideos';
import { ADVENTURE_WORLD_ZONES } from '../utils/almahyra';
import { ResilientImage } from './ResilientImage';

interface EducationalVideosSectionProps {
  initialZoneId?: string;
  initialVideoId?: string;
  compact?: boolean;
}

export function EducationalVideosSection({
  initialZoneId = 'all',
  initialVideoId,
  compact = false,
}: EducationalVideosSectionProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideoId, setActiveVideoId] = useState<string>(
    initialVideoId ?? EDUCATIONAL_VIDEOS[0].id,
  );
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialZoneId) {
      setSelectedZoneId(initialZoneId);
    }
  }, [initialZoneId]);

  useEffect(() => {
    if (initialVideoId) {
      setActiveVideoId(initialVideoId);
    }
  }, [initialVideoId]);

  const channelScopedVideos = useMemo(
    () => filterEducationalVideos(EDUCATIONAL_VIDEOS, 'all', '', selectedChannelId),
    [selectedChannelId],
  );

  const zoneGroups = useMemo(
    () => groupEducationalVideosByZone(channelScopedVideos),
    [channelScopedVideos],
  );

  const channelGroups = useMemo(
    () => groupEducationalVideosByChannel(EDUCATIONAL_VIDEOS),
    [],
  );

  const filteredVideos = useMemo(
    () =>
      filterEducationalVideos(
        EDUCATIONAL_VIDEOS,
        selectedZoneId,
        searchQuery,
        selectedChannelId,
      ),
    [selectedZoneId, searchQuery, selectedChannelId],
  );

  const activeVideo: EducationalVideo = useMemo(() => {
    const exact = filteredVideos.find((v) => v.id === activeVideoId);
    if (exact) return exact;
    return filteredVideos[0] ?? EDUCATIONAL_VIDEOS[0];
  }, [activeVideoId, filteredVideos]);

  const activeZoneDef = useMemo(
    () =>
      ADVENTURE_WORLD_ZONES.find((z) => z.id === activeVideo.zoneId) ??
      ADVENTURE_WORLD_ZONES[0],
    [activeVideo.zoneId],
  );

  const activeChannelMeta = useMemo(
    () =>
      EDUCATIONAL_CHANNELS.find((c) => c.id === selectedChannelId) ??
      EDUCATIONAL_CHANNELS.find((c) => c.id === activeVideo.channelId) ??
      EDUCATIONAL_CHANNELS[0],
    [selectedChannelId, activeVideo.channelId],
  );

  const selectedZoneMeta = useMemo(
    () => ADVENTURE_WORLD_ZONES.find((z) => z.id === selectedZoneId) ?? null,
    [selectedZoneId],
  );

  const handleSelectVideo = (video: EducationalVideo) => {
    setActiveVideoId(video.id);
    playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handlePlayNext = () => {
    const pool = filteredVideos.length > 0 ? filteredVideos : EDUCATIONAL_VIDEOS;
    const currentIdx = pool.findIndex((v) => v.id === activeVideo.id);
    const nextVideo = pool[(currentIdx + 1) % pool.length];
    if (nextVideo) {
      setActiveVideoId(nextVideo.id);
    }
  };

  const handleSelectChannelFromDirectory = (channelId: string) => {
    setSelectedChannelId(channelId);
    setSelectedZoneId('all');
    setSearchQuery('');
    playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleResetFilters = () => {
    setSelectedZoneId('all');
    setSelectedChannelId('all');
    setSearchQuery('');
  };

  return (
    <section
      id="video-edukasi"
      aria-label="Video Edukasi Multi-Kanal 6 Zona Almahyra"
      className="scroll-mt-20 space-y-6"
    >
      {/* Header, Search & Multi-Channel Filter Controls */}
      <div className="rounded-3xl border border-[#DCE4DF] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
              <Tv className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Kurasi {EDUCATIONAL_CHANNELS.length} Kanal YouTube Edukasi Indonesia</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {EDUCATIONAL_VIDEOS.length} Video · {ADVENTURE_WORLD_ZONES.length} Zona
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111C17]">
              Video Edukasi Interaktif 6 Zona Almahyra
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5D54] max-w-2xl">
              Pilihan video dari <strong className="text-[#111C17]">Kok Bisa?</strong>,{' '}
              <strong className="text-[#111C17]">Hujan Tanda Tanya</strong>,{' '}
              <strong className="text-[#111C17]">Neuron</strong>,{' '}
              <strong className="text-[#111C17]">Sepulang Sekolah</strong>,{' '}
              <strong className="text-[#111C17]">Kejarcita</strong>,{' '}
              <strong className="text-[#111C17]">Ruangguru</strong>,{' '}
              <strong className="text-[#111C17]">Marbel</strong>,{' '}
              <strong className="text-[#111C17]">Nussa Official</strong>,{' '}
              <strong className="text-[#111C17]">Riri</strong>, dan{' '}
              <strong className="text-[#111C17]">SISI TERANG</strong> — terklasifikasi rapi ke 6 zona belajar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <div className="relative w-full sm:w-56">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7D74]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik, judul, atau kanal..."
                aria-label="Cari video edukasi"
                className="w-full rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] py-2 pl-9 pr-3 text-xs sm:text-sm text-[#111C17] placeholder:text-[#6B7D74] focus:border-[#087C3B] focus:outline-none"
              />
            </div>

            <div className="relative w-full sm:w-52">
              <Filter
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#087C3B] dark:text-[#6EE7B7]"
                aria-hidden="true"
              />
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                aria-label="Filter kanal YouTube edukasi"
                className="w-full min-h-[38px] rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] py-2 pl-8 pr-3 text-xs font-bold text-[#111C17] focus:border-[#087C3B] focus:outline-none"
              >
                <option value="all">
                  Semua Kanal ({EDUCATIONAL_CHANNELS.length} Kanal)
                </option>
                {channelGroups.map(({ channel, count }) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.shortName} ({count}) · {channel.level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 6-Zone Classification Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter 6 Zona Video Edukasi"
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedZoneId === 'all'}
            onClick={() => setSelectedZoneId('all')}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              selectedZoneId === 'all'
                ? 'border-[#087C3B] bg-[#087C3B] text-white shadow-xs'
                : 'border-[#DCE4DF] bg-[#F8FAF9] text-[#3E5B4C] hover:bg-[#FFF2D6] hover:text-[#10281B] dark:text-[#A5C0B4]'
            }`}
          >
            <span>Semua Zona</span>
            <span className="font-mono-tabular opacity-85">({channelScopedVideos.length})</span>
          </button>

          {zoneGroups.map(({ zone, count }) => {
            const isSelected = selectedZoneId === zone.id;
            const isYellowZone = zone.id === 'zona-panggung-cerita';
            return (
              <button
                key={zone.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedZoneId(zone.id)}
                style={
                  isSelected
                    ? {
                        backgroundColor: zone.color,
                        borderColor: zone.color,
                        color: isYellowZone ? '#10281B' : '#FFFFFF',
                      }
                    : undefined
                }
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'shadow-xs'
                    : 'border-[#DCE4DF] bg-[#F8FAF9] text-[#3E5B4C] hover:border-[#BFD0C7] hover:text-[#10281B] dark:text-[#A5C0B4]'
                }`}
              >
                <span>{zone.name}</span>
                <span className="font-mono-tabular opacity-85">({count})</span>
              </button>
            );
          })}
        </div>

        {(selectedZoneMeta || selectedChannelId !== 'all') && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-[#EEF3F0] pt-3 text-xs text-[#4A5D54]">
            <p>
              {selectedZoneMeta ? (
                <>
                  <strong className="text-[#111C17]">{selectedZoneMeta.name}</strong> —{' '}
                  {selectedZoneMeta.tagline}. {selectedZoneMeta.description}
                </>
              ) : (
                <>
                  <strong className="text-[#111C17]">{activeChannelMeta.name}</strong> —{' '}
                  {activeChannelMeta.topic} ({activeChannelMeta.level}).
                </>
              )}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {selectedZoneMeta && (
                <span className="font-mono-tabular font-semibold text-[#087C3B] dark:text-[#6EE7B7] whitespace-nowrap">
                  Lencana: {selectedZoneMeta.rewardBadge}
                </span>
              )}
              {selectedChannelId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedChannelId('all')}
                  className="font-bold text-[#DC2626] hover:underline whitespace-nowrap"
                >
                  Tampilkan Semua Kanal
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spotlight Embedded YouTube Player */}
      <div
        ref={playerSectionRef}
        className="overflow-hidden rounded-3xl border border-[#DCE4DF] bg-white shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 xl:col-span-8 bg-[#0B1410]">
            <div className="aspect-video w-full">
              <iframe
                key={activeVideo.youtubeId}
                src={getYouTubeEmbedUrl(activeVideo.youtubeId)}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-4 p-5 sm:p-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5D54]">
                <span
                  className="font-bold"
                  style={{
                    color:
                      activeZoneDef.id === 'zona-panggung-cerita'
                        ? '#B45309'
                        : activeZoneDef.color,
                  }}
                >
                  {activeVideo.zoneName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-[#111C17]">{activeVideo.channelName}</span>
                <span aria-hidden="true">·</span>
                <span>{activeVideo.targetAge}</span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-extrabold leading-snug text-[#111C17]">
                {activeVideo.title}
              </h3>

              <p className="text-xs sm:text-sm leading-relaxed text-[#4A5D54]">
                {activeVideo.summary}
              </p>

              <div className="rounded-2xl border border-[#E7DEC6] bg-[#FFFDF6] p-3.5 space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Fokus Pembelajaran Zona Ini
                </p>
                <p className="text-xs leading-relaxed text-[#3E5B4C]">
                  {activeVideo.learningHighlight}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#EEF3F0] pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayNext}
                  className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#087C3B] px-4 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 whitespace-nowrap"
                >
                  <span>Video Berikutnya</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href={getYouTubeWatchUrl(activeVideo.youtubeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-[#DCE4DF] bg-[#F8FAF9] px-3.5 py-2 text-xs font-bold text-[#111C17] hover:bg-[#FFF2D6] whitespace-nowrap shrink-0"
                >
                  <span>Buka di YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              <a
                href={activeVideo.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#F5D0D0] bg-[#FEF2F2] px-3 py-1.5 text-[11px] font-bold text-[#B91C1C] transition-colors hover:bg-[#FEE2E2] dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-300"
              >
                <PlayCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">Kunjungi Kanal Resmi {activeVideo.channelName}</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid classified by 6 Zones & 10 Channels */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-3xl border border-[#DCE4DF] bg-white p-8 text-center space-y-3">
          <p className="font-display text-base font-bold text-[#111C17]">
            Belum ada video yang cocok dengan filter tersebut.
          </p>
          <p className="text-xs text-[#4A5D54]">
            Coba ganti kanal, pilih zona lain, atau bersihkan kata kunci pencarian untuk melihat seluruh koleksi video.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#087C3B] px-4 py-2 text-xs font-bold text-white hover:opacity-95"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Tampilkan Semua Video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-[#4A5D54]">
            <p className="font-semibold">
              Menampilkan{' '}
              <span className="font-mono-tabular font-bold text-[#111C17]">
                {filteredVideos.length}
              </span>{' '}
              video edukasi{' '}
              {selectedZoneMeta ? `di ${selectedZoneMeta.name}` : 'dari 6 zona belajar'}
              {selectedChannelId !== 'all' ? ` · Kanal ${activeChannelMeta.shortName}` : ''}
            </p>
            <span className="hidden sm:inline">Klik kartu video untuk langsung memutar</span>
          </div>

          <div
            data-testid="educational-videos-grid"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredVideos.map((video) => {
              const isPlaying = video.id === activeVideo.id;
              const zoneDef =
                ADVENTURE_WORLD_ZONES.find((z) => z.id === video.zoneId) ??
                ADVENTURE_WORLD_ZONES[0];
              return (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => handleSelectVideo(video)}
                  aria-pressed={isPlaying}
                  className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    isPlaying
                      ? 'border-[#087C3B] bg-[#FFFDF6] ring-2 ring-[#087C3B]/25 shadow-sm'
                      : 'border-[#DCE4DF] bg-white hover:border-[#BFD0C7]'
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[#10281B]">
                    <ResilientImage
                      src={getYouTubeThumbnailUrl(video.youtubeId)}
                      alt={`Thumbnail video ${video.title}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      renderFallback={() => (
                        <div
                          className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-white"
                          style={{ backgroundColor: zoneDef.color }}
                        >
                          <PlayCircle className="h-9 w-9 opacity-90" aria-hidden="true" />
                          <span className="text-xs font-bold line-clamp-2">{video.title}</span>
                        </div>
                      )}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110 ${
                          isPlaying
                            ? 'bg-[#FFC51B] text-[#10281B]'
                            : 'bg-[#087C3B]/90 text-white'
                        }`}
                      >
                        <Play className="h-5 w-5 fill-current ml-0.5" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-[11px] font-bold text-white">
                      <span className="truncate">{video.zoneName}</span>
                      <span className="shrink-0 text-amber-200 max-w-[55%] truncate">
                        {isPlaying ? 'Sedang Diputar' : video.channelName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-2.5 p-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4A5D54]">
                        <span
                          style={{
                            color:
                              zoneDef.id === 'zona-panggung-cerita'
                                ? '#B45309'
                                : zoneDef.color,
                          }}
                          className="font-bold shrink-0"
                        >
                          {video.zoneName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate font-bold text-[#111C17]">
                          {video.channelName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0">{video.targetAge}</span>
                      </div>
                      <h3 className="font-display text-sm sm:text-base font-bold leading-snug text-[#111C17] line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#4A5D54] line-clamp-2">
                        {video.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#EEF3F0] pt-2.5 text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                      <span>{isPlaying ? 'Aktif di Pemutar Utama' : 'Tonton Sekarang'}</span>
                      <ChevronRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Curated Directory of All 10 Official Educational YouTube Channels */}
      {!compact && (
        <div className="rounded-3xl border border-[#DCE4DF] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold text-[#087C3B] dark:text-[#6EE7B7]">
                Direktori Sumber Video Resmi
              </p>
              <h3 className="font-display text-lg font-extrabold text-[#111C17]">
                10 Kanal YouTube Edukasi Berbahasa Indonesia
              </h3>
            </div>
            <p className="text-xs text-[#4A5D54]">
              Pilih kanal untuk memfilter video, atau buka langsung di YouTube.
            </p>
          </div>

          <div
            data-testid="educational-channels-directory"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {channelGroups.map(({ channel, count }) => {
              const isSelected = selectedChannelId === channel.id;
              return (
                <div
                  key={channel.id}
                  className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-[#087C3B] bg-[#FFFDF6] ring-2 ring-[#087C3B]/20'
                      : 'border-[#E6ECE8] bg-[#F8FAF9] hover:border-[#BFD0C7]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className="font-mono-tabular text-[10px] font-bold"
                        style={{ color: channel.accentColor }}
                      >
                        {channel.level}
                      </span>
                      <span className="font-mono-tabular text-[10px] font-semibold text-[#4A5D54]">
                        {count} video
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-extrabold text-[#111C17] leading-snug">
                      {channel.name}
                    </h4>
                    <p className="text-[11px] leading-snug text-[#4A5D54] line-clamp-2">
                      {channel.topic}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-[#E6ECE8] pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectChannelFromDirectory(channel.id)}
                      className="text-[11px] font-bold text-[#087C3B] hover:underline dark:text-[#6EE7B7] whitespace-nowrap"
                    >
                      {isSelected ? 'Sedang Dipilih' : 'Lihat Video'}
                    </button>
                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buka kanal YouTube ${channel.name}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DC2626] hover:underline whitespace-nowrap"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
