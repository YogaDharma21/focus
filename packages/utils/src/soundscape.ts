export type SoundChannelId =
  | "rain"
  | "campfire"
  | "cafe"
  | "birds"
  | "whitenoise"
  | "pinknoise"
  | "brownnoise"
  | "binauralAlpha"
  | "binauralTheta";

export interface SoundChannelState {
  id: SoundChannelId;
  label: string;
  category: "nature" | "noise" | "binaural";
  volume: number; // 0 - 100
  enabled: boolean;
}

export interface SoundscapePreset {
  id: string;
  name: string;
  channels: Partial<Record<SoundChannelId, number>>;
}

export const DEFAULT_CHANNELS: SoundChannelState[] = [
  { id: "rain", label: "Rainfall", category: "nature", volume: 50, enabled: false },
  { id: "campfire", label: "Campfire", category: "nature", volume: 40, enabled: false },
  { id: "cafe", label: "Cafe Ambience", category: "nature", volume: 45, enabled: false },
  { id: "birds", label: "Forest Birds", category: "nature", volume: 40, enabled: false },
  { id: "whitenoise", label: "White Noise", category: "noise", volume: 30, enabled: false },
  { id: "pinknoise", label: "Pink Noise", category: "noise", volume: 40, enabled: false },
  { id: "brownnoise", label: "Brown Noise", category: "noise", volume: 50, enabled: false },
  { id: "binauralAlpha", label: "Alpha Waves (10Hz)", category: "binaural", volume: 35, enabled: false },
  { id: "binauralTheta", label: "Theta Waves (6Hz)", category: "binaural", volume: 35, enabled: false },
];

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: "focus",
    name: "Deep Focus",
    channels: { brownnoise: 55, binauralAlpha: 35 },
  },
  {
    id: "rainyNight",
    name: "Rain & Fire",
    channels: { rain: 60, campfire: 45 },
  },
  {
    id: "cafeStudy",
    name: "Cafe Study",
    channels: { cafe: 60, rain: 35 },
  },
  {
    id: "forestWalk",
    name: "Forest Walk",
    channels: { birds: 55, rain: 30 },
  },
  {
    id: "meditation",
    name: "Meditation",
    channels: { binauralTheta: 45, pinknoise: 30 },
  },
  {
    id: "reset",
    name: "Off",
    channels: {},
  },
];

