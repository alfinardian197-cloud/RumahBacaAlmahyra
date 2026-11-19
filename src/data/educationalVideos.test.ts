import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_WORLD_ZONES } from '../utils/almahyra';
import {
  EDUCATIONAL_CHANNELS,
  EDUCATIONAL_VIDEOS,
  filterEducationalVideos,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeWatchUrl,
  groupEducationalVideosByChannel,
  groupEducationalVideosByZone,
} from './educationalVideos';

test('EDUCATIONAL_VIDEOS covers all 6 Almahyra zones with multi-channel diversity across all 10 official channels', () => {
  assert.equal(ADVENTURE_WORLD_ZONES.length, 6);
  assert.equal(EDUCATIONAL_CHANNELS.length, 10);
  assert.equal(EDUCATIONAL_VIDEOS.length, 36);

  // Every official channel must have at least 2 curated videos
  const byChannel = groupEducationalVideosByChannel(EDUCATIONAL_VIDEOS);
  assert.equal(byChannel.length, 10);
  for (const group of byChannel) {
    assert.ok(
      group.count >= 2,
      `Expected >= 2 curated videos for channel ${group.channel.name}, got ${group.count}`,
    );
    assert.ok(group.channel.url.startsWith('https://www.youtube.com/'));
  }

  // Every zone must have 6 curated videos from at least 4 different channels
  const byZone = groupEducationalVideosByZone(EDUCATIONAL_VIDEOS);
  assert.equal(byZone.length, 6);

  const uniqueVideoIds = new Set<string>();
  for (const group of byZone) {
    assert.equal(
      group.count,
      6,
      `Expected 6 curated videos in ${group.zone.name}, got ${group.count}`,
    );
    const uniqueChannelsInZone = new Set(group.videos.map((v) => v.channelId));
    assert.ok(
      uniqueChannelsInZone.size >= 4,
      `Expected >= 4 distinct channels in ${group.zone.name}, got ${uniqueChannelsInZone.size}`,
    );

    for (const video of group.videos) {
      assert.match(video.youtubeId, /^[a-zA-Z0-9_-]{11}$/);
      assert.ok(!uniqueVideoIds.has(video.youtubeId), `Duplicate youtubeId: ${video.youtubeId}`);
      uniqueVideoIds.add(video.youtubeId);
      assert.equal(video.zoneName, group.zone.name);
      assert.ok(video.channelName.length > 0);
      assert.ok(video.channelUrl.startsWith('https://www.youtube.com/'));
      assert.ok(getYouTubeThumbnailUrl(video.youtubeId).includes(video.youtubeId));
      assert.ok(getYouTubeEmbedUrl(video.youtubeId).startsWith('https://www.youtube-nocookie.com/embed/'));
      assert.ok(getYouTubeWatchUrl(video.youtubeId).startsWith('https://www.youtube.com/watch?v='));
    }
  }
});

test('filterEducationalVideos filters accurately by zone, channel, and search keyword', () => {
  const all = filterEducationalVideos(EDUCATIONAL_VIDEOS, 'all', '', 'all');
  assert.equal(all.length, 36);

  const eksplorasi = filterEducationalVideos(EDUCATIONAL_VIDEOS, 'zona-eksplorasi', '');
  assert.equal(eksplorasi.length, 6);
  assert.ok(eksplorasi.every((v) => v.zoneId === 'zona-eksplorasi'));

  const kokBisa = filterEducationalVideos(EDUCATIONAL_VIDEOS, 'all', '', 'kok-bisa');
  assert.equal(kokBisa.length, 4);
  assert.ok(kokBisa.every((v) => v.channelId === 'kok-bisa'));

  const ririDanauToba = filterEducationalVideos(EDUCATIONAL_VIDEOS, 'zona-imajinasi', 'danau toba', 'riri');
  assert.equal(ririDanauToba.length, 1);
  assert.equal(ririDanauToba[0].youtubeId, 'qsrKzbumyuM');

  const neuronBiology = filterEducationalVideos(EDUCATIONAL_VIDEOS, 'zona-pengetahuan', '', 'neuron');
  assert.equal(neuronBiology.length, 2);
  assert.ok(neuronBiology.every((v) => v.channelName === 'Neuron'));

  const byChannelKeyword = filterEducationalVideos(EDUCATIONAL_VIDEOS, 'all', 'nussa');
  assert.equal(byChannelKeyword.length, 3);

  const empty = filterEducationalVideos(EDUCATIONAL_VIDEOS, 'zona-imajinasi', 'tidak-ada-kata-ini-xyz');
  assert.equal(empty.length, 0);
});
