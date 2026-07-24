"use client";

/**
 * KLMismatch — drag the true distribution p (blue) and the model q (amber);
 * H(p), the cross-entropy H(p,q), and the gap D(p||q) respond live. The
 * stacked cost bar splits H(p,q) into the entropy floor plus the divergence;
 * driving q(x) to 0 where p(x) > 0 sends D to infinity (lesson: kl-divergence).
 */
import { useRef, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

type Dist = [number, number, number, number];

const RUNNING: Dist = [0.5, 0.25, 0.15, 0.1];
const PRESETS: { label: string; p: Dist; q: Dist }[] = [
  { label: "Perfect model", p: RUNNING, q: [0.5, 0.25, 0.15, 0.1] },
  { label: "Overconfident model", p: RUNNING, q: [0.8, 0.1, 0.05, 0.05] },
  { label: "Missing-outcome disaster", p: RUNNING, q: [0.5, 0.3, 0.2, 0] },
];

const OUTCOMES = ["A", "B", "C", "D"] as const;
const BLUE = "#4c8dd6"; // truth p (house palette: blue = the true distribution)
const AMBER = "#e2903a"; // model q / divergence segment
const WARN = "#c0392b"; // the infinite penalty only

// bar-chart geometry (SVG user units); BITS_MAX = cost-bar axis ceiling
const VW = 480, VH = 218, X0 = 40, X1 = 470, Y_TOP = 16, Y_BASE = 196;
const SLOT = (X1 - X0) / 4, BAR_W = SLOT * 0.3, BITS_MAX = 4;

const yOf = (v: number) => Y_BASE - v * (Y_BASE - Y_TOP);
const xBits = (b: number) => X0 + (Math.min(b, BITS_MAX) / BITS_MAX) * (X1 - X0);

function entropy(p: Dist): number {
  return p.reduce((h, v) => (v > 0 ? h - v * Math.log2(v) : h), 0);
}
// -sum p log2 q; +Infinity exactly when q(x)=0 while p(x)>0.
function crossEntropy(p: Dist, q: Dist): number {
  return p.reduce((h, v, i) => (v > 0 ? h - v * Math.log2(q[i]) : h), 0);
}

export default function KLMismatch() {
  // D3: open on the lesson's running example — the uniform model paying
  // H(p,q) = 2.000 against the floor H(p) = 1.743, gap 0.257 bits visible.
  const [p, setP] = useState<Dist>(RUNNING);
  const [q, setQ] = useState<Dist>([0.25, 0.25, 0.25, 0.25]);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ dist: 0 | 1; idx: number } | null>(null);

  // Set one outcome and renormalize the rest proportionally (sum stays 1).
  function setVal(dist: 0 | 1, i: number, t: number) {
    (dist === 0 ? setP : setQ)((prev) => {
      const v = Math.min(1, Math.max(0, Math.round(t * 100) / 100));
      const rest = 1 - prev[i];
      return prev.map((w, j) =>
        j === i ? v : rest > 1e-9 ? (w / rest) * (1 - v) : (1 - v) / 3,
      ) as Dist;
    });
  }

  function dragTo(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = ((e.clientX - rect.left) / rect.width) * VW;
    const sy = ((e.clientY - rect.top) / rect.height) * VH;
    if (!drag.current) {
      const idx = Math.min(3, Math.max(0, Math.floor((sx - X0) / SLOT)));
      const dist = sx - X0 - idx * SLOT < SLOT / 2 ? 0 : 1;
      drag.current = { dist, idx };
    }
    setVal(drag.current.dist, drag.current.idx, (Y_BASE - sy) / (Y_BASE - Y_TOP));
  }

  const Hp = entropy(p);
  const Hpq = crossEntropy(p, q);
  const infinite = !Number.isFinite(Hpq);
  const D = Math.max(0, Hpq - Hp); // Gibbs: never negative (guards float dust)
  const perfect = !infinite && D < 0.005;
  const activePreset = PRESETS.findIndex(
    (pr) =>
      pr.p.every((v, i) => Math.abs(v - p[i]) < 1e-9) &&
      pr.q.every((v, i) => Math.abs(v - q[i]) < 1e-9),
  );

  const xHp = xBits(Hp);
  const xHpq = infinite ? X1 : xBits(Hpq);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setP(PRESETS[i].p);
          setQ(PRESETS[i].q);
        }}
      />

      <Readout>
        H(p) = <strong>{Hp.toFixed(3)}</strong> &middot; H(p,q) ={" "}
        <strong>{infinite ? "∞" : Hpq.toFixed(3)}</strong> &middot; D(p&#8214;q) ={" "}
        <strong>{infinite ? "∞" : `${D.toFixed(3)} bits`}</strong>
        {perfect && (
          <span className="pl-2 font-medium text-accent">
            q = p: Gibbs&rsquo; equality — H(p,q) = H(p), no extra bits
          </span>
        )}
        {infinite && (
          <span className="pl-2 font-medium" style={{ color: WARN }}>
            q(x) = 0 where p(x) &gt; 0: no codeword for a real outcome
          </span>
        )}
      </Readout>

      {/* cost bar: cross-entropy = blue entropy floor + amber divergence */}
      <svg
        viewBox={`0 0 ${VW} 64`}
        className="mt-1 w-full"
        role="img"
        aria-label={`Coding cost bar: entropy floor ${Hp.toFixed(3)} bits plus divergence ${infinite ? "infinity" : D.toFixed(3)}`}
      >
        <rect x={X0} y={16} width={xHp - X0} height={20} rx="2" fill={BLUE} />
        {xHpq - xHp > 0.5 && (
          <rect x={xHp} y={16} width={xHpq - xHp} height={20} fill={infinite ? WARN : AMBER} />
        )}
        {[0, 1, 2, 3, 4].map((b) => (
          <g key={b}>
            <line x1={xBits(b)} y1={36} x2={xBits(b)} y2={40} stroke="currentColor" />
            <text x={xBits(b)} y={52} textAnchor="middle" fontSize="10" fill="currentColor">
              {b === 4 ? "4 bits" : b}
            </text>
          </g>
        ))}
        <text x={(X0 + xHp) / 2} y={11} textAnchor="middle" fontSize="11" fill="currentColor">
          H(p)
        </text>
        {(infinite || D > 0.1) && (
          <text x={Math.min((xHp + xHpq) / 2, X1 - 20)} y={11} textAnchor="middle" fontSize="11" fill="currentColor">
            D(p&#8214;q){infinite ? " → ∞" : ""}
          </text>
        )}
        {!infinite && Hpq > BITS_MAX && (
          <text x={X1} y={31} textAnchor="end" fontSize="11" fontWeight="bold" fill="#fff">
            → {Hpq.toFixed(1)}
          </text>
        )}
      </svg>

      {/* grouped bars: per outcome, blue p (left) and amber q (right), draggable */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`Paired bars per outcome: ${p.map((v, i) => `${OUTCOMES[i]} true ${v.toFixed(2)} model ${q[i].toFixed(2)}`).join(", ")}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = null;
          dragTo(e);
        }}
        onPointerMove={(e) => {
          if (drag.current) dragTo(e);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <line x1={X0} y1={Y_TOP} x2={X0} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={X0 - 4} y1={yOf(t)} x2={X0} y2={yOf(t)} stroke="currentColor" />
            <text x={X0 - 7} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="currentColor">
              {t}
            </text>
          </g>
        ))}
        <rect x={X0 + 6} y={Y_TOP} width="10" height="10" fill={BLUE} />
        <text x={X0 + 20} y={Y_TOP + 9} fontSize="11" fill="currentColor">true p</text>
        <rect x={X0 + 66} y={Y_TOP} width="10" height="10" fill={AMBER} />
        <text x={X0 + 80} y={Y_TOP + 9} fontSize="11" fill="currentColor">model q</text>
        {OUTCOMES.map((name, i) => {
          const cx = X0 + SLOT * (i + 0.5);
          return (
            <g key={name} style={{ cursor: "ns-resize" }}>
              <rect x={cx - SLOT / 2} y={Y_TOP} width={SLOT} height={Y_BASE - Y_TOP} fill="transparent" />
              {([p[i], q[i]] as const).map((v, d) => {
                const bx = cx + (d === 0 ? -1 : 1) * SLOT * 0.19 - BAR_W / 2;
                return (
                  <g key={d}>
                    <rect x={bx} y={yOf(v)} width={BAR_W} height={Y_BASE - yOf(v)} rx="2" fill={d === 0 ? BLUE : AMBER} />
                    <text x={bx + BAR_W / 2} y={yOf(v) - 4} textAnchor="middle" fontSize="10" fill="currentColor">
                      {v.toFixed(2)}
                    </text>
                  </g>
                );
              })}
              <text x={cx} y={Y_BASE + 16} textAnchor="middle" fontSize="12" fill="currentColor">
                {name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* keyboard path: native sliders, same renormalization as dragging */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {OUTCOMES.map((name, i) => (
          <Slider key={`p${name}`} label={`p(${name})`} value={p[i]} min={0} max={1} step={0.01}
            onChange={(t) => setVal(0, i, t)} display={p[i].toFixed(2)}
            ariaLabel={`True probability of outcome ${name}`} />
        ))}
        {OUTCOMES.map((name, i) => (
          <Slider key={`q${name}`} label={`q(${name})`} value={q[i]} min={0} max={1} step={0.01}
            onChange={(t) => setVal(1, i, t)} display={q[i].toFixed(2)}
            ariaLabel={`Model probability of outcome ${name}`} />
        ))}
      </div>
    </Panel>
  );
}
