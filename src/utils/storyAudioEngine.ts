export interface StorySoundtrackProfile {
  id: string;
  title: string;
  instrumentsLabel: string;
  moodLabel: string;
  tempoMs: number;
  notesHz: number[];
  bassHz: number[];
  waveform: OscillatorType;
  harmonyWaveform: OscillatorType;
  hasBreeze?: boolean;
  decaySec: number;
}

const SOUNDTRACK_PROFILES: Record<string, StorySoundtrackProfile> = {
  nusantara: {
    id: 'nusantara',
    title: 'Lentera Senja Nusantara',
    instrumentsLabel: 'Gamelan Pelog, Angklung & Suling Bambu',
    moodLabel: 'Hangat · Tradisional Nusantara',
    tempoMs: 560,
    // Pelog-flavored bright pentatonic intervals
    notesHz: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0],
    bassHz: [130.81, 130.81, 196.0, 146.83],
    waveform: 'triangle',
    harmonyWaveform: 'sine',
    decaySec: 0.72,
  },
  dongeng: {
    id: 'dongeng',
    title: 'Bintang Kecil Negeri Dongeng',
    instrumentsLabel: 'Harpa, Celesta & Kotak Musik',
    moodLabel: 'Imajinatif · Lembut & Ceria',
    tempoMs: 500,
    notesHz: [349.23, 440.0, 523.25, 587.33, 659.25, 523.25, 440.0, 392.0],
    bassHz: [174.61, 130.81, 196.0, 174.61],
    waveform: 'sine',
    harmonyWaveform: 'triangle',
    decaySec: 0.85,
  },
  komik: {
    id: 'komik',
    title: 'Petualangan Ceria Panel Komik',
    instrumentsLabel: 'Marimba Kayu & Pizzicato Riang',
    moodLabel: 'Lincah · Penuh Semangat',
    tempoMs: 360,
    notesHz: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66],
    bassHz: [130.81, 196.0, 174.61, 196.0],
    waveform: 'triangle',
    harmonyWaveform: 'sine',
    decaySec: 0.34,
  },
  sains: {
    id: 'sains',
    title: 'Harmoni Eksperimen & Bintang',
    instrumentsLabel: 'Kristal Rhodes & Lonceng Sains',
    moodLabel: 'Penasaran · Menggugah Ide',
    tempoMs: 480,
    notesHz: [293.66, 369.99, 440.0, 493.88, 587.33, 659.25, 493.88, 440.0],
    bassHz: [146.83, 185.0, 220.0, 196.0],
    waveform: 'sine',
    harmonyWaveform: 'sine',
    decaySec: 0.9,
  },
  alam: {
    id: 'alam',
    title: 'Embun Pagi Kebun Literasi',
    instrumentsLabel: 'Kalimba Bambu, Gitar Akustik & Angin Alam',
    moodLabel: 'Sejuk · Damai Menyatu Alam',
    tempoMs: 540,
    notesHz: [392.0, 440.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0],
    bassHz: [196.0, 146.83, 164.81, 146.83],
    waveform: 'sine',
    harmonyWaveform: 'triangle',
    hasBreeze: true,
    decaySec: 0.78,
  },
  inspiratif: {
    id: 'inspiratif',
    title: 'Pelita Harapan & Pahlawan',
    instrumentsLabel: 'Piano Hangat & Ansambel Strings',
    moodLabel: 'Inspiratif · Penuh Harapan',
    tempoMs: 580,
    notesHz: [261.63, 329.63, 392.0, 493.88, 523.25, 440.0, 392.0, 329.63],
    bassHz: [130.81, 164.81, 174.61, 196.0],
    waveform: 'triangle',
    harmonyWaveform: 'sine',
    decaySec: 0.95,
  },
};

