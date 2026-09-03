import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * RffIdentityDissected — the random-Fourier-feature unbiasedness identity read
 * term by term (random-features lesson). Line one: the product-to-sum split,
 * one term surviving the phase average and one averaging away. Line two: the
 * frequency average of the survivor is Bochner's integral, i.e. the kernel.
 *
 * Color roles: amber = the shift term that survives, and the kernel it becomes;
 * blue = the phase term the average over b destroys.
 */

const A = ACCENT;
const B = SUPPORT;

const HEAD: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.02em",
  opacity: 0.6,
};

const SHIFT = String.raw`\textcolor{${A}}{\cos\bigl(\omega^\top (x - x')\bigr)}`;
const PHASE = String.raw`\textcolor{${B}}{\cos\bigl(\omega^\top (x + x') + 2b\bigr)}`;

export default function RffIdentityDissected() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      <div style={HEAD}>
        line one — average over the phase <M tex={"b"} size={12.5} />
      </div>
      <div style={{ textAlign: "center", marginTop: -2 }}>
        <M
          display
          size={15}
          tex={String.raw`2\cos(\omega^\top x + b)\,\cos(\omega^\top x' + b) \;=\;
            \underbrace{${SHIFT}}_{\textcolor{${A}}{\substack{\text{depends only on the shift} \\[2pt] \delta \,=\, x - x'}}}
            \;+\;
            \underbrace{${PHASE}}_{\textcolor{${B}}{\substack{\text{phase } 2b \text{ over two periods} \\[2pt] \mathbb{E}_b[\,\cdot\,] \,=\, 0}}}`}
        />
      </div>

      <div style={{ ...HEAD, marginTop: 14 }}>
        line two — average over the frequency <M tex={String.raw`\omega`} size={12.5} />
      </div>

      {/* the annotation sits above the integrand and points down onto p(ω) */}
      <div style={{ position: "relative", marginTop: 2, height: 28 }}>
        <div
          style={{
            position: "absolute",
            left: 176,
            top: 0,
            fontSize: 12.5,
            color: A,
            lineHeight: 1.35,
          }}
        >
          the kernel&rsquo;s spectral density (Bochner)
        </div>
        <svg
          viewBox="0 0 40 24"
          width="40"
          height="24"
          aria-hidden="true"
          style={{ position: "absolute", left: 314, top: 14, overflow: "visible" }}
        >
          <path
            d="M2 2 C 2 14, 10 12, 14 20"
            fill="none"
            stroke={A}
            strokeWidth="1.2"
            opacity="0.85"
          />
          <path d="M14 21 L 10.5 15.5 L 17 15 Z" fill={A} opacity="0.85" />
        </svg>
      </div>

      <div style={{ textAlign: "center", marginTop: -14 }}>
        <M
          display
          size={16}
          tex={String.raw`\mathbb{E}_{\omega}\bigl[\textcolor{${A}}{\cos(\omega^\top \delta)}\bigr] \;=\;
            \int p(\omega)\,\cos(\omega^\top \delta)\, d\omega \;=\;
            \textcolor{${A}}{\boxed{\textcolor{${A}}{k(\delta)}}}`}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          marginTop: 8,
        }}
      >
        <div style={{ fontSize: 12.5, opacity: 0.6, lineHeight: 1.45, maxWidth: 240 }}>
          the left-hand side is one unit evaluated twice — at <M tex={"x"} size={12.5} /> and{" "}
          <M tex={"x'"} size={12.5} />
        </div>
        <div
          style={{
            border: `1.4px solid ${A}`,
            borderRadius: 6,
            padding: "8px 14px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontSize: 12, color: A, fontWeight: 600 }}>one random hidden unit</div>
          <M tex={String.raw`z_{\omega,b}(x) = \sqrt{2}\,\cos(\omega^\top x + b)`} size={13.5} />
        </div>
      </div>
    </div>
  );
}
