#!/usr/bin/env python3
"""Deterministic, pure-stdlib DTMF receiver calibration and held-out study.

This is a synthetic laboratory study, not evidence from a deployed telephone
receiver.  It uses the lesson's committed phone-channel impulse response, but
does not modify or regenerate the dtmf-v1 corpus.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import platform
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional


FS = 8000
BLOCK_SAMPLES = 40  # 5 ms; long enough to stabilize the noisy energy gate
FEATURE_SAMPLES = 160  # 20 ms rectangular spectral record
OPERATE_MS = 40
REJECT_MAX_MS = 23
GRAY_MIN_MS = 24
GRAY_MAX_MS = 39
PAUSE_MS = 40
INTERRUPTION_MAX_MS = 10
REJECT = "REJECT"
KEYS = tuple("123A456B789C*0#D")
LABELS = KEYS + (REJECT,)
LOW_FREQS = (697.0, 770.0, 852.0, 941.0)
HIGH_FREQS = (1209.0, 1336.0, 1477.0, 1633.0)
ROWS = ("123A", "456B", "789C", "*0#D")
KEY_TO_PAIR = {
    key: (LOW_FREQS[row], HIGH_FREQS[col])
    for row, row_keys in enumerate(ROWS)
    for col, key in enumerate(row_keys)
}
PAIR_TO_KEY = {
    (row, col): ROWS[row][col]
    for row in range(4)
    for col in range(4)
}

SEEDS = {
    "training": 0x51A7C0DE,
    "heldout_clean": 0xC1EA0123,
    "heldout_10db": 0x10DB15A5,
    "negative_controls": 0xBAD0FF5E,
    "gray_duration": 0x233F00D0,
}

# Frozen before held-out evaluation.  Only training examples may choose among
# these candidates.
BLOCK_ENERGY_CANDIDATES = (0.006, 0.010, 0.014, 0.018, 0.022, 0.028)
ENERGY_MIN_CANDIDATES = (0.035, 0.050, 0.065)
DOMINANCE_DB_CANDIDATES = (2.0, 3.0, 4.0, 5.0, 6.0)
TWIST_MIN_DB_CANDIDATES = (-11.0, -10.0, -9.0)
TWIST_MAX_DB_CANDIDATES = (5.0, 6.0, 7.0)
DETUNE_MAX_PCT_CANDIDATES = (1.75, 2.0, 2.25, 2.5)
DETUNE_SCAN_PCT = tuple(-4.0 + 0.25 * i for i in range(33))
NEGATIVE_CATEGORIES = (
    "lone_low",
    "lone_high",
    "two_low",
    "two_high",
    "detuned",
    "twist_low",
    "twist_high",
    "short_duration_le_23ms",
    "insufficient_pause_lt_40ms",
    "noise_only",
)


class LCG:
    """Numerically frozen 32-bit LCG plus Box-Muller normal draws."""

    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF
        self.spare: Optional[float] = None

    def u32(self) -> int:
        self.state = (1664525 * self.state + 1013904223) & 0xFFFFFFFF
        return self.state

    def uniform(self, low: float = 0.0, high: float = 1.0) -> float:
        unit = (self.u32() + 0.5) / 4294967296.0
        return low + (high - low) * unit

    def integer(self, low: int, high: int) -> int:
        """Uniform integer in the inclusive interval [low, high]."""
        return low + self.u32() % (high - low + 1)

    def choice(self, values):
        return values[self.u32() % len(values)]

    def normal(self) -> float:
        if self.spare is not None:
            value, self.spare = self.spare, None
            return value
        u1 = (self.u32() + 0.5) / 4294967296.0
        u2 = (self.u32() + 0.5) / 4294967296.0
        radius = math.sqrt(-2.0 * math.log(u1))
        angle = 2.0 * math.pi * u2
        self.spare = radius * math.sin(angle)
        return radius * math.cos(angle)


@dataclass
class Trial:
    trial_id: str
    split: str
    expected: Optional[str]
    category: str
    samples: list[float]
    received_onset_sample: int
    duration_ms: int
    pause_ms: int
    snr_db: Optional[float]
    channel: bool
    low_offset_pct: Optional[float]
    high_offset_pct: Optional[float]
    twist_db: Optional[float]


@dataclass
class Located:
    start_sample: int
    decision_sample: int
    segment: list[float]


@dataclass
class Features:
    low_index: int
    high_index: int
    low_nominal: float
    high_nominal: float
    low_runner: float
    high_runner: float
    low_peak: float
    high_peak: float
    low_detune_pct: float
    high_detune_pct: float
    low_correlation: tuple[float, float]
    high_correlation: tuple[float, float]
    latency_ms: float


def load_channel_ir() -> list[float]:
    path = Path(__file__).resolve().parent / "clips" / "phone-channel-ir.csv"
    lines = path.read_text(encoding="utf-8").strip().splitlines()[1:]
    return [float(line.split(",", 1)[1]) for line in lines]


CHANNEL_IR = load_channel_ir()


def convolve(signal: list[float], impulse: list[float]) -> list[float]:
    result = [0.0] * (len(signal) + len(impulse) - 1)
    for i, sample in enumerate(signal):
        if sample == 0.0:
            continue
        for j, tap in enumerate(impulse):
            result[i + j] += sample * tap
    return result


def tone_samples(
    duration_ms: int,
    specifications: Iterable[tuple[float, float, float]],
) -> list[float]:
    count = duration_ms * FS // 1000
    specs = tuple(specifications)
    return [
        sum(
            amplitude * math.cos(2.0 * math.pi * frequency * n / FS + phase)
            for frequency, amplitude, phase in specs
        )
        for n in range(count)
    ]


def add_active_snr_noise(
    signal: list[float],
    onset: int,
    duration_samples: int,
    snr_db: Optional[float],
    rng: LCG,
    reference_power: Optional[float] = None,
) -> list[float]:
    if snr_db is None:
        return signal
    active = signal[onset : onset + duration_samples]
    signal_power = (
        reference_power
        if reference_power is not None
        else sum(value * value for value in active) / max(1, len(active))
    )
    noise = [rng.normal() for _ in signal]
    active_noise = noise[onset : onset + duration_samples]
    noise_power = sum(value * value for value in active_noise) / max(1, len(active_noise))
    scale = math.sqrt(signal_power / (10.0 ** (snr_db / 10.0) * noise_power))
    return [value + scale * disturbance for value, disturbance in zip(signal, noise)]


def make_episode(
    rng: LCG,
    trial_id: str,
    split: str,
    expected: Optional[str],
    category: str,
    duration_ms: int,
    pause_ms: int,
    specs: Iterable[tuple[float, float, float]],
    snr_db: Optional[float],
    channel: bool,
    low_offset_pct: Optional[float],
    high_offset_pct: Optional[float],
    twist_db: Optional[float],
    noise_only_power: Optional[float] = None,
) -> Trial:
    onset = pause_ms * FS // 1000
    tone = tone_samples(duration_ms, specs)
    clean = [0.0] * onset + tone + [0.0] * (60 * FS // 1000)
    if channel:
        clean = convolve(clean, CHANNEL_IR)
    noisy = add_active_snr_noise(
        clean,
        onset,
        duration_ms * FS // 1000,
        snr_db,
        rng,
        reference_power=noise_only_power,
    )
    return Trial(
        trial_id=trial_id,
        split=split,
        expected=expected,
        category=category,
        samples=noisy,
        received_onset_sample=onset,
        duration_ms=duration_ms,
        pause_ms=pause_ms,
        snr_db=snr_db,
        channel=channel,
        low_offset_pct=low_offset_pct,
        high_offset_pct=high_offset_pct,
        twist_db=twist_db,
    )


def valid_trial(
    rng: LCG,
    trial_id: str,
    split: str,
    key: str,
    clean: bool = False,
    hard_10db: bool = False,
) -> Trial:
    low, high = KEY_TO_PAIR[key]
    base = rng.uniform(0.26, 0.34)
    if clean:
        low_offset = high_offset = 0.0
        twist = 0.0
        snr = None
        channel = False
        duration = rng.choice((40, 50, 60))
        pause = rng.choice((40, 50))
    else:
        low_offset = rng.uniform(-1.5, 1.5)
        high_offset = rng.uniform(-1.5, 1.5)
        twist = rng.uniform(-8.0, 4.0)
        snr = 10.0 if hard_10db else rng.choice((None, 10.0, 15.0))
        channel = bool(rng.u32() & 1)
        duration = rng.choice((40, 50, 60, 80))
        pause = rng.choice((40, 50, 60))
    phases = (rng.uniform(0.0, 2.0 * math.pi), rng.uniform(0.0, 2.0 * math.pi))
    specifications = (
        (low * (1.0 + low_offset / 100.0), base, phases[0]),
        (high * (1.0 + high_offset / 100.0), base * 10.0 ** (twist / 20.0), phases[1]),
    )
    return make_episode(
        rng,
        trial_id,
        split,
        key,
        "valid_key",
        duration,
        pause,
        specifications,
        snr,
        channel,
        low_offset,
        high_offset,
        twist,
    )


def negative_trial(rng: LCG, trial_id: str, split: str, category: str) -> Trial:
    key = rng.choice(KEYS)
    low, high = KEY_TO_PAIR[key]
    base = rng.uniform(0.26, 0.34)
    low_offset = rng.uniform(-1.0, 1.0)
    high_offset = rng.uniform(-1.0, 1.0)
    twist = rng.uniform(-6.0, 3.0)
    duration = rng.choice((50, 60, 80))
    pause = rng.choice((40, 50, 60))
    snr: Optional[float] = rng.choice((10.0, 15.0))
    channel = bool(rng.u32() & 1)
    phase_low = rng.uniform(0.0, 2.0 * math.pi)
    phase_high = rng.uniform(0.0, 2.0 * math.pi)
    low_amp = base
    high_amp = base * 10.0 ** (twist / 20.0)
    specs: tuple[tuple[float, float, float], ...]
    noise_only_power = None

    if category == "lone_low":
        specs = ((low * (1.0 + low_offset / 100.0), low_amp, phase_low),)
    elif category == "lone_high":
        specs = ((high * (1.0 + high_offset / 100.0), high_amp, phase_high),)
    elif category == "two_low":
        low2 = rng.choice(tuple(f for f in LOW_FREQS if f != low))
        specs = (
            (low * (1.0 + low_offset / 100.0), low_amp, phase_low),
            (low2, low_amp * rng.uniform(0.85, 1.0), rng.uniform(0.0, 2.0 * math.pi)),
            (high * (1.0 + high_offset / 100.0), high_amp, phase_high),
        )
    elif category == "two_high":
        high2 = rng.choice(tuple(f for f in HIGH_FREQS if f != high))
        specs = (
            (low * (1.0 + low_offset / 100.0), low_amp, phase_low),
            (high * (1.0 + high_offset / 100.0), high_amp, phase_high),
            (high2, high_amp * rng.uniform(0.85, 1.0), rng.uniform(0.0, 2.0 * math.pi)),
        )
    elif category == "detuned":
        low_offset = rng.choice((-1.0, 1.0)) * rng.uniform(3.5, 4.0)
        high_offset = rng.choice((-1.0, 1.0)) * rng.uniform(3.5, 4.0)
        specs = (
            (low * (1.0 + low_offset / 100.0), low_amp, phase_low),
            (high * (1.0 + high_offset / 100.0), high_amp, phase_high),
        )
    elif category == "twist_low":
        twist = rng.uniform(-15.0, -11.5)
        high_amp = base * 10.0 ** (twist / 20.0)
        specs = ((low, base, phase_low), (high, high_amp, phase_high))
    elif category == "twist_high":
        twist = rng.uniform(8.0, 12.0)
        high_amp = base * 10.0 ** (twist / 20.0)
        specs = ((low, base, phase_low), (high, high_amp, phase_high))
    elif category == "short_duration_le_23ms":
        duration = rng.integer(10, REJECT_MAX_MS)
        channel = False
        specs = ((low, base, phase_low), (high, high_amp, phase_high))
    elif category == "insufficient_pause_lt_40ms":
        pause = rng.integer(0, PAUSE_MS - 1)
        channel = False
        specs = ((low, base, phase_low), (high, high_amp, phase_high))
    elif category == "noise_only":
        specs = ()
        channel = False
        duration = 60
        # Reference is the active power of two equal 0.30-amplitude tones.
        noise_only_power = 0.09
        snr = 10.0
        low_offset = high_offset = twist = None
    else:
        raise ValueError(category)

    return make_episode(
        rng,
        trial_id,
        split,
        REJECT,
        category,
        duration,
        pause,
        specs,
        snr,
        channel,
        low_offset,
        high_offset,
        twist,
        noise_only_power,
    )


def gray_trial(rng: LCG, trial_id: str) -> Trial:
    key = rng.choice(KEYS)
    low, high = KEY_TO_PAIR[key]
    duration = rng.integer(GRAY_MIN_MS, GRAY_MAX_MS)
    base = rng.uniform(0.26, 0.34)
    low_offset = rng.uniform(-1.5, 1.5)
    high_offset = rng.uniform(-1.5, 1.5)
    twist = rng.uniform(-8.0, 4.0)
    specs = (
        (low * (1.0 + low_offset / 100.0), base, rng.uniform(0.0, 2.0 * math.pi)),
        (
            high * (1.0 + high_offset / 100.0),
            base * 10.0 ** (twist / 20.0),
            rng.uniform(0.0, 2.0 * math.pi),
        ),
    )
    return make_episode(
        rng,
        trial_id,
        "gray_duration",
        None,
        "duration_24_to_39ms_unscored",
        duration,
        rng.choice((40, 50, 60)),
        specs,
        10.0,
        False,
        low_offset,
        high_offset,
        twist,
    )


def make_splits() -> dict[str, list[Trial]]:
    splits: dict[str, list[Trial]] = {}

    rng = LCG(SEEDS["training"])
    training = [
        valid_trial(rng, f"train-key-{key}-{i:03d}", "training", key)
        for key in KEYS
        for i in range(20)
    ]
    training += [
        negative_trial(rng, f"train-{category}-{i:03d}", "training", category)
        for category in NEGATIVE_CATEGORIES
        for i in range(32)
    ]
    splits["training"] = training

    rng = LCG(SEEDS["heldout_clean"])
    splits["heldout_clean"] = [
        valid_trial(rng, f"clean-{key}-{i:03d}", "heldout_clean", key, clean=True)
        for key in KEYS
        for i in range(32)
    ]

    rng = LCG(SEEDS["heldout_10db"])
    splits["heldout_10db_pm1_5pct"] = [
        valid_trial(rng, f"hard-{key}-{i:03d}", "heldout_10db_pm1_5pct", key, hard_10db=True)
        for key in KEYS
        for i in range(64)
    ]

    rng = LCG(SEEDS["negative_controls"])
    splits["negative_controls"] = [
        negative_trial(rng, f"negative-{category}-{i:03d}", "negative_controls", category)
        for category in NEGATIVE_CATEGORIES
        for i in range(64)
    ]

    rng = LCG(SEEDS["gray_duration"])
    splits["gray_duration_excluded"] = [gray_trial(rng, f"gray-{i:03d}") for i in range(128)]
    return splits


def block_energies(samples: list[float]) -> list[float]:
    result = []
    for start in range(0, len(samples) - BLOCK_SAMPLES + 1, BLOCK_SAMPLES):
        block = samples[start : start + BLOCK_SAMPLES]
        result.append(sum(value * value for value in block) / BLOCK_SAMPLES)
    return result


def locate(samples: list[float], threshold: float) -> Optional[Located]:
    quiet_blocks = 0
    active_start: Optional[int] = None
    active_blocks = 0
    inactive_blocks = 0
    block_ms = 1000 * BLOCK_SAMPLES / FS
    required_quiet = math.ceil(PAUSE_MS / block_ms)
    required_span = math.ceil(OPERATE_MS / block_ms)
    max_interruption = math.floor(INTERRUPTION_MAX_MS / block_ms)
    for block_index, energy in enumerate(block_energies(samples)):
        active = energy >= threshold
        if active_start is None:
            if active:
                if quiet_blocks >= required_quiet:
                    active_start = block_index
                    active_blocks = 1
                    inactive_blocks = 0
                quiet_blocks = 0
            else:
                quiet_blocks += 1
            continue

        if active:
            active_blocks += 1
            inactive_blocks = 0
        else:
            inactive_blocks += 1
            if inactive_blocks > max_interruption:
                active_start = None
                active_blocks = 0
                inactive_blocks = 0
                quiet_blocks = 1
                continue

        span_blocks = block_index - active_start + 1
        if span_blocks >= required_span and active_blocks >= required_span - max_interruption:
            start_sample = active_start * BLOCK_SAMPLES
            decision_sample = (block_index + 1) * BLOCK_SAMPLES
            segment = samples[decision_sample - FEATURE_SAMPLES : decision_sample]
            return Located(start_sample, decision_sample, segment)
    return None


KERNELS: dict[float, tuple[tuple[float, ...], tuple[float, ...]]] = {}


def kernel(frequency: float) -> tuple[tuple[float, ...], tuple[float, ...]]:
    key = round(frequency, 12)
    if key not in KERNELS:
        angles = tuple(2.0 * math.pi * frequency * n / FS for n in range(FEATURE_SAMPLES))
        KERNELS[key] = (
            tuple(math.cos(angle) for angle in angles),
            tuple(math.sin(angle) for angle in angles),
        )
    return KERNELS[key]


def correlation(samples: list[float], frequency: float) -> tuple[float, float, float]:
    cosines, sines = kernel(frequency)
    real = sum(value * cosine for value, cosine in zip(samples, cosines))
    imag = -sum(value * sine for value, sine in zip(samples, sines))
    amplitude = 2.0 * math.hypot(real, imag) / len(samples)
    return real, imag, amplitude


def local_peak(samples: list[float], nominal: float) -> tuple[float, float]:
    best_amplitude = -1.0
    best_offset = 0.0
    for offset in DETUNE_SCAN_PCT:
        _, _, amplitude = correlation(samples, nominal * (1.0 + offset / 100.0))
        if amplitude > best_amplitude:
            best_amplitude = amplitude
            best_offset = offset
    return best_amplitude, best_offset


def extract_features(trial: Trial, threshold: float) -> Optional[Features]:
    located = locate(trial.samples, threshold)
    if located is None:
        return None
    low_correlations = [correlation(located.segment, frequency) for frequency in LOW_FREQS]
    high_correlations = [correlation(located.segment, frequency) for frequency in HIGH_FREQS]
    low_order = sorted(range(4), key=lambda index: low_correlations[index][2], reverse=True)
    high_order = sorted(range(4), key=lambda index: high_correlations[index][2], reverse=True)
    low_index, high_index = low_order[0], high_order[0]
    low_peak, low_detune = local_peak(located.segment, LOW_FREQS[low_index])
    high_peak, high_detune = local_peak(located.segment, HIGH_FREQS[high_index])
    return Features(
        low_index=low_index,
        high_index=high_index,
        low_nominal=low_correlations[low_index][2],
        high_nominal=high_correlations[high_index][2],
        low_runner=low_correlations[low_order[1]][2],
        high_runner=high_correlations[high_order[1]][2],
        low_peak=low_peak,
        high_peak=high_peak,
        low_detune_pct=low_detune,
        high_detune_pct=high_detune,
        low_correlation=(low_correlations[low_index][0], low_correlations[low_index][1]),
        high_correlation=(high_correlations[high_index][0], high_correlations[high_index][1]),
        latency_ms=1000.0 * (located.decision_sample - trial.received_onset_sample) / FS,
    )


def safe_db_ratio(numerator: float, denominator: float) -> float:
    return 20.0 * math.log10(max(numerator, 1e-15) / max(denominator, 1e-15))


def decode(features: Optional[Features], thresholds: dict[str, float]) -> tuple[str, str]:
    if features is None:
        return REJECT, "duration_or_pause"
    if min(features.low_peak, features.high_peak) < thresholds["energy_min"]:
        return REJECT, "energy"
    low_dominance = safe_db_ratio(features.low_nominal, features.low_runner)
    high_dominance = safe_db_ratio(features.high_nominal, features.high_runner)
    if min(low_dominance, high_dominance) < thresholds["dominance_db_min"]:
        return REJECT, "dominance"
    twist = safe_db_ratio(features.high_peak, features.low_peak)
    if twist < thresholds["twist_min_db"] or twist > thresholds["twist_max_db"]:
        return REJECT, "twist"
    if max(abs(features.low_detune_pct), abs(features.high_detune_pct)) > thresholds["detune_max_pct"]:
        return REJECT, "detuning"
    return PAIR_TO_KEY[(features.low_index, features.high_index)], "accept"


def calibrate_block_threshold(training: list[Trial]) -> tuple[float, list[dict]]:
    temporal_negative = {"short_duration_le_23ms", "insufficient_pause_lt_40ms", "noise_only"}
    scores = []
    best_threshold = BLOCK_ENERGY_CANDIDATES[0]
    best_rank = (-1.0, -1.0, -1.0)
    for threshold in BLOCK_ENERGY_CANDIDATES:
        positives = [trial for trial in training if trial.expected != REJECT]
        negatives = [trial for trial in training if trial.category in temporal_negative]
        positive_hits = sum(locate(trial.samples, threshold) is not None for trial in positives)
        negative_hits = sum(locate(trial.samples, threshold) is None for trial in negatives)
        positive_rate = positive_hits / len(positives)
        negative_rate = negative_hits / len(negatives)
        balanced = 0.5 * (positive_rate + negative_rate)
        scores.append(
            {
                "threshold": threshold,
                "positive_detection_rate": positive_rate,
                "temporal_negative_rejection_rate": negative_rate,
                "balanced_rate": balanced,
            }
        )
        rank = (balanced, min(positive_rate, negative_rate), negative_rate)
        if rank > best_rank:
            best_rank, best_threshold = rank, threshold
    return best_threshold, scores


def recalls(expected: list[str], predicted: list[str]) -> dict[str, float]:
    values = {}
    for label in LABELS:
        indices = [i for i, value in enumerate(expected) if value == label]
        if indices:
            values[label] = sum(predicted[i] == label for i in indices) / len(indices)
    return values


def calibrate_spectral_thresholds(
    training: list[Trial],
    features: list[Optional[Features]],
) -> tuple[dict[str, float], list[dict]]:
    expected = [trial.expected for trial in training]
    best_thresholds: dict[str, float] = {}
    best_rank = (-1.0, -1.0, -1.0, -1)
    ranked: list[tuple[tuple[float, float, float, int], dict, dict]] = []
    candidate_index = 0
    for energy in ENERGY_MIN_CANDIDATES:
        for dominance in DOMINANCE_DB_CANDIDATES:
            for twist_min in TWIST_MIN_DB_CANDIDATES:
                for twist_max in TWIST_MAX_DB_CANDIDATES:
                    for detune in DETUNE_MAX_PCT_CANDIDATES:
                        thresholds = {
                            "energy_min": energy,
                            "dominance_db_min": dominance,
                            "twist_min_db": twist_min,
                            "twist_max_db": twist_max,
                            "detune_max_pct": detune,
                        }
                        predicted = [decode(feature, thresholds)[0] for feature in features]
                        per_label = recalls(expected, predicted)
                        macro = sum(per_label.values()) / len(per_label)
                        key_indices = [i for i, value in enumerate(expected) if value != REJECT]
                        reject_indices = [i for i, value in enumerate(expected) if value == REJECT]
                        key_accuracy = sum(predicted[i] == expected[i] for i in key_indices) / len(key_indices)
                        reject_accuracy = sum(predicted[i] == REJECT for i in reject_indices) / len(reject_indices)
                        rank = (macro, min(key_accuracy, reject_accuracy), reject_accuracy, -candidate_index)
                        metrics = {
                            "macro_label_recall": macro,
                            "key_accuracy": key_accuracy,
                            "reject_accuracy": reject_accuracy,
                        }
                        ranked.append((rank, thresholds, metrics))
                        if rank > best_rank:
                            best_rank, best_thresholds = rank, thresholds
                        candidate_index += 1
    ranked.sort(key=lambda item: item[0], reverse=True)
    top = [{"thresholds": thresholds, **metrics} for _, thresholds, metrics in ranked[:5]]
    return best_thresholds, top


def confusion(expected: list[str], predicted: list[str]) -> dict:
    raw = [[0 for _ in LABELS] for _ in LABELS]
    for truth, guess in zip(expected, predicted):
        raw[LABELS.index(truth)][LABELS.index(guess)] += 1
    normalized = []
    for row in raw:
        total = sum(row)
        normalized.append([value / total for value in row] if total else [None for _ in row])
    return {
        "label_order": list(LABELS),
        "raw_counts": raw,
        "row_normalized_by_true_label": normalized,
        "normalization": "Each raw row is divided by that true label's row total; absent true labels have null rows.",
    }


def percentile(values: list[float], probability: float) -> Optional[float]:
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * probability
    low = math.floor(index)
    high = math.ceil(index)
    if low == high:
        return ordered[low]
    return ordered[low] * (high - index) + ordered[high] * (index - low)


def summarize(
    trials: list[Trial],
    features: list[Optional[Features]],
    thresholds: dict[str, float],
    scored: bool = True,
) -> tuple[dict, list[str], list[str]]:
    decoded = [decode(feature, thresholds) for feature in features]
    predicted = [item[0] for item in decoded]
    reasons = Counter(item[1] for item in decoded)
    latencies = [feature.latency_ms for feature, guess in zip(features, predicted) if feature and guess != REJECT]
    expected_values = [trial.expected for trial in trials if trial.expected is not None]
    result = {
        "trials": len(trials),
        "scored_trials": len(expected_values) if scored else 0,
        "excluded_trials": 0 if scored else len(trials),
        "expected_counts": dict(sorted(Counter(trial.expected for trial in trials).items(), key=lambda x: str(x[0]))),
        "predicted_counts": dict(sorted(Counter(predicted).items())),
        "decision_reasons": dict(sorted(reasons.items())),
        "receiver_onset_latency_ms": {
            "origin": "first signal-only sample at the receiver input to the decision boundary; rejected trials have no decision latency",
            "count": len(latencies),
            "minimum": min(latencies) if latencies else None,
            "median": percentile(latencies, 0.5),
            "p95": percentile(latencies, 0.95),
            "maximum": max(latencies) if latencies else None,
        },
    }
    if scored:
        correct = sum(trial.expected == guess for trial, guess in zip(trials, predicted))
        result.update(
            {
                "correct": correct,
                "accuracy": correct / len(trials),
                "confusion": confusion(expected_values, predicted),
            }
        )
    else:
        result.update(
            {
                "correct": None,
                "accuracy": None,
                "confusion": None,
                "exclusion_reason": "Durations strictly greater than 23 ms and strictly less than 40 ms are an unspecified profile gray region.",
            }
        )
    return result, expected_values, predicted


def trial_contract(trials: list[Trial]) -> dict:
    return {
        "trials": len(trials),
        "expected_counts": dict(sorted(Counter(t.expected for t in trials).items(), key=lambda x: str(x[0]))),
        "category_counts": dict(sorted(Counter(t.category for t in trials).items())),
        "channel_trials": sum(t.channel for t in trials),
        "snr_counts": dict(sorted(Counter("none" if t.snr_db is None else str(t.snr_db) for t in trials).items())),
        "duration_ms_range": [min(t.duration_ms for t in trials), max(t.duration_ms for t in trials)],
        "pause_ms_range": [min(t.pause_ms for t in trials), max(t.pause_ms for t in trials)],
    }


def feature_example(trial: Trial, feature: Optional[Features]) -> Optional[dict]:
    if feature is None:
        return None
    return {
        "trial_id": trial.trial_id,
        "true_label": trial.expected,
        "low_offset_pct": trial.low_offset_pct,
        "high_offset_pct": trial.high_offset_pct,
        "twist_db": trial.twist_db,
        "low_nominal_correlation_re_im": list(feature.low_correlation),
        "high_nominal_correlation_re_im": list(feature.high_correlation),
        "low_nominal_amplitude": feature.low_nominal,
        "high_nominal_amplitude": feature.high_nominal,
        "estimated_low_detune_pct": feature.low_detune_pct,
        "estimated_high_detune_pct": feature.high_detune_pct,
        "latency_ms": feature.latency_ms,
    }


def main() -> None:
    default_output = (
        Path(__file__).resolve().parents[2]
        / "_pipeline"
        / "lesson-cycles"
        / "phone-channel-dtmf-receiver"
        / "receiver-study.json"
    )
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=default_output)
    args = parser.parse_args()

    splits = make_splits()
    training = splits["training"]
    block_threshold, block_scores = calibrate_block_threshold(training)
    training_features = [extract_features(trial, block_threshold) for trial in training]
    spectral_thresholds, top_training = calibrate_spectral_thresholds(training, training_features)
    thresholds = {"block_energy": block_threshold, **spectral_thresholds}

    evaluations = {}
    all_scored_trials: list[Trial] = []
    all_scored_predictions: list[str] = []
    feature_cache: dict[str, list[Optional[Features]]] = {"training": training_features}
    for name, trials in splits.items():
        features = feature_cache.get(name)
        if features is None:
            features = [extract_features(trial, block_threshold) for trial in trials]
            feature_cache[name] = features
        scored = name != "gray_duration_excluded"
        summary, _, predictions = summarize(trials, features, spectral_thresholds, scored=scored)
        evaluations[name] = summary
        if scored and name != "training":
            all_scored_trials.extend(trials)
            all_scored_predictions.extend(predictions)

    combined_expected = [trial.expected for trial in all_scored_trials]
    combined_correct = sum(
        truth == guess for truth, guess in zip(combined_expected, all_scored_predictions)
    )
    combined = {
        "included_sets": ["heldout_clean", "heldout_10db_pm1_5pct", "negative_controls"],
        "excluded_sets": ["training", "gray_duration_excluded"],
        "trials": len(all_scored_trials),
        "correct": combined_correct,
        "accuracy": combined_correct / len(all_scored_trials),
        "confusion": confusion(combined_expected, all_scored_predictions),
    }

    negative_by_category = {}
    negative_trials = splits["negative_controls"]
    negative_predictions = [decode(feature, spectral_thresholds)[0] for feature in feature_cache["negative_controls"]]
    for category in NEGATIVE_CATEGORIES:
        indices = [i for i, trial in enumerate(negative_trials) if trial.category == category]
        rejected = sum(negative_predictions[i] == REJECT for i in indices)
        negative_by_category[category] = {
            "trials": len(indices),
            "rejected": rejected,
            "rejection_rate": rejected / len(indices),
        }

    clean_accuracy = evaluations["heldout_clean"]["accuracy"]
    hard_accuracy = evaluations["heldout_10db_pm1_5pct"]["accuracy"]
    negative_accuracy = evaluations["negative_controls"]["accuracy"]
    hard_latency = evaluations["heldout_10db_pm1_5pct"]["receiver_onset_latency_ms"]["maximum"]
    findings = [
        f"Held-out clean accuracy is {clean_accuracy:.6%} against the prospective 99% target.",
        f"Held-out 10 dB active-tone-SNR, independent +/-1.5% offset accuracy is {hard_accuracy:.6%} against the prospective 95% target.",
        f"Mandatory negative-control rejection is {negative_accuracy:.6%}.",
        f"Maximum accepted hard-set latency from received-signal onset is {hard_latency:.3f} ms; channel transients and 5 ms onset blocks may exceed the 40 ms prospective target.",
        "Gray-region durations 24-39 ms are reported as output counts but excluded from every conformance accuracy and confusion denominator.",
    ]

    script_path = Path(__file__).resolve()
    channel_path = script_path.parent / "clips" / "phone-channel-ir.csv"
    result = {
        "schema_version": 1,
        "status": "complete_targets_partially_met",
        "study": "deterministic synthetic DTMF receiver study",
        "scope": "Synthetic course receiver and held-out impairment study; not a deployed receiver, acoustic recording, reverberant path, or clipping study.",
        "artifacts": {
            "script": str(script_path.relative_to(script_path.parents[6])),
            "script_sha256": hashlib.sha256(script_path.read_bytes()).hexdigest(),
            "channel_ir": str(channel_path.relative_to(script_path.parents[6])),
            "channel_ir_sha256": hashlib.sha256(channel_path.read_bytes()).hexdigest(),
            "python": platform.python_version(),
            "command": "python3 content/courses/digital-signal-processing/research/data/dtmf-v1/receiver_study.py",
        },
        "frozen_protocol": {
            "sample_rate_hz": FS,
            "receiver_output_labels": list(LABELS),
            "frequencies_hz": {"low": list(LOW_FREQS), "high": list(HIGH_FREQS)},
            "seeds_hex": {name: f"0x{seed:08x}" for name, seed in SEEDS.items()},
            "prng": "Before every uniform draw: s=(1664525*s+1013904223) mod 2^32; u=(s+0.5)/2^32. Gaussian noise uses two successive u values in the Box-Muller transform, with its second normal cached.",
            "independence": "Every valid impaired trial draws low offset, high offset, low phase, high phase, and twist separately from its split's LCG stream. Held-out streams have distinct seeds and are never read during threshold search.",
            "tone_amplitude": "Low-group amplitude is uniform on [0.26,0.34); high-group amplitude equals low amplitude times 10^(twist_dB/20).",
            "active_tone_snr": "One realized Gaussian sequence is normalized so its mean-square over the known source-active interval gives exactly the requested ratio to signal-only mean-square at the receiver input after optional channel convolution; the same noise scale is then applied to the whole episode, including pauses.",
            "channel": "The committed 101-tap synthetic 300-3400 Hz course FIR; it is enabled on a deterministic subset of training, hard held-out, and spectral negative trials.",
            "spectral_measurement": {
                "record": f"last {FEATURE_SAMPLES} samples ({1000 * FEATURE_SAMPLES / FS:g} ms) before temporal qualification",
                "window": "rectangular",
                "nominal_correlations": "C(f)=sum_{n=0}^{159} x[n] exp(-j*2*pi*f*n/8000) evaluated directly at each of the eight physical nominal frequencies; these are not ordinary FFT bins",
                "amplitude": "2*abs(C(f))/160",
                "detuning_probe": "After nominal row/column winners are selected, direct correlations scan physical frequencies from -4% to +4% in 0.25-percentage-point steps around each winner.",
            },
            "temporal_receiver": {
                "block_samples": BLOCK_SAMPLES,
                "block_ms": 1000 * BLOCK_SAMPLES / FS,
                "pause_gate": "at least 40 ms of consecutive sub-threshold 5 ms blocks before onset",
                "duration_gate": "at least a 40 ms candidate span with at least 30 ms above threshold",
                "interruption_gate": "at most 10 ms of consecutive sub-threshold blocks inside a candidate",
                "must_reject_duration_ms": "<=23",
                "must_operate_duration_ms": ">=40 when all other gates pass",
                "gray_duration_ms": "strictly >23 and <40; locally allowed to reject but excluded from conformance scoring",
                "latency_origin": "first signal-only sample at the receiver input; decision is at the boundary of the first qualified 40 ms candidate span",
            },
            "gate_order": ["pause", "duration/interruption", "energy", "dominance", "twist", "detuning", "row-column map or REJECT"],
            "threshold_candidates_frozen_before_evaluation": {
                "block_energy": list(BLOCK_ENERGY_CANDIDATES),
                "energy_min": list(ENERGY_MIN_CANDIDATES),
                "dominance_db_min": list(DOMINANCE_DB_CANDIDATES),
                "twist_min_db": list(TWIST_MIN_DB_CANDIDATES),
                "twist_max_db": list(TWIST_MAX_DB_CANDIDATES),
                "detune_max_pct": list(DETUNE_MAX_PCT_CANDIDATES),
            },
            "threshold_selection": "Training only. First maximize mean positive-detection/temporal-negative-rejection over block-energy candidates. Then maximize 17-label macro recall, tie-breaking by worst of key/reject accuracy, reject accuracy, and finally earliest frozen candidate. No held-out result participates.",
            "confusion_normalization": "Raw 17x17 counts use the frozen label order; each normalized row is divided by its true-label count. Gray trials and training trials are excluded from the combined held-out confusion matrix.",
            "splits": {name: trial_contract(trials) for name, trials in splits.items()},
        },
        "calibration_training_only": {
            "selected_thresholds": thresholds,
            "block_energy_search": block_scores,
            "top_five_spectral_candidates": top_training,
            "training_result": evaluations["training"],
        },
        "heldout_evaluation": {
            name: evaluations[name]
            for name in ("heldout_clean", "heldout_10db_pm1_5pct", "negative_controls", "gray_duration_excluded")
        },
        "negative_controls_by_category": negative_by_category,
        "combined_conformance_heldout": combined,
        "representative_hard_trial_features": feature_example(
            splits["heldout_10db_pm1_5pct"][0], feature_cache["heldout_10db_pm1_5pct"][0]
        ),
        "prospective_target_assessment": {
            "clean_at_least_99_percent": clean_accuracy >= 0.99,
            "ten_db_pm1_5pct_at_least_95_percent": hard_accuracy >= 0.95,
            "accepted_hard_trials_at_most_40ms_from_received_onset": hard_latency is not None and hard_latency <= 40.0,
            "negative_controls_all_rejected": negative_accuracy == 1.0,
            "all_declared_targets_met": (
                clean_accuracy >= 0.99
                and hard_accuracy >= 0.95
                and hard_latency is not None
                and hard_latency <= 40.0
                and negative_accuracy == 1.0
            ),
        },
        "findings": findings,
        "test_data_used_for_threshold_selection": False,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(args.output),
        "selected_thresholds": thresholds,
        "clean_accuracy": clean_accuracy,
        "hard_accuracy": hard_accuracy,
        "negative_rejection": negative_accuracy,
        "hard_max_latency_ms": hard_latency,
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
