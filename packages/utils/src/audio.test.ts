import assert from "node:assert";
import {
  getAudioContext,
  unlockAudioContext,
  registerAutoplayUnlock,
  playSynthesizedChime,
} from "./audio.ts";

// 1. SSR / Node safety test
assert.strictEqual(getAudioContext(), null, "getAudioContext() should return null when window is undefined");
assert.doesNotThrow(() => unlockAudioContext(), "unlockAudioContext() should not throw in SSR");
assert.doesNotThrow(() => registerAutoplayUnlock(), "registerAutoplayUnlock() should not throw in SSR");
assert.doesNotThrow(() => playSynthesizedChime(0.5), "playSynthesizedChime() should not throw in SSR");

// 2. Mock browser environment
let resumeCalled = false;
let startCalled = false;
let stopCalled = false;
const listeners: Record<string, Function[]> = {};

class MockGainNode {
  gain = {
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  };
  connect() {}
}

class MockOscillatorNode {
  type = "sine";
  frequency = {
    setValueAtTime: () => {},
  };
  connect() {}
  start() {
    startCalled = true;
  }
  stop() {
    stopCalled = true;
  }
}

class MockAudioContext {
  state: "suspended" | "running" = "suspended";
  currentTime = 0;
  destination = {};

  async resume() {
    resumeCalled = true;
    this.state = "running";
  }

  createGain() {
    return new MockGainNode();
  }

  createOscillator() {
    return new MockOscillatorNode();
  }
}

const mockWindow = {
  AudioContext: MockAudioContext,
  addEventListener: (event: string, fn: Function) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(fn);
  },
  removeEventListener: (event: string, fn: Function) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((l) => l !== fn);
    }
  },
};

(globalThis as unknown as { window: typeof mockWindow }).window = mockWindow;

// Context instantiation & unlock
const ctx = getAudioContext();
assert.ok(ctx, "AudioContext should be instantiated in browser environment");

unlockAudioContext();
assert.strictEqual(resumeCalled, true, "unlockAudioContext should resume suspended context");

// Synthesized chime creates and triggers oscillators
playSynthesizedChime(0.8);
assert.strictEqual(startCalled, true, "playSynthesizedChime should start oscillators");
assert.strictEqual(stopCalled, true, "playSynthesizedChime should schedule oscillator stops");

console.log("audio tests passed successfully.");
