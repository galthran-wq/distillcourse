"use client";

/**
 * HammingSyndrome — flip bits in the transmitted (7,4) codeword 1011001 and
 * watch the three parity circles, the syndrome, and the decoder's verdict
 * respond. Guided task (lesson prose): from "one error", confirm any single
 * flip is repaired; then add a second flip and watch the decoder name an
 * untouched bit and land on a legal codeword three flips from the one sent.
 * A ledger counts the two-bit patterns tried and how many left the message
 * intact (none of the 21 do).
 */
import { useState } from "react";
import { Panel, PresetGroup, Button, Readout } from "@/components/ui";

const SENT = [1, 0, 1, 1, 0, 0, 1]; // c = 1011001, message 1011
/** Columns of H: which of the three checks each bit sits in. */
const H = [[1, 0, 1], [1, 1, 0], [1, 1, 1], [0, 1, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1]];
/** Bit slots and circle centres, copied from the lesson's circle figures. */
const POS = [[185, 145], [295, 145], [240, 177], [240, 228], [240, 95], [330, 232], [150, 232]];
const CIRCLES = [[240, 120], [290, 205], [190, 205]];
const SUB = ["₁", "₂", "₃", "₄", "₅", "₆", "₇"];
const PRESETS = [
  { label: "clean codeword", e: [] as number[] },
  { label: "one error", e: [1] },
  { label: "two errors", e: [2, 6] },
];
const ACCENT = "#e2903a"; // decoder's suspect bit, violated checks
const FLIP = "#4c8dd6"; // bits the channel (i.e. the reader) actually flipped

function toFlips(e: number[]): boolean[] {
  return SENT.map((_, i) => e.includes(i));
}

function decode(e: boolean[]) {
  const r = SENT.map((b, i) => (e[i] ? b ^ 1 : b));
  const z = [0, 1, 2].map((k) => r.reduce((s, b, i) => s ^ (b & H[i][k]), 0));
  const suspect = H.findIndex((col) => col.every((v, k) => v === z[k]));
  const decoded = r.map((b, i) => (i === suspect ? b ^ 1 : b));
  const dist = decoded.reduce((d, b, i) => d + (b === SENT[i] ? 0 : 1), 0);
  const msgOk = decoded.slice(0, 4).every((b, i) => b === SENT[i]);
  return { r, z, suspect, decoded, dist, msgOk };
}

function Bits(props: { bits: number[]; marks: boolean[]; color: string }) {
  const { bits, marks, color } = props;
  return (
    <strong className="font-mono">
      {bits.map((b, i) => (
        <span key={`b${i}`} style={marks[i] ? { color } : undefined}>
          {b}
        </span>
      ))}
    </strong>
  );
}