interface ChannelNodes {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export class ProceduralSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: Map<SoundChannelId, ChannelNodes> = new Map();
  private bufferCache: Partial<Record<SoundChannelId, AudioBuffer>> = {};
  private masterVolume = 60;
  private isMuted = false;
  private isRunning = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      if (typeof window === "undefined") {
        throw new Error("AudioContext is only available in browser environments");
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("AudioContext is not supported in this environment");
      }
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    const ctx = this.getContext();
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.connect(ctx.destination);
      const targetGain = this.isMuted ? 0 : Math.max(0, Math.min(1, this.masterVolume / 100));
      this.masterGain.gain.setValueAtTime(targetGain, ctx.currentTime);
    }
    return this.masterGain;
  }

  public createBuffer(id: SoundChannelId): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const duration = 5;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (id === "whitenoise") {
      for (let i = 0; i < bufferSize; i++) {
        left[i] = (Math.random() * 2 - 1) * 0.18;
        right[i] = (Math.random() * 2 - 1) * 0.18;
      }
      this.applyCrossfade(left, right, sampleRate, bufferSize);
    } else if (id === "pinknoise") {
      this.generatePinkNoise(left, bufferSize);
      this.generatePinkNoise(right, bufferSize);
      this.applyCrossfade(left, right, sampleRate, bufferSize);
    } else if (id === "brownnoise") {
      this.generateBrownNoise(left, bufferSize);
      this.generateBrownNoise(right, bufferSize);
      this.applyCrossfade(left, right, sampleRate, bufferSize);
    } else if (id === "rain") {
      this.generateRain(left, bufferSize, sampleRate);
      this.generateRain(right, bufferSize, sampleRate);
      this.applyCrossfade(left, right, sampleRate, bufferSize);
    } else if (id === "campfire") {
      this.generateCampfire(left, bufferSize, sampleRate);
      this.generateCampfire(right, bufferSize, sampleRate);
      this.applyCrossfade(left, right, sampleRate, bufferSize);
    } else if (id === "cafe") {
      this.generateCafe(left, bufferSize, sampleRate);
      this.generateCafe(right, bufferSize, sampleRate);
      this.applyCrossfade(left, right, sampleRate, bufferSize);
    } else if (id === "birds") {
      this.generateBirds(left, bufferSize, sampleRate);
      this.generateBirds(right, bufferSize, sampleRate);
      this.applyCrossfade(left, right, sampleRate, bufferSize);
    } else if (id === "binauralAlpha") {
      // 200 Hz left, 210 Hz right (10 Hz alpha difference). Exactly 1000 and 1050 cycles in 5s.
      const fLeft = 200;
      const fRight = 210;
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        left[i] = Math.sin(2 * Math.PI * fLeft * t) * 0.22;
        right[i] = Math.sin(2 * Math.PI * fRight * t) * 0.22;
      }
    } else if (id === "binauralTheta") {
      // 200 Hz left, 206 Hz right (6 Hz theta difference). Exactly 1000 and 1030 cycles in 5s.
      const fLeft = 200;
      const fRight = 206;
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        left[i] = Math.sin(2 * Math.PI * fLeft * t) * 0.22;
        right[i] = Math.sin(2 * Math.PI * fRight * t) * 0.22;
      }
    }

    return buffer;
  }

  private generatePinkNoise(data: Float32Array, size: number): void {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }
  }

  private generateBrownNoise(data: Float32Array, size: number): void {
    let lastOut = 0.0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 0.7;
    }
  }

  private generateRain(data: Float32Array, size: number, sampleRate: number): void {
    // Pink noise base + soft droplet impulses
    this.generatePinkNoise(data, size);
    for (let i = 0; i < size; i++) {
      data[i] *= 0.5; // gentle backdrop
    }

    // Sparse droplet ticks
    const dropProbability = 60 / sampleRate; // ~60 drops per second
    for (let i = 0; i < size - 20; i++) {
      if (Math.random() < dropProbability) {
        const dropAmp = (Math.random() * 0.2 + 0.05);
        for (let j = 0; j < 12; j++) {
          data[i + j] += dropAmp * Math.sin((j / 12) * Math.PI) * (Math.random() * 2 - 1);
        }
      }
    }
  }

  private generateCampfire(data: Float32Array, size: number, sampleRate: number): void {
    // Deep warm brown rumble + crackle bursts
    let lastOut = 0.0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.015 * white) / 1.015;
      data[i] = lastOut * 0.55;
    }

    // Crackle pops
    const crackleProbability = 20 / sampleRate; // ~20 pops per second
    for (let i = 0; i < size - 30; i++) {
      if (Math.random() < crackleProbability) {
        const popAmp = (Math.random() * 0.4 + 0.1);
        const decayLen = Math.floor(Math.random() * 15 + 8);
        for (let j = 0; j < decayLen; j++) {
          const env = 1 - j / decayLen;
          data[i + j] += (Math.random() * 2 - 1) * popAmp * env;
        }
      }
    }
  }

  private generateCafe(data: Float32Array, size: number, sampleRate: number): void {
    // Soft low-frequency rumble (murmur) + subtle clinks
    let lastOut = 0.0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.03 * white) / 1.03;
      data[i] = lastOut * 0.45;
    }

    // Occasional gentle ceramic / cup clinks
    const clinkProbability = 3 / sampleRate;
    const clinkLen = Math.floor(sampleRate * 0.04);
    for (let i = 0; i < size - clinkLen; i++) {
      if (Math.random() < clinkProbability) {
        const freq = 2200 + Math.random() * 800;
        for (let j = 0; j < clinkLen; j++) {
          const env = Math.exp(-j / (sampleRate * 0.008));
          data[i + j] += Math.sin((2 * Math.PI * freq * j) / sampleRate) * 0.12 * env;
        }
      }
    }
  }

  private generateBirds(data: Float32Array, size: number, sampleRate: number): void {
    // Light ambient breeze bed
    let lastOut = 0.0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.01 * white) / 1.01;
      data[i] = lastOut * 0.15;
    }

    // Periodic melodious chirps
    const chirpProbability = 2.5 / sampleRate;
    const chirpLen = Math.floor(sampleRate * 0.08);
    for (let i = 0; i < size - chirpLen; i++) {
      if (Math.random() < chirpProbability) {
        const baseFreq = 2800 + Math.random() * 1200;
        for (let j = 0; j < chirpLen; j++) {
          const progress = j / chirpLen;
          const currentFreq = baseFreq + Math.sin(progress * Math.PI * 3) * 400;
          const env = Math.sin(progress * Math.PI);
          data[i + j] += Math.sin((2 * Math.PI * currentFreq * j) / sampleRate) * 0.18 * env;
        }
      }
    }
  }

  private applyCrossfade(left: Float32Array, right: Float32Array, sampleRate: number, size: number): void {
    const fadeSamples = Math.floor(sampleRate * 0.1);
    for (let i = 0; i < fadeSamples; i++) {
      const ratio = i / fadeSamples;
      const endIdx = size - fadeSamples + i;
      const blendL = left[i] * ratio + left[endIdx] * (1 - ratio);
      left[i] = blendL;
      left[endIdx] = blendL;
      const blendR = right[i] * ratio + right[endIdx] * (1 - ratio);
      right[i] = blendR;
      right[endIdx] = blendR;
    }
  }

  public setMasterVolume(volume: number, isMuted = this.isMuted): void {
    this.masterVolume = volume;
    this.isMuted = isMuted;
    if (!this.masterGain || !this.ctx) return;
    const targetGain = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.03);
  }

  public setChannelVolume(id: SoundChannelId, volume: number): void {
    const active = this.activeNodes.get(id);
    if (!active || !this.ctx) return;
    const targetGain = Math.max(0, Math.min(1, volume / 100));
    const now = this.ctx.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setTargetAtTime(targetGain, now, 0.03);
  }

  public startChannel(id: SoundChannelId, volume: number): void {
    if (typeof window === "undefined") return;
    const ctx = this.getContext();
    const master = this.getMasterGain();

    if (this.activeNodes.has(id)) {
      this.setChannelVolume(id, volume);
      return;
    }

    if (!this.bufferCache[id]) {
      this.bufferCache[id] = this.createBuffer(id);
    }

    const source = ctx.createBufferSource();
    source.buffer = this.bufferCache[id]!;
    source.loop = true;

    const gain = ctx.createGain();
    const targetGain = Math.max(0, Math.min(1, volume / 100));
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.05);

    source.connect(gain);
    gain.connect(master);
    source.start(0);

    this.activeNodes.set(id, { source, gain });
  }

  public stopChannel(id: SoundChannelId): void {
    const active = this.activeNodes.get(id);
    if (!active || !this.ctx) return;

    const now = this.ctx.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.linearRampToValueAtTime(0, now + 0.04);

    const source = active.source;
    const gain = active.gain;
    setTimeout(() => {
      try {
        source.stop();
        source.disconnect();
        gain.disconnect();
      } catch {
        // Source node already stopped
      }
    }, 50);

    this.activeNodes.delete(id);
  }

  public sync(channels: SoundChannelState[], masterVol: number, muted: boolean, playing: boolean): void {
    if (typeof window === "undefined") return;
    this.masterVolume = masterVol;
    this.isMuted = muted;
    this.isRunning = playing;

    this.setMasterVolume(masterVol, muted);

    if (!playing) {
      for (const [id] of this.activeNodes) {
        this.stopChannel(id);
      }
      return;
    }

    for (const ch of channels) {
      if (ch.enabled) {
        this.startChannel(ch.id, ch.volume);
      } else {
        this.stopChannel(ch.id);
      }
    }
  }

  public stopAll(): void {
    for (const [id] of this.activeNodes) {
      this.stopChannel(id);
    }
    this.isRunning = false;
  }

  public isChannelActive(id: SoundChannelId): boolean {
    return this.activeNodes.has(id);
  }

  public getRunning(): boolean {
    return this.isRunning;
  }
}

export const soundscapeEngine = new ProceduralSoundscapeEngine();
