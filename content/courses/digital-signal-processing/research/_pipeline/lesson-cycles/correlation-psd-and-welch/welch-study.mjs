import assert from "node:assert/strict";

const SEED = 0x5eedc0de;
const TRIALS = 96;
const RECORD_N = 16_384;
const CALIBRATION_F = 0.3125;
const TONES = [0.18, 0.22];
const TONE_AMPLITUDE = 0.5;
const EXERCISE_FOUR_DATA_SEED = 0x16a11ce;
const EXERCISE_FOUR_BOOTSTRAP_SEED = 0xb0057a9;
const EXERCISE_FIVE_SEED = 0x50c0ffee;
const EXERCISE_SIX_SEED = 0x57f70006;

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function gaussianFactory(seed) {
  const uniform = mulberry32(seed);
  let spare = null;
  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    const radius = Math.sqrt(-2 * Math.log(Math.max(uniform(), 2 ** -32)));
    const angle = 2 * Math.PI * uniform();
    spare = radius * Math.sin(angle);
    return radius * Math.cos(angle);
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function coefficientOfVariation(values) {
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0)
    / (values.length - 1);
  return Math.sqrt(variance) / average;
}

function sampleStatistics(values) {
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0)
    / (values.length - 1);
  const standardDeviation = Math.sqrt(variance);
  return { mean: average, standardDeviation, cv: standardDeviation / average };
}

