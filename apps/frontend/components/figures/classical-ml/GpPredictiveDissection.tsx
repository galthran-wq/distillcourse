import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * The GP predictive equations dissected: the mean as a weighted vote of the
 * targets (the smoother kinship), the variance as prior minus information —
 * with the fact that y never enters the variance. Amber = kernel quantities;
 * blue = the observed targets.
 */

export default function GpPredictiveDissection() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 680,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontWeight: 600 }}>the mean: a weighted vote of the targets</div>
      <M
        display
        tex={String.raw`\bar f_* \;=\; \textcolor{${ACCENT}}{\mathbf{k}_*^\top (K + \sigma_n^2 I)^{-1}}\, \textcolor{${SUPPORT}}{y} \;=\; \sum_{i=1}^{n} \underbrace{\textcolor{${ACCENT}}{w_i(x_*)}}_{\text{kernel and inputs only}} \, \textcolor{${SUPPORT}}{y_i}`}
      />
      <div style={labelMuted}>
        a linear smoother in the targets — kernel smoothing&rsquo;s form, with weights the
        kernel and the noise level set jointly
      </div>

      <div style={{ fontWeight: 600, marginTop: 10 }}>the variance: prior minus information</div>
      <M
        display
        tex={String.raw`\mathbb{V}[f_*] \;=\; \underbrace{\textcolor{${ACCENT}}{k(x_*, x_*)}}_{\text{prior variance at } x_*} \;-\; \underbrace{\textcolor{${ACCENT}}{\mathbf{k}_*^\top (K + \sigma_n^2 I)^{-1} \mathbf{k}_*}}_{\substack{\text{what the observations at } X \\ \text{reveal about } f(x_*) \;(\ge\, 0)}}`}
      />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 2 }}>
        <span style={labelMuted}>
          at a training point: the subtraction nearly cancels the prior — the band pinches
        </span>
        <span style={labelMuted}>
          far from all data: <M tex={String.raw`\textcolor{${ACCENT}}{\mathbf{k}_*} \to 0`} size={13} /> — the
          prior returns
        </span>
      </div>
      <div style={{ ...labelMuted, marginTop: 2 }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{y}`} size={13} /> never enters the variance:
        error bars depend on where you measured, not on what you measured
      </div>
    </div>
  );
}
