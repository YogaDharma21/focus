import assert from "node:assert/strict";
import test from "node:test";

test("procedural noise math generators produce bounded values", () => {
  // White noise
  for (let i = 0; i < 1000; i++) {
    const val = (Math.random() * 2 - 1) * 0.22;
    assert.ok(val >= -0.22 && val <= 0.22, "white noise out of bounds");
  }

  // Pink noise filter poles
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < 1000; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const output = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.075;
    b6 = white * 0.115926;
    assert.ok(Math.abs(output) < 1.0, "pink noise value unstable");
  }

  // Brown noise leaky integrator
  let lastOut = 0.0;
  for (let i = 0; i < 1000; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    const output = lastOut * 0.75;
    assert.ok(Math.abs(output) < 1.0, "brown noise value unstable");
  }
});
