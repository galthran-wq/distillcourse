import assert from "node:assert/strict";

const RECORDS = [64, 128, 256];
const NAMES = ["Rectangular", "Hann", "Hamming", "4-term Blackman-Harris"];
const EXPECTED = [
  [[-17.88, -.629], [-24.71, -1.619], [-30.343, -.071]],
  [[-32.305, -4.379], [-53.937, 12.546], [-71.099, 31.099]],
  [[-50.489, 10.057], [-43.179, 1.428], [-47.393, 7.66]],
  [[-23.133, -1.311], [-99.165, 59.158], [-99.186, 59.186]],
];

function weight(kind, n, N) {
  const a = 2 * Math.PI * n / N;
  if (kind === 0) return 1;
  if (kind === 1) return .5 - .5 * Math.cos(a);
  if (kind === 2) return .54 - .46 * Math.cos(a);
  return .35875 - .48829 * Math.cos(a) + .14128 * Math.cos(2 * a) - .01168 * Math.cos(3 * a);
}

function spectrum(kind, N, q, phase, weak = true) {
  let re = 0, im = 0, sum = 0;
  for (let n = 0; n < N; n++) {
    const g = weight(kind, n, N), a = 2 * Math.PI * (20.5 - q) * n / 128;
    re += g * Math.cos(a); im += g * Math.sin(a); sum += g;
    if (weak) {
      const b = 2 * Math.PI * (26 - q) * n / 128 + phase;
      re += .01 * g * Math.cos(b); im += .01 * g * Math.sin(b);
    }
  }
  return Math.hypot(re, im) / sum;
}

function study(kind, N) {
  let leakage = 0;
  for (let r = 0; r <= 64; r++) leakage = Math.max(leakage, spectrum(kind, N, 25.5 + r / 64, 0, false));
  let minimum = Infinity, worstPhase = 0;
  for (let m = 0; m < 16; m++) {
    let peak = 0;
    for (let r = 0; r <= 64; r++) peak = Math.max(peak, spectrum(kind, N, 25.5 + r / 64, m * Math.PI / 8));
    const margin = 20 * Math.log10(peak / leakage);
    if (margin < minimum) { minimum = margin; worstPhase = m * 22.5; }
  }
  return { leakageDb: 20 * Math.log10(leakage), minimumMarginDb: minimum, worstPhase, pass: minimum >= 3 };
}

const rows = [];
for (let kind = 0; kind < NAMES.length; kind++) for (let r = 0; r < RECORDS.length; r++) {
  const result = study(kind, RECORDS[r]), expected = EXPECTED[kind][r];
  assert.ok(Math.abs(result.leakageDb - expected[0]) <= .005, `${NAMES[kind]} N=${RECORDS[r]} leakage`);
  assert.ok(Math.abs(result.minimumMarginDb - expected[1]) <= .005, `${NAMES[kind]} N=${RECORDS[r]} margin`);
  rows.push({ window: NAMES[kind], N: RECORDS[r], leakageDb: +result.leakageDb.toFixed(3), minimumMarginDb: +result.minimumMarginDb.toFixed(3), worstPhase: result.worstPhase, pass: result.pass });
}
assert.equal(rows.length, 12);
console.log(JSON.stringify(rows, null, 2));