export default function HammingSyndrome() {
  // D3: open on a live single error — two circles already dashed, the
  // decoder already pointing at the bit the channel flipped.
  const [flips, setFlips] = useState<boolean[]>(() => toFlips(PRESETS[1].e));
  const [tried, setTried] = useState<string[]>([]);

  const on = flips.flatMap((f, i) => (f ? [i] : []));
  const { r, z, suspect, decoded, dist, msgOk } = decode(flips);
  const intact = tried.filter((k) =>
    decode(toFlips(k.split("-").map(Number))).msgOk,
  ).length;
  const activePreset = PRESETS.findIndex((p) =>
    toFlips(p.e).every((f, i) => f === flips[i]),
  );

  // Record every two-bit pattern the reader visits — the ledger the task asks
  // them to report from.
  function apply(next: boolean[]) {
    setFlips(next);
    const hits = next.flatMap((f, i) => (f ? [i] : []));
    if (hits.length === 2) {
      const key = hits.join("-");
      setTried((t) => (t.includes(key) ? t : [...t, key]));
    }
  }

  const verdict =
    on.length === 0
      ? "all three checks pass — nothing to correct"
      : suspect === -1
        ? "syndrome 000 — the decoder sees no error at all"
        : on.length === 1
          ? `corrected: the decoder flipped c${SUB[suspect]} back, so the decoded block is the one sent`
          : `miscorrected: c${SUB[suspect]} was never touched, yet the decoded block is a legal codeword — ${dist} flips from the one sent`;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => apply(toFlips(PRESETS[i].e))}
      />

      <div className="flex flex-wrap gap-2 pb-2">
        {flips.map((f, i) => (
          <Button
            key={`f${i}`}
            active={f}
            onClick={() => apply(flips.map((v, j) => (j === i ? !v : v)))}
            aria-label={`Flip bit ${i + 1}, currently ${r[i]}${f ? ", flipped by the channel" : ""}`}
          >
            <span className="font-mono">
              c{SUB[i]} = {r[i]}
            </span>
          </Button>
        ))}
      </div>

      <Readout>
        sent <Bits bits={SENT} marks={SENT.map(() => false)} color={FLIP} />{" "}
        &rarr; received <Bits bits={r} marks={flips} color={FLIP} /> &middot;
        syndrome z = <strong className="font-mono">{z.join("")}</strong>{" "}
        &rarr;{" "}
        <strong>
          {suspect === -1 ? "no error" : `flip position ${suspect + 1}`}
        </strong>
      </Readout>

      <Readout>
        decoded{" "}
        <Bits
          bits={decoded}
          marks={decoded.map((b, i) => b !== SENT[i])}
          color={ACCENT}
        />{" "}
        &middot; message{" "}
        <strong className="font-mono">{decoded.slice(0, 4).join("")}</strong>{" "}
        {msgOk ? "= 1011" : "≠ 1011"}
        <span className="pl-2 font-medium text-accent">{verdict}</span>
      </Readout>

      {tried.length > 0 && (
        <Readout>
          two-bit patterns tried: <strong>{tried.length} of 21</strong> &middot;
          message recovered in <strong>{intact}</strong> of them
        </Readout>
      )}

      <svg
        viewBox="0 0 480 310"
        className="mt-2 w-full"
        role="img"
        aria-label={`Received word ${r.join("")}; syndrome ${z.join("")}; decoded ${decoded.join("")}; ${verdict}`}
      >
        <text x="12" y="14" fontSize="11" fill="currentColor" opacity="0.6">
          dashed = check violated &middot; blue = bit the channel flipped
          &middot; orange ring = decoder&apos;s suspect
        </text>

        {CIRCLES.map(([cx, cy], k) => (
          <circle
            key={`k${k}`}
            cx={cx}
            cy={cy}
            r="90"
            fill="none"
            stroke={z[k] ? ACCENT : "currentColor"}
            strokeOpacity={z[k] ? 1 : 0.4}
            strokeWidth={z[k] ? 2.6 : 1.6}
            strokeDasharray={z[k] ? "6 4" : undefined}
          />
        ))}

        {/* per-check status, in the space to the right of the circles */}
        {z.map((zk, k) => (
          <g key={`z${k}`} fill={zk ? ACCENT : "currentColor"} opacity={zk ? 1 : 0.55}>
            <text x="386" y={112 + k * 40} fontSize="12">
              check {k + 1}
            </text>
            <text x="386" y={128 + k * 40} fontSize="12" fontFamily="monospace">
              z{SUB[k]} = {zk} {zk ? "✗" : "✓"}
            </text>
          </g>
        ))}

        {POS.map(([x, y], i) => (
          <g key={`p${i}`}>
            {i === suspect && (
              <circle cx={x} cy={y} r="19" fill="none" stroke={ACCENT} strokeWidth="2" strokeDasharray="3 3" />
            )}
            <circle
              cx={x}
              cy={y}
              r="13"
              fill="none"
              stroke={flips[i] ? FLIP : "currentColor"}
              strokeOpacity={flips[i] ? 1 : 0.45}
              strokeWidth={flips[i] ? 2.2 : 1.2}
            />
            <text
              x={x}
              y={y + 4.5}
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill={flips[i] ? FLIP : "currentColor"}
            >
              {r[i]}
            </text>
            <text x={x + 20} y={y + 4} fontSize="11.5" fill="currentColor" opacity="0.55">
              c{SUB[i]}
            </text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}