function close(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} differs from frozen ${expected}`);
}

function periodicHann(n, length) {
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * n / length);
}

function rawPeriodogramAt(re, im, length, frequency) {
  let sumRe = 0;
  let sumIm = 0;
  for (let n = 0; n < length; n++) {
    const angle = 2 * Math.PI * frequency * n;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    sumRe += re[n] * c + im[n] * s;
    sumIm += im[n] * c - re[n] * s;
  }
  return (sumRe ** 2 + sumIm ** 2) / length;
}

function makeWelchPlan(segmentLength, overlapFraction) {
  const hop = Math.round(segmentLength * (1 - overlapFraction));
  const window = Array.from({ length: segmentLength }, (_, n) => periodicHann(n, segmentLength));
  const windowEnergy = window.reduce((sum, value) => sum + value ** 2, 0);
  const starts = [];
  for (let start = 0; start + segmentLength <= RECORD_N; start += hop) starts.push(start);
  const correlations = [];
  for (let frameLag = 1; frameLag * hop < segmentLength; frameLag++) {
    const shift = frameLag * hop;
    let inner = 0;
    for (let n = 0; n + shift < segmentLength; n++) inner += window[n] * window[n + shift];
    correlations.push(inner / windowEnergy);
  }
  const nominal = starts.length;
  const varianceInflation = nominal + 2 * correlations.reduce(
    (sum, rho, index) => sum + (nominal - index - 1) * rho ** 2, 0);
  const effectiveAverages = nominal ** 2 / varianceInflation;
  return {
    segmentLength, overlapFraction, hop, window, windowEnergy, starts, correlations,
    nominalAverages: nominal,
    effectiveAverages,
    predictedCv: 1 / Math.sqrt(effectiveAverages),
    enbwCyclesPerSample: 1.5 / segmentLength,
    nullToNullWidthCyclesPerSample: 4 / segmentLength,
  };
}

function welchAt(re, im, plan, frequency = CALIBRATION_F) {
  let average = 0;
  for (const start of plan.starts) {
    let sumRe = 0;
    let sumIm = 0;
    for (let n = 0; n < plan.segmentLength; n++) {
      const angle = 2 * Math.PI * frequency * n;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const w = plan.window[n];
      sumRe += w * (re[start + n] * c + im[start + n] * s);
      sumIm += w * (im[start + n] * c - re[start + n] * s);
    }
    average += (sumRe ** 2 + sumIm ** 2) / plan.windowEnergy;
  }
  return average / plan.nominalAverages;
}

const plans = [
  makeWelchPlan(32, 0.5),
  makeWelchPlan(64, 0.5),
  makeWelchPlan(128, 0.5),
  makeWelchPlan(512, 0),
  makeWelchPlan(512, 0.5),
  makeWelchPlan(512, 0.75),
  makeWelchPlan(2_048, 0.5),
  makeWelchPlan(4_096, 0.5),
];

function monteCarloStudy() {
  const gaussian = gaussianFactory(SEED);
  const rawLengths = [256, 1_024, 4_096, 16_384];
  const raw = new Map(rawLengths.map((length) => [length, []]));
  const welch = new Map(plans.map((plan) => [`${plan.segmentLength}/${plan.hop}`, []]));
  for (let trial = 0; trial < TRIALS; trial++) {
    const re = new Float64Array(RECORD_N);
    const im = new Float64Array(RECORD_N);
    for (let n = 0; n < RECORD_N; n++) {
      re[n] = gaussian() / Math.SQRT2;
      im[n] = gaussian() / Math.SQRT2;
    }
    for (const length of rawLengths) raw.get(length).push(rawPeriodogramAt(re, im, length, 0.25));
    for (const plan of plans) welch.get(`${plan.segmentLength}/${plan.hop}`).push(welchAt(re, im, plan));
  }
  const rawRows = rawLengths.map((length) => ({
    N: length,
    mean: mean(raw.get(length)),
    cv: coefficientOfVariation(raw.get(length)),
  }));
  const welchRows = plans.map((plan) => ({
    segmentLength: plan.segmentLength,
    overlapFraction: plan.overlapFraction,
    hop: plan.hop,
    nominalAverages: plan.nominalAverages,
    effectiveAverages: plan.effectiveAverages,
    adjacentFrameCorrelation: plan.correlations[0] ?? 0,
    predictedCv: plan.predictedCv,
    empiricalMean: mean(welch.get(`${plan.segmentLength}/${plan.hop}`)),
    empiricalCv: coefficientOfVariation(welch.get(`${plan.segmentLength}/${plan.hop}`)),
    enbwCyclesPerSample: plan.enbwCyclesPerSample,
    nullToNullWidthCyclesPerSample: plan.nullToNullWidthCyclesPerSample,
  }));

  assert.ok(rawRows.every((row) => row.cv > 0.75 && row.cv < 1.25),
    "raw periodogram CV must remain order one at every full-record N");
  assert.ok(rawRows.at(-1).cv > 0.8 * rawRows[0].cv,
    "increasing full-record N must not collapse raw periodogram CV");
  assert.ok(welchRows.find((row) => row.segmentLength === 128).empiricalCv < 0.30,
    "Welch averaging must meet the course CV target");
  assert.ok(welchRows.find((row) => row.segmentLength === 4_096).empiricalCv > 0.30,
    "the long-frame preset must expose too few averages");
  for (const row of welchRows) {
    assert.ok(Math.abs(row.empiricalCv - row.predictedCv) < 0.09,
      `empirical CV must track overlap-corrected prediction for M=${row.segmentLength}, hop=${row.hop}`);
  }
  const overlapRows = welchRows.filter((row) => row.segmentLength === 512);
  assert.ok(overlapRows.slice(1).every((row) => row.effectiveAverages < row.nominalAverages));
  assert.ok(overlapRows[2].nominalAverages > 3.8 * overlapRows[0].nominalAverages
    && overlapRows[2].effectiveAverages < 2.2 * overlapRows[0].effectiveAverages,
  "75% overlap must show strongly diminishing effective-average returns");
  [0.843520, 0.812286, 0.869418, 1.061033].forEach((expected, index) =>
    close(rawRows[index].cv, expected, 5e-7, `raw CV N=${rawRows[index].N}`));
  const frozenWelchCv = [0.034780, 0.045648, 0.060471, 0.178210,
    0.140159, 0.126204, 0.267121, 0.402942];
  frozenWelchCv.forEach((expected, index) => close(welchRows[index].empiricalCv,
    expected, 5e-7, `Welch CV row ${index}`));
  return { rawRows, welchRows };
}

function complexWindowResponse(plan, delta) {
  let re = 0;
  let im = 0;
  for (let n = 0; n < plan.segmentLength; n++) {
    const angle = 2 * Math.PI * delta * n;
    re += plan.window[n] * Math.cos(angle);
    im -= plan.window[n] * Math.sin(angle);
  }
  return { re, im };
}

function multiply(a, b) {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function conjugate(a) {
  return { re: a.re, im: -a.im };
}

function expectedTonePsd(plan, frequency) {
  const responses = TONES.map((tone) => complexWindowResponse(plan, frequency - tone));
  let phaseMean = { re: 0, im: 0 };
  for (const start of plan.starts) {
    const angle = 2 * Math.PI * (TONES[0] - TONES[1]) * start;
    phaseMean.re += Math.cos(angle) / plan.nominalAverages;
    phaseMean.im += Math.sin(angle) / plan.nominalAverages;
  }
  const auto = TONE_AMPLITUDE ** 2 * responses.reduce(
    (sum, value) => sum + value.re ** 2 + value.im ** 2, 0);
  const crossBase = multiply(responses[0], conjugate(responses[1]));
  const cross = multiply(crossBase, phaseMean);
  return 1 + (auto + 2 * TONE_AMPLITUDE ** 2 * cross.re) / plan.windowEnergy;
}

function resolutionStudy() {
  const rows = plans.filter((plan) => plan.overlapFraction === 0.5
    && [32, 64, 128, 512, 2_048, 4_096].includes(plan.segmentLength)).map((plan) => {
    const grid = Array.from({ length: 985 }, (_, index) => 0.14 + index / 8_192);
    const points = grid.map((frequency) => ({ frequency, psd: expectedTonePsd(plan, frequency) }));
    const peaks = [];
    for (let index = 1; index < points.length - 1; index++) {
      if (points[index].frequency >= 0.16 && points[index].frequency <= 0.24
        && points[index].psd > points[index - 1].psd
        && points[index].psd > points[index + 1].psd) peaks.push(points[index]);
    }
    const assigned = TONES.map((tone) => peaks.reduce((best, peak) =>
      !best || Math.abs(peak.frequency - tone) < Math.abs(best.frequency - tone) ? peak : best, null));
    const distinct = assigned.every(Boolean) && assigned[0] !== assigned[1];
    let valleyDepthDb = 0;
    if (distinct) {
      const left = Math.min(assigned[0].frequency, assigned[1].frequency);
      const right = Math.max(assigned[0].frequency, assigned[1].frequency);
      const valley = points.filter((point) => point.frequency >= left && point.frequency <= right)
        .reduce((best, point) => point.psd < best.psd ? point : best);
      valleyDepthDb = 10 * Math.log10(Math.min(assigned[0].psd, assigned[1].psd) / valley.psd);
    }
    const locationErrors = distinct ? assigned.map((peak, index) => peak.frequency - TONES[index]) : [];
    return {
      segmentLength: plan.segmentLength,
      enbwCyclesPerSample: plan.enbwCyclesPerSample,
      nullToNullWidthCyclesPerSample: plan.nullToNullWidthCyclesPerSample,
      localPeakCount: peaks.length,
      peakFrequencies: distinct ? assigned.map((peak) => peak.frequency) : [],
      maximumLocationError: distinct ? Math.max(...locationErrors.map(Math.abs)) : null,
      valleyDepthDb,
      resolves: distinct && Math.max(...locationErrors.map(Math.abs)) < 0.01 && valleyDepthDb >= 1,
    };
  });
  const short = rows.find((row) => row.segmentLength === 32);
  const medium = rows.find((row) => row.segmentLength === 64);
  const fiveTwelve = rows.find((row) => row.segmentLength === 512);
  const long = rows.find((row) => row.segmentLength === 4_096);
  assert.equal(short.resolves, false, "M=32 must merge the 0.04-separated tones");
  assert.equal(medium.resolves, true, "M=64 must separate the 0.04-separated tones");
  assert.equal(fiveTwelve.resolves, true, "M=512 must pass the declared peak/valley rule");
  assert.equal(long.resolves, true, "M=4096 must pass the declared peak/valley rule");
  assert.equal(short.enbwCyclesPerSample, 2 * medium.enbwCyclesPerSample,
    "halving segment length must double Hann ENBW");
  close(medium.valleyDepthDb, 6.013752, 5e-7, "M=64 valley depth");
  close(fiveTwelve.valleyDepthDb, 19.358973, 5e-7, "M=512 valley depth");
  close(long.valleyDepthDb, 28.166839, 5e-7, "M=4096 valley depth");
  return rows;
}

function percentile(sortedValues, probability) {
  return sortedValues[Math.floor((sortedValues.length - 1) * probability)];
}

function independentAveragingExerciseStudy() {
  const segmentLength = 256;
  const independentRecords = 16;
  const outerTrials = 50;
  const frequency = 0.25;
  const bootstrapResamples = 10_000;
  const gaussian = gaussianFactory(EXERCISE_FOUR_DATA_SEED);
  const window = Array.from({ length: segmentLength }, (_, n) => periodicHann(n, segmentLength));
  const windowEnergy = window.reduce((sum, value) => sum + value ** 2, 0);

  function onePeriodogram() {
    let sumRe = 0;
    let sumIm = 0;
    for (let n = 0; n < segmentLength; n++) {
      const re = gaussian() / Math.SQRT2;
      const im = gaussian() / Math.SQRT2;
      const angle = 2 * Math.PI * frequency * n;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      sumRe += window[n] * (re * c + im * s);
      sumIm += window[n] * (im * c - re * s);
    }
    return (sumRe ** 2 + sumIm ** 2) / windowEnergy;
  }

  const raw = [];
  const averaged = [];
  for (let trial = 0; trial < outerTrials; trial++) {
    const values = Array.from({ length: independentRecords }, onePeriodogram);
    raw.push(values[0]);
    averaged.push(mean(values));
  }

  const bootstrapUniform = mulberry32(EXERCISE_FOUR_BOOTSTRAP_SEED);
  const rawBootstrap = [];
  const averagedBootstrap = [];
  for (let resample = 0; resample < bootstrapResamples; resample++) {
    const rawSample = [];
    const averagedSample = [];
    for (let draw = 0; draw < outerTrials; draw++) {
      const index = Math.floor(bootstrapUniform() * outerTrials);
      rawSample.push(raw[index]);
      averagedSample.push(averaged[index]);
    }
    rawBootstrap.push(coefficientOfVariation(rawSample));
    averagedBootstrap.push(coefficientOfVariation(averagedSample));
  }
  rawBootstrap.sort((a, b) => a - b);
  averagedBootstrap.sort((a, b) => a - b);

  const rawStatistics = sampleStatistics(raw);
  const averagedStatistics = sampleStatistics(averaged);
  const result = {
    dataSeedHex: `0x${EXERCISE_FOUR_DATA_SEED.toString(16)}`,
    bootstrapSeedHex: `0x${EXERCISE_FOUR_BOOTSTRAP_SEED.toString(16)}`,
    segmentLength,
    independentRecords,
    outerTrials,
    frequencyCyclesPerSample: frequency,
    windowEnergy,
    bootstrapResamples,
    percentileIndexRule: "floor((B-1)p)",
    raw: { ...rawStatistics, bootstrap95: [percentile(rawBootstrap, 0.025), percentile(rawBootstrap, 0.975)] },
    averaged: { ...averagedStatistics, bootstrap95: [percentile(averagedBootstrap, 0.025), percentile(averagedBootstrap, 0.975)] },
  };
  close(result.raw.mean, 1.3835069584908242, 5e-12, "exercise 4 raw mean");
  close(result.raw.cv, 1.0591744557861487, 5e-12, "exercise 4 raw CV");
  close(result.raw.bootstrap95[0], 0.8711380711088876, 5e-12, "exercise 4 raw lower CI");
  close(result.raw.bootstrap95[1], 1.233857773693902, 5e-12, "exercise 4 raw upper CI");
  close(result.averaged.mean, 1.0240777850484784, 5e-12, "exercise 4 averaged mean");
  close(result.averaged.cv, 0.2848918041638086, 5e-12, "exercise 4 averaged CV");
  close(result.averaged.bootstrap95[0], 0.2260483843496174, 5e-12, "exercise 4 averaged lower CI");
  close(result.averaged.bootstrap95[1], 0.33502739412871735, 5e-12, "exercise 4 averaged upper CI");
  return result;
}

function estimatorDesignExerciseStudy() {
  const trials = 50;
  const fftLength = 8_192;
  const plan = makeWelchPlan(512, 0.5);
  const gaussian = gaussianFactory(EXERCISE_FIVE_SEED);
  const values = [];
  for (let trial = 0; trial < trials; trial++) {
    const re = new Float64Array(RECORD_N);
    const im = new Float64Array(RECORD_N);
    for (let n = 0; n < RECORD_N; n++) {
      re[n] = gaussian() / Math.SQRT2;
      im[n] = gaussian() / Math.SQRT2;
    }
    values.push(welchAt(re, im, plan));
  }
  const result = {
    seedHex: `0x${EXERCISE_FIVE_SEED.toString(16)}`,
    trials,
    recordLength: RECORD_N,
    segmentLength: plan.segmentLength,
    hop: plan.hop,
    fftLength,
    calibrationFrequencyCyclesPerSample: CALIBRATION_F,
    windowEnergy: plan.windowEnergy,
    nominalAverages: plan.nominalAverages,
    ...sampleStatistics(values),
  };
  close(result.mean, 0.9975647988765165, 5e-12, "exercise 5 mean");
  close(result.standardDeviation, 0.12358477551694085, 5e-12, "exercise 5 sample SD");
  close(result.cv, 0.12388646397319276, 5e-12, "exercise 5 CV");
  return result;
}

function onsetExerciseStudy() {
  const recordLength = 4_096;
  const segmentLength = 256;
  const hop = 64;
  const fftLength = 6_400;
  const firstTone = 0.18;
  const secondTone = 0.22;
  const toneAmplitude = 0.5;
  const onset = 2_048;
  const noiseVariance = 0.01;
  const threshold = 0.1;
  const gaussian = gaussianFactory(EXERCISE_SIX_SEED);
  const re = new Float64Array(recordLength);
  const im = new Float64Array(recordLength);
  for (let n = 0; n < recordLength; n++) {
    re[n] = toneAmplitude * Math.cos(2 * Math.PI * firstTone * n)
      + (n >= onset ? toneAmplitude * Math.cos(2 * Math.PI * secondTone * n) : 0)
      + Math.sqrt(noiseVariance / 2) * gaussian();
    im[n] = toneAmplitude * Math.sin(2 * Math.PI * firstTone * n)
      + (n >= onset ? toneAmplitude * Math.sin(2 * Math.PI * secondTone * n) : 0)
      + Math.sqrt(noiseVariance / 2) * gaussian();
  }
  const window = Array.from({ length: segmentLength }, (_, n) => periodicHann(n, segmentLength));
  const windowEnergy = window.reduce((sum, value) => sum + value ** 2, 0);
  const powers = [];
  for (let start = 0; start + segmentLength <= recordLength; start += hop) {
    let sumRe = 0;
    let sumIm = 0;
    for (let n = 0; n < segmentLength; n++) {
      const angle = 2 * Math.PI * secondTone * n;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      sumRe += window[n] * (re[start + n] * c + im[start + n] * s);
      sumIm += window[n] * (im[start + n] * c - re[start + n] * s);
    }
    powers.push((sumRe ** 2 + sumIm ** 2) / windowEnergy);
  }
  const firstCrossingFrame = powers.findIndex((value) => value > threshold);
  const firstCrossingStart = firstCrossingFrame * hop;
  const previousFrameEnd = (firstCrossingFrame - 1) * hop + segmentLength - 1;
  const result = {
    seedHex: `0x${EXERCISE_SIX_SEED.toString(16)}`,
    recordLength,
    segmentLength,
    hop,
    fftLength,
    frameCount: powers.length,
    windowEnergy,
    firstToneCyclesPerSample: firstTone,
    secondToneCyclesPerSample: secondTone,
    secondToneBin: secondTone * fftLength,
    toneAmplitude,
    onset,
    noiseVariance,
    threshold,
    previousFrame: { index: firstCrossingFrame - 1, power: powers[firstCrossingFrame - 1], end: previousFrameEnd },
    firstCrossingFrame: { index: firstCrossingFrame, power: powers[firstCrossingFrame], start: firstCrossingStart,
      end: firstCrossingStart + segmentLength - 1 },
    inferredOnsetInterval: [previousFrameEnd + 1, firstCrossingStart + segmentLength - 1],
    averagedPowerAtSecondTone: mean(powers),
  };
  assert.equal(result.frameCount, 61, "exercise 6 frame count");
  assert.equal(result.firstCrossingFrame.index, 29, "exercise 6 first crossing frame");
  assert.deepEqual(result.inferredOnsetInterval, [2_048, 2_111], "exercise 6 onset interval");
  close(result.previousFrame.power, 0.008114660268096879, 5e-12, "exercise 6 previous power");
  close(result.firstCrossingFrame.power, 0.31463027311304387, 5e-12, "exercise 6 crossing power");
  close(result.averagedPowerAtSecondTone, 20.874196421372368, 5e-12, "exercise 6 averaged power");
  return result;
}

function rounded(value, digits = 6) {
  return typeof value === "number" ? Number(value.toFixed(digits)) : value;
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, clean(child)]));
  return rounded(value);
}

const monteCarlo = monteCarloStudy();
const resolution = resolutionStudy();
const exerciseFour = independentAveragingExerciseStudy();
const exerciseFive = estimatorDesignExerciseStudy();
const exerciseSix = onsetExerciseStudy();
const feasible = monteCarlo.welchRows.filter((variance) => {
  const tone = resolution.find((row) => row.segmentLength === variance.segmentLength);
  return variance.overlapFraction === 0.5 && variance.empiricalCv < 0.30 && tone?.resolves;
});
assert.ok(feasible.length >= 2, "the current course target must have a nontrivial feasible region");

console.log(JSON.stringify(clean({
  deterministic: true,
  seedHex: `0x${SEED.toString(16)}`,
  prng: "mulberry32 + cached Box-Muller; circular complex Gaussian CN(0,1)",
  trials: TRIALS,
  recordLength: RECORD_N,
  calibrationFrequencyCyclesPerSample: CALIBRATION_F,
  tones: { frequenciesCyclesPerSample: TONES, separation: TONES[1] - TONES[0], amplitude: TONE_AMPLITUDE },
  monteCarlo,
  resolution,
  exerciseReproductions: { exerciseFour, exerciseFive, exerciseSix },
  courseTarget: {
    cvLimitExclusive: 0.30,
    toneRule: "two distinct local maxima, each within 0.01 cycles/sample of truth, with >=1 dB intervening valley",
    feasiblePresets: feasible.map((row) => ({ segmentLength: row.segmentLength, overlapFraction: row.overlapFraction,
      empiricalCv: row.empiricalCv })),
  },
}), null, 2));
