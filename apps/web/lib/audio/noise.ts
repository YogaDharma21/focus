export type NoiseColor = "brown" | "pink" | "white";

class ProceduralNoiseEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private activeColor: NoiseColor = "brown";
  private bufferCache: Partial<Record<NoiseColor, AudioBuffer>> = {};
  private isRunning = false;
  private volume = 60;
  private isMuted = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createBuffer(color: NoiseColor): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const duration = 5;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);

      if (color === "white") {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.22;
        }
      } else if (color === "pink") {
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        let b3 = 0;
        let b4 = 0;
        let b5 = 0;
        let b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] =
            (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.075;
          b6 = white * 0.115926;
        }
      } else {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 0.75;
        }
      }

      const fadeSamples = Math.floor(sampleRate * 0.1);
      for (let i = 0; i < fadeSamples; i++) {
        const ratio = i / fadeSamples;
        const endIdx = bufferSize - fadeSamples + i;
        const blended = data[i] * ratio + data[endIdx] * (1 - ratio);
        data[i] = blended;
        data[endIdx] = blended;
      }
    }

    return buffer;
  }

  public setVolume(volume: number, isMuted: boolean): void {
    this.volume = volume;
    this.isMuted = isMuted;
    if (!this.gainNode || !this.ctx) return;
    const targetGain = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
    const now = this.ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.03);
  }

  public play(color: NoiseColor = this.activeColor): void {
    if (typeof window === "undefined") return;
    const ctx = this.getContext();
    this.activeColor = color;

    if (this.isRunning && this.sourceNode) {
      if (this.activeColor === color) return;
      this.stop();
    }

    if (!this.bufferCache[color]) {
      this.bufferCache[color] = this.createBuffer(color);
    }

    const source = ctx.createBufferSource();
    source.buffer = this.bufferCache[color]!;
    source.loop = true;

    if (!this.gainNode) {
      this.gainNode = ctx.createGain();
      this.gainNode.connect(ctx.destination);
    }

    const targetGain = this.isMuted
      ? 0
      : Math.max(0, Math.min(1, this.volume / 100));
    const now = ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(targetGain, now + 0.05);

    source.connect(this.gainNode);
    source.start(0);

    this.sourceNode = source;
    this.isRunning = true;
  }

  public stop(): void {
    if (!this.isRunning || !this.sourceNode || !this.ctx || !this.gainNode) {
      this.isRunning = false;
      return;
    }

    const now = this.ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + 0.04);

    const node = this.sourceNode;
    setTimeout(() => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Source node already stopped
      }
    }, 50);

    this.sourceNode = null;
    this.isRunning = false;
  }

  public setColor(color: NoiseColor): void {
    this.activeColor = color;
    if (this.isRunning) {
      this.stop();
      this.play(color);
    }
  }

  public getPlaying(): boolean {
    return this.isRunning;
  }

  public getColor(): NoiseColor {
    return this.activeColor;
  }
}

export const noiseEngine = new ProceduralNoiseEngine();
