import assert from "node:assert/strict";

const FS_HZ = 1024;
const N0 = 64;
const WINDOWS = {
  rectangular: () => 1,
  hann: (n, N) => 0.5 - 0.5 * Math.cos(2 * Math.PI * n / N),
  blackman: (n, N) => 0.42 - 0.5 * Math.cos(2 * Math.PI * n / N)
    + 0.08 * Math.cos(4 * Math.PI * n / N),
};

function close(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} differs from ${expected}`);
}

function makeRecord(N, windowName, tones) {
  const samples = [];
  let windowSum = 0;
  for (let n = 0; n < N; n++) {
    const w = WINDOWS[windowName](n, N);
    let re = 0;
    let im = 0;
    for (const tone of tones) {
      const phase = 2 * Math.PI * tone.q * n / N0 + tone.phase;
      re += tone.amplitude * Math.cos(phase);
      im += tone.amplitude * Math.sin(phase);
    }
    samples.push({ re: w * re, im: w * im });
    windowSum += w;
  }
  return { N, samples, windowSum };
}

function dtft(record, q) {
  let re = 0;
  let im = 0;
  for (let n = 0; n < record.N; n++) {
    const angle = 2 * Math.PI * q * n / N0;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    re += record.samples[n].re * c + record.samples[n].im * s;
    im += record.samples[n].im * c - record.samples[n].re * s;
  }
  return { re: re / record.windowSum, im: im / record.windowSum };
}

function zeroPaddedDft(record, L, k) {
  let re = 0;
  let im = 0;
  for (let n = 0; n < L; n++) {
    const sample = n < record.N ? record.samples[n] : { re: 0, im: 0 };
    const angle = 2 * Math.PI * k * n / L;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    re += sample.re * c + sample.im * s;
    im += sample.im * c - sample.re * s;
  }
  return { re: re / record.windowSum, im: im / record.windowSum };
}

function magnitude(value) {
  return Math.hypot(value.re, value.im);
}

function rounded(value, digits = 9) {
  return Number(value.toFixed(digits));
}

function paddingAndDurationStudy() {
  const tone = { q: 10.31, amplitude: 1, phase: 0 };
  const short = makeRecord(64, "hann", [tone]);
  const padding = [1, 4, 16].map((Q) => {
    const L = Q * short.N;
    let maxDtftError = 0;
    for (let k = 0; k < L; k++) {
      const padded = zeroPaddedDft(short, L, k);
      const direct = dtft(short, k * N0 / L);
      maxDtftError = Math.max(maxDtftError,
        Math.hypot(padded.re - direct.re, padded.im - direct.im));
    }
    assert.ok(maxDtftError < 1e-12);
    return {
      Q, L,
      gridSpacingOriginalBins: N0 / L,
      gridSpacingHz: FS_HZ / L,
      nullToNullWidthOriginalBins: 4,
      nullToNullWidthHz: 64,
      maxDtftError: rounded(maxDtftError, 15),
    };
  });

  const durations = [64, 256].map((N) => {
    const record = makeRecord(N, "hann", [tone]);
    const firstNullOffset = 2 * N0 / N;
    const nullResidual = Math.max(
      magnitude(dtft(record, tone.q - firstNullOffset)),
      magnitude(dtft(record, tone.q + firstNullOffset)),
    );
    assert.ok(nullResidual < 1e-12);
    return {
      N,
      durationMs: 1000 * N / FS_HZ,
      commonDisplayLength: 1024,
      displayGridHz: 1,
      nullToNullWidthOriginalBins: 4 * N0 / N,
      nullToNullWidthHz: 4 * FS_HZ / N,
      nullResidual: rounded(nullResidual, 15),
    };
  });
  assert.deepEqual(padding.map((x) => x.nullToNullWidthHz), [64, 64, 64]);
  assert.deepEqual(durations.map((x) => x.nullToNullWidthHz), [64, 16]);
  return { padding, durations };
}

function parabola(alpha, beta, gamma) {
  const denominator = alpha - 2 * beta + gamma;
  if (Math.abs(denominator) <= 1e-14) return null;
  const p = 0.5 * (alpha - gamma) / denominator;
  return { p, peakDb: beta - 0.25 * (alpha - gamma) * p };
}

function estimatePeak(windowName, Q, qTrue) {
  const record = makeRecord(64, windowName,
    [{ q: qTrue, amplitude: 1, phase: 0 }]);
  const center = Math.round(qTrue * Q);
  const db = [-1, 0, 1].map((offset) =>
    20 * Math.log10(Math.max(1e-14,
      magnitude(dtft(record, (center + offset) / Q)))));
  const fit = parabola(...db);
  assert.ok(fit);
  const qEstimate = (center + fit.p) / Q;
  return {
    window: windowName, Q,
    qEstimate: rounded(qEstimate),
    frequencyErrorOriginalBins: rounded(qEstimate - qTrue),
    frequencyErrorHz: rounded((qEstimate - qTrue) * FS_HZ / N0),
    amplitudeErrorDb: rounded(fit.peakDb),
  };
}

function interpolationStudy() {
  const qTrue = 10.31;
  const estimates = Object.keys(WINDOWS).flatMap((windowName) =>
    [1, 4].map((Q) => estimatePeak(windowName, Q, qTrue)));
  close(estimates[0].frequencyErrorOriginalBins, -0.167044123, 1e-9, "rect Q1 bias");
  close(estimates[2].frequencyErrorOriginalBins, 0.015906317, 1e-9, "Hann Q1 bias");
  close(estimates[4].frequencyErrorOriginalBins, 0.006584228, 1e-9, "Blackman Q1 bias");
  assert.ok(estimates.filter((x) => x.Q === 4)
    .every((x) => Math.abs(x.frequencyErrorOriginalBins) < 0.002));
  for (const windowName of Object.keys(WINDOWS)) {
    close(estimatePeak(windowName, 1, 10).frequencyErrorOriginalBins, 0, 1e-12,
      `${windowName} centered`);
    close(estimatePeak(windowName, 1, 10.5).frequencyErrorOriginalBins, 0, 1e-12,
      `${windowName} half-bin`);
  }
  assert.equal(parabola(-3, -3, -3), null);
  return { qTrue, frequencyHz: qTrue * FS_HZ / N0, estimates };
}

function qualifyingPairPeaks(N, relativePhaseDeg) {
  const record = makeRecord(N, "rectangular", [
    { q: 10, amplitude: 1, phase: 0 },
    { q: 10.5, amplitude: 1, phase: relativePhaseDeg * Math.PI / 180 },
  ]);
  const lo = 9;
  const step = 1 / 4096;
  const values = Array.from({ length: 10241 }, (_, i) => {
    const q = lo + i * step;
    return { q, magnitude: magnitude(dtft(record, q)) };
  });
  const bandMax = Math.max(...values.map((x) => x.magnitude));
  const peaks = [];
  for (let i = 1; i < values.length - 1; i++) {
    const point = values[i];
    if (point.q >= 9.5 && point.q <= 11
      && point.magnitude >= 0.5 * bandMax
      && point.magnitude > values[i - 1].magnitude
      && point.magnitude > values[i + 1].magnitude) {
      peaks.push({ ...point, index: i });
    }
  }
  const result = {
    N, relativePhaseDeg,
    peakCount: peaks.length,
    peakLocationsOriginalBins: peaks.map((x) => rounded(x.q, 6)),
  };
  if (peaks.length === 2) {
    const valley = values.slice(peaks[0].index, peaks[1].index + 1)
      .reduce((best, point) => point.magnitude < best.magnitude ? point : best);
    result.valleyLocationOriginalBins = rounded(valley.q, 6);
    result.valleyDepthDb = rounded(20 * Math.log10(
      Math.min(peaks[0].magnitude, peaks[1].magnitude) / valley.magnitude), 6);
    result.locationErrorsOriginalBins = [peaks[0].q - 10, peaks[1].q - 10.5]
      .map((x) => rounded(x, 6));
  }
  return result;
}

function phaseStudy() {
  const shortInPhase = qualifyingPairPeaks(64, 0);
  const shortQuadrature = qualifyingPairPeaks(64, 90);
  const longInPhase = qualifyingPairPeaks(256, 0);
  const longQuadrature = qualifyingPairPeaks(256, 90);
  assert.equal(shortInPhase.peakCount, 1);
  assert.equal(shortQuadrature.peakCount, 2);
  assert.ok(shortQuadrature.locationErrorsOriginalBins.every((x) => Math.abs(x) > 0.4));
  assert.ok([longInPhase, longQuadrature].every((x) =>
    x.peakCount === 2 && x.locationErrorsOriginalBins.every((e) => Math.abs(e) < 0.05)));
  return { trueLocationsOriginalBins: [10, 10.5], shortInPhase, shortQuadrature,
    longInPhase, longQuadrature };
}

const report = {
  deterministic: true,
  units: { sampleRateHz: FS_HZ, referenceRecordN0: N0, originalBinHz: FS_HZ / N0 },
  paddingAndDuration: paddingAndDurationStudy(),
  interpolation: interpolationStudy(),
  relativePhase: phaseStudy(),
};

console.log(JSON.stringify(report, null, 2));
