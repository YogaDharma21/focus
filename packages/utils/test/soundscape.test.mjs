import assert from "node:assert";
import { ProceduralSoundscapeEngine, DEFAULT_CHANNELS, SOUNDSCAPE_PRESETS } from "../src/soundscape.ts";

assert.strictEqual(DEFAULT_CHANNELS.length, 9, "Should have 9 default sound channels");

const focusPreset = SOUNDSCAPE_PRESETS.find((p) => p.id === "focus");
assert.ok(focusPreset, "Deep Focus preset should exist");
assert.strictEqual(focusPreset.channels.brownnoise, 55, "Brown noise volume matches preset");
assert.strictEqual(focusPreset.channels.binauralAlpha, 35, "Alpha waves volume matches preset");

// Mock Minimal AudioContext for unit test of synthesis buffer calculations
class MockAudioBuffer {
  constructor(channels, length, sampleRate) {
    this.sampleRate = sampleRate;
    this.length = length;
    this.data = Array.from({ length: channels }, () => new Float32Array(length));
  }

  getChannelData(channel) {
    return this.data[channel];
  }
}

class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.state = "running";
    this.currentTime = 0;
    this.destination = {};
  }

  createBuffer(channels, length, sampleRate) {
    return new MockAudioBuffer(channels, length, sampleRate);
  }

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: () => {},
        setTargetAtTime: () => {},
        cancelScheduledValues: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
      disconnect: () => {},
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: () => {},
      start: () => {},
      stop: () => {},
      disconnect: () => {},
    };
  }

  resume() {
    return Promise.resolve();
  }
}

globalThis.window = {
  AudioContext: MockAudioContext,
};

const engine = new ProceduralSoundscapeEngine();

const channelIds = [
  "rain",
  "campfire",
  "cafe",
  "birds",
  "whitenoise",
  "pinknoise",
  "brownnoise",
  "binauralAlpha",
  "binauralTheta",
];

for (const id of channelIds) {
  const buf = engine.createBuffer(id);
  assert.strictEqual(buf.length, 44100 * 5, `${id} buffer should be 5 seconds long`);
  const left = buf.getChannelData(0);

  let nonZeroLeft = 0;
  for (let i = 0; i < 1000; i++) {
    if (left[i] !== 0) nonZeroLeft++;
  }
  assert.ok(nonZeroLeft > 500, `${id} channel should synthesize non-zero audio samples`);
}

engine.sync(
  [
    { id: "rain", label: "Rain", category: "nature", volume: 50, enabled: true },
    { id: "brownnoise", label: "Brown", category: "noise", volume: 40, enabled: false },
  ],
  60,
  false,
  true
);

assert.strictEqual(engine.isChannelActive("rain"), true, "Rain channel should be active");
assert.strictEqual(engine.isChannelActive("brownnoise"), false, "Brown channel should not be active");

engine.sync([], 60, false, false);
assert.strictEqual(engine.isChannelActive("rain"), false, "All channels stopped when playing is false");

// SSR safety test
const savedWindow = globalThis.window;
delete globalThis.window;
const ssrEngine = new ProceduralSoundscapeEngine();
assert.doesNotThrow(() => {
  ssrEngine.startChannel("rain", 50);
  ssrEngine.sync([{ id: "rain", label: "Rain", category: "nature", volume: 50, enabled: true }], 50, false, true);
  ssrEngine.stopAll();
}, "SSR execution without window should not throw");
globalThis.window = savedWindow;

console.log("ProceduralSoundscapeEngine tests passed successfully.");
