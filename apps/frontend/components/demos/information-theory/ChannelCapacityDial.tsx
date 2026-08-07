"use client";

/**
 * ChannelCapacityDial — toggle a binary channel between symmetric (BSC),
 * erasure (BEC) and Z, drag the noise parameter, and watch the
 * I(X;Y)-vs-input-bias curve reshape live. Capacity C = max_π I(X;Y) is the
 * peak of that curve, marked at the maximising bias π*: ½ for the BSC and the
 * BEC, strictly below ½ for the Z channel (located from the closed form).
 * Guided tasks (lesson): find the p at which C = 0.5 bits; find the two
 * settings giving C = 1 (p = 0 and p = 1 differ in what the receiver must
 * do); track π* on the Z channel as f rises — it tends to 1/e, not to 0.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button } from "@/components/ui";

type Kind = "BSC" | "BEC" | "Z";

const PRESETS: { label: string; kind: Kind; noise: number }[] = [
  { label: "Noiseless", kind: "BSC", noise: 0 },
  { label: "BSC p=0.1", kind: "BSC", noise: 0.1 },
  { label: "BSC p=0.5", kind: "BSC", noise: 0.5 },
  { label: "BEC e=0.5", kind: "BEC", noise: 0.5 },
  { label: "Z f=0.15", kind: "Z", noise: 0.15 },
];

const AMBER = "#e2903a";

// plot geometry (user units)
const VW = 480;
const VH = 296;
const PX = 52; // plot left
const PW = 396; // plot width
const PY = 20; // plot top
const PH = 216; // plot height (== 1 bit)
const BOTTOM = PY + PH;

function h2(p: number): number {
  const term = (v: number) => (v > 1e-12 ? -v * Math.log2(v) : 0);
  return term(p) + term(1 - p);
}

// I(X;Y) for input bias π = P(X = 1) on the chosen channel.
function infoAt(kind: Kind, noise: number, pi: number): number {
  if (kind === "BSC") {
    const py1 = noise + pi * (1 - 2 * noise); // P(Y = 1)
    return Math.max(0, h2(py1) - h2(noise));
  }
  if (kind === "Z") {
    // only input 1 can produce output 1, and it does so w.p. 1 − f
    return Math.max(0, h2(pi * (1 - noise)) - pi * h2(noise));
  }
  return (1 - noise) * h2(pi); // BEC
}

// Capacity and the input bias that attains it.
function peak(kind: Kind, noise: number): { c: number; pi: number } {
  if (kind === "BSC") return { c: 1 - h2(noise), pi: 0.5 };
  if (kind === "BEC") return { c: 1 - noise, pi: 0.5 };
  const u = 1 - noise; // Z channel
  if (u < 1e-6) return { c: 0, pi: 0.5 };
  const z = 1 / (1 + Math.pow(2, h2(noise) / u)); // optimal OUTPUT bias
  const pi = z / u;
  return { c: h2(z) - pi * h2(noise), pi };
}

const xOf = (pi: number) => PX + pi * PW;
const yOf = (bits: number) => BOTTOM - Math.min(1, bits) * PH;

export default function ChannelCapacityDial() {
  // D3: open on BSC(0.1) — a full inverted-U curve peaking at 0.531 bits.
  const [kind, setKind] = useState<Kind>("BSC");
  const [noise, setNoise] = useState<number>(0.1);

  const { c: capacity, pi: piStar } = peak(kind, noise);
  const cClamped = Math.max(0, capacity);

  const activePreset = PRESETS.findIndex(
    (p) => p.kind === kind && Math.abs(p.noise - noise) < 1e-9,
  );

  // sample the input-bias curve
  const N = 100;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const pi = i / N;
    return `${xOf(pi).toFixed(1)},${yOf(infoAt(kind, noise, pi)).toFixed(1)}`;
  }).join(" ");

  const noiseLabel =
    kind === "BSC" ? "crossover p" : kind === "BEC" ? "erasure e" : "error f";
  const formula =
    kind === "BSC" ? "C = 1 − H(p)" : kind === "BEC" ? "C = 1 − e" : "C = max I(X;Y)";

  const dead = kind === "BSC" && Math.abs(noise - 0.5) < 0.01;
  const perfect = cClamped > 0.995;
  // p = 1 is a deterministic inverter, not a clean wire: same C, different receiver.
  const inverting = kind === "BSC" && noise > 0.5;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setKind(PRESETS[i].kind);
          setNoise(PRESETS[i].noise);
        }}
      />

      <div className="flex flex-wrap gap-2 pb-3">
        <Button active={kind === "BSC"} onClick={() => setKind("BSC")}>
          Symmetric (BSC)
        </Button>
        <Button active={kind === "BEC"} onClick={() => setKind("BEC")}>
          Erasure (BEC)
        </Button>
        <Button active={kind === "Z"} onClick={() => setKind("Z")}>
          Z channel
        </Button>
      </div>

      <Slider
        label={noiseLabel}
        value={noise}
        min={0}
        max={1}
        step={0.01}
        onChange={setNoise}
        display={noise.toFixed(2)}
        ariaLabel={`Channel noise parameter, the ${noiseLabel}`}
      />

      <Readout>
        {formula} = <strong>{cClamped.toFixed(3)} bits per use</strong>, the
        peak of the curve, at input bias π* = {piStar.toFixed(3)}
        {dead && (
          <span className="pl-2 font-medium text-accent">
            output independent of input — C = 0
          </span>
        )}
        {perfect && !inverting && (
          <span className="pl-2 font-medium text-accent">
            clean wire — one full bit per use, received as sent
          </span>
        )}
        {perfect && inverting && (
          <span className="pl-2 font-medium text-accent">
            deterministic inverter — one full bit per use, after the receiver
            flips every symbol
          </span>
        )}
      </Readout>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full select-none"
        role="img"
        aria-label={`${kind} channel at noise ${noise.toFixed(2)}: mutual information over the input bias, peaking at ${cClamped.toFixed(3)} bits at input bias ${piStar.toFixed(3)}, which is the capacity`}
      >
        {/* axes */}
        <line x1={PX} y1={BOTTOM} x2={PX + PW} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        <line x1={PX} y1={PY} x2={PX} y2={BOTTOM} stroke="currentColor" opacity="0.5" />

        {/* y ticks (bits) */}
        {[0, 0.5, 1].map((b) => (
          <g key={`y${b}`}>
            <line x1={PX - 4} y1={yOf(b)} x2={PX} y2={yOf(b)} stroke="currentColor" opacity="0.5" />
            <text x={PX - 8} y={yOf(b) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
              {b.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={PX - 30} y={PY + PH / 2} fontSize="11" fill="currentColor" opacity="0.7" transform={`rotate(-90 ${PX - 30} ${PY + PH / 2})`} textAnchor="middle">
          I(X;Y) bits
        </text>

        {/* x ticks (input bias) */}
        {[0, 0.5, 1].map((pi) => (
          <g key={`x${pi}`}>
            <line x1={xOf(pi)} y1={BOTTOM} x2={xOf(pi)} y2={BOTTOM + 4} stroke="currentColor" opacity="0.5" />
            <text x={xOf(pi)} y={BOTTOM + 17} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {pi.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={PX + PW / 2} y={BOTTOM + 34} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
          input bias π = P(X = 1)
        </text>

        {/* capacity guide + curve */}
        <line x1={PX} y1={yOf(cClamped)} x2={xOf(piStar)} y2={yOf(cClamped)} stroke="currentColor" opacity="0.4" strokeDasharray="3 3" />
        <line x1={xOf(piStar)} y1={BOTTOM} x2={xOf(piStar)} y2={yOf(cClamped)} stroke="currentColor" opacity="0.3" strokeDasharray="3 3" />
        <polyline points={pts} fill="none" stroke={AMBER} strokeWidth="2.5" />

        {/* peak = capacity */}
        <circle cx={xOf(piStar)} cy={yOf(cClamped)} r="4.5" fill={AMBER} />
        <text x={xOf(piStar) + 10} y={yOf(cClamped) - 6} fontSize="12" fontWeight="bold" fill={AMBER}>
          C = {cClamped.toFixed(3)}
        </text>
      </svg>
    </Panel>
  );
}