export function getStorySoundtrackProfile(
  category: string,
  title = '',
  description = '',
): StorySoundtrackProfile {
  const combined = `${category} ${title} ${description}`.toLowerCase();

  if (
    category === 'Komik Edukasi' ||
    combined.includes('komik') ||
    combined.includes('kapten')
  ) {
    return SOUNDTRACK_PROFILES.komik;
  }

  if (
    category === 'Lingkungan dan Alam' ||
    combined.includes('kebun') ||
    combined.includes('biji') ||
    combined.includes('pohon') ||
    combined.includes('hutan')
  ) {
    return SOUNDTRACK_PROFILES.alam;
  }

  if (
    category === 'Cerita Nusantara' ||
    category === 'Budaya Indonesia' ||
    combined.includes('nusantara') ||
    combined.includes('batik') ||
    combined.includes('angklung') ||
    combined.includes('rawa')
  ) {
    return SOUNDTRACK_PROFILES.nusantara;
  }

  if (
    category === 'Sains dan Pengetahuan' ||
    category === 'Ensiklopedia Anak' ||
    combined.includes('sains') ||
    combined.includes('bintang') ||
    combined.includes('eksperimen')
  ) {
    return SOUNDTRACK_PROFILES.sains;
  }

  if (
    category === 'Sejarah dan Pahlawan' ||
    category === 'Kisah Inspiratif' ||
    combined.includes('pahlawan') ||
    combined.includes('pelita')
  ) {
    return SOUNDTRACK_PROFILES.inspiratif;
  }

  return SOUNDTRACK_PROFILES.dongeng;
}

class StoryAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private breezeGain: GainNode | null = null;
  private breezeSource: AudioBufferSourceNode | null = null;
  private timerId: number | null = null;
  private step = 0;
  private currentProfile: StorySoundtrackProfile | null = null;
  private targetVolume = 0.28;
  private ducked = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.getEffectiveVolume();
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private getEffectiveVolume(): number {
    return this.ducked ? Math.max(0.04, this.targetVolume * 0.25) : this.targetVolume;
  }

  private applyGain() {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(this.getEffectiveVolume(), this.ctx.currentTime, 0.12);
  }

  public setVolume(volume: number) {
    this.targetVolume = Math.max(0.05, Math.min(0.6, volume));
    this.applyGain();
  }

  public setDucked(ducked: boolean) {
    this.ducked = ducked;
    this.applyGain();
  }

  public isPlaying(): boolean {
    return this.timerId !== null;
  }

  public start(profile: StorySoundtrackProfile) {
    this.stop();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    this.currentProfile = profile;
    this.step = 0;

    if (profile.hasBreeze) {
      this.startBreezeLayer(ctx);
    }

    const tick = () => {
      if (!this.ctx || !this.masterGain || !this.currentProfile) return;
      const p = this.currentProfile;
      const now = this.ctx.currentTime;
      const noteFreq = p.notesHz[this.step % p.notesHz.length];
      this.playPluckNote(now, noteFreq, p.waveform, 0.16, p.decaySec);

      // Gentle harmony / bass pulse every 2 beats
      if (this.step % 2 === 0) {
        const bassIdx = Math.floor(this.step / 2) % p.bassHz.length;
        this.playPluckNote(now, p.bassHz[bassIdx], p.harmonyWaveform, 0.09, p.decaySec * 1.3);
      }

      this.step += 1;
    };

    tick();
    this.timerId = window.setInterval(tick, profile.tempoMs);
  }

  private playPluckNote(
    startTime: number,
    freq: number,
    type: OscillatorType,
    peakGain: number,
    decaySec: number,
  ) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decaySec);

    osc.connect(noteGain);
    noteGain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + decaySec + 0.05);
  }

  private startBreezeLayer(ctx: AudioContext) {
    if (!this.masterGain) return;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.breezeSource = source;
    this.breezeGain = gain;
  }

  public stop() {
    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.breezeSource) {
      try {
        this.breezeSource.stop();
        this.breezeSource.disconnect();
      } catch {
        // Ignore already stopped source
      }
      this.breezeSource = null;
    }
    if (this.breezeGain) {
      this.breezeGain.disconnect();
      this.breezeGain = null;
    }
  }
}

export const storyAudioEngine = new StoryAudioEngine();
