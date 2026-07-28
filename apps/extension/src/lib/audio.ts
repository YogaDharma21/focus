// Built-in Web Audio API Synthesizer for ambient sounds
let audioCtx: AudioContext | null = null;
let activeSourceNode: AudioNode | null = null;
let gainNode: GainNode | null = null;

export const AMBIENT_TRACKS = [
  { id: "rain", title: "Soft Rain", category: "rain", icon: "CloudRain", desc: "Gentle falling raindrops" },
  { id: "waves", title: "Ocean Waves", category: "waves", icon: "Waves", desc: "Calming sea tide roll" },
  { id: "whitenoise", title: "White Noise", category: "whitenoise", icon: "Wind", desc: "Deep continuous airflow" },
  { id: "piano", title: "Focus Chords", category: "piano", icon: "Music", desc: "Ambient ambient synth drone" },
];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playAmbientTrack(trackId: string, volume: number = 0.5) {
  stopAmbientTrack();
  const ctx = getAudioContext();

  gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.connect(ctx.destination);

  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (trackId === "rain" || trackId === "waves" || trackId === "whitenoise") {
    // Generate pink noise / filtered noise for rain & ocean waves
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter effect
    const filter = ctx.createBiquadFilter();
    filter.type = trackId === "rain" ? "lowpass" : trackId === "waves" ? "bandpass" : "lowpass";
    filter.frequency.setValueAtTime(trackId === "rain" ? 1200 : trackId === "waves" ? 400 : 800, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    noiseSource.start();
    activeSourceNode = noiseSource;
  } else if (trackId === "piano") {
    // Synth chord pad
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3
    osc2.frequency.setValueAtTime(329.63, ctx.currentTime); // E4

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);

    osc1.start();
    osc2.start();

    activeSourceNode = osc1;
  }
}

export function setAmbientVolume(volume: number) {
  if (gainNode && audioCtx) {
    gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), audioCtx.currentTime);
  }
}

export function stopAmbientTrack() {
  if (activeSourceNode) {
    try {
      (activeSourceNode as AudioBufferSourceNode).stop();
    } catch {
      // ignore if already stopped
    }
    activeSourceNode = null;
  }
}
