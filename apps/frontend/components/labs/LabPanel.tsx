"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { CHIP_CLASS, LABEL_CLASS, buttonClass } from "@/components/ui/styles";
import { useAuth } from "@/lib/auth/store";
import type { LabCheckpoint, LabSpec } from "@/lib/content/schema";
import { day } from "@/lib/day";
import { ApiError } from "@/lib/http";
import { answered } from "@/lib/load";
import {
  getLabManifest,
  getLabProgress,
  issuePairingCode,
  type CheckpointProgress,
  type LabManifest,
  type LabProgress,
  type PairingCode,
} from "@/lib/labs/api";
import { colabUrl } from "@/lib/labs/mirror";

/**
 * The second half of a lab lesson: where the notebook is opened, paired with
 * the reader's account, and where the checkpoints they solve in Colab turn
 * over. The list of checkpoints is content — the lesson's own `lab` block,
 * the same one the index exports — and only the state beside each row is the
 * API's.
 */

/**
 * The work happens in another tab for hours and nothing here is pushed, so the
 * page asks again whenever it is looked at, and on a slow beat while it is.
 */
const POLL_SECONDS = 30;

type States = Map<string, CheckpointProgress>;

function useLabProgress(lab: string, signedIn: boolean): States {
  const [progress, setProgress] = useState<LabProgress | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    const refresh = () => {
      // A hidden tab is a reader in Colab: an answer fetched now is stale
      // before anyone looks at it, and a lab is open for an afternoon.
      if (document.visibilityState !== "visible") return;
      void getLabProgress(lab).then(
        (next) => {
          if (live) setProgress(next);
        },
        // Not `answered`, which reports a failure as "nothing": the next beat
        // is 30 s away, and blanking a checklist over one unreachable request
        // says something false about work the reader has done.
        () => {},
      );
    };

    // The first load is the same request under the same rule, so it is the
    // same call rather than a second path that fails its own way.
    refresh();
    const beat = window.setInterval(refresh, POLL_SECONDS * 1000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      live = false;
      window.clearInterval(beat);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [signedIn, lab]);

  return new Map((progress?.checkpoints ?? []).map((state) => [state.id, state]));
}

/** What a metric checkpoint is measured with, and the bar it has to clear. */
interface Target {
  metric?: string;
  threshold: number;
}

function useTargets(lab: string, wanted: boolean): Map<string, Target> {
  const [manifest, setManifest] = useState<LabManifest | null>(null);

  useEffect(() => {
    if (!wanted) return;
    return answered(getLabManifest(lab), setManifest);
  }, [lab, wanted]);

  return new Map(
    (manifest?.checkpoints ?? []).flatMap((checkpoint) =>
      checkpoint.spec.threshold === undefined
        ? []
        : [
            [
              checkpoint.id,
              { metric: checkpoint.spec.metric, threshold: checkpoint.spec.threshold },
            ] as const,
          ],
    ),
  );
}

function passed(state: CheckpointProgress | undefined): boolean {
  return state !== undefined && state.passed_at !== null;
}

// A metric runs from a probability to an error in the thousands; three
// decimals separate two attempts without printing float noise.
function figure(value: number): string {
  return String(Number(value.toFixed(3)));
}

// Scores travel "higher is better", so an error measure travels negated —
// `app/labs/verify.py` compares one way for every metric. The reader is shown
// the error itself.
const LOWER_IS_BETTER = new Set(["rmse"]);

function score(best: number, target: Target | undefined): string {
  if (target === undefined) return figure(best);
  const sign = LOWER_IS_BETTER.has(target.metric ?? "") ? -1 : 1;
  return `${figure(sign * best)} / ${figure(sign * target.threshold)}`;
}

function standing(
  checkpoint: LabCheckpoint,
  state: CheckpointProgress | undefined,
): string {
  if (state === undefined || state.attempts === 0) return "not attempted";
  if (state.passed_at !== null) return `passed ${day(state.passed_at)}`;
  // A review is judged while the submission is open, so an attempt with no
  // feedback is one the judge never answered. Nothing will answer it later:
  // the notebook has to post it again.
  if (checkpoint.kind === "review" && state.feedback === null) {
    return "not judged — post it again";
  }
  return state.attempts === 1 ? "1 attempt" : `${state.attempts} attempts`;
}

function Checkpoint({
  checkpoint,
  state,
  target,
}: {
  checkpoint: LabCheckpoint;
  state?: CheckpointProgress;
  target?: Target;
}) {
  const best = state?.best_score ?? null;
  const feedback = state?.feedback ?? null;

  return (
    <li className="flex gap-3 border-b border-line/60 py-3 last:border-b-0">
      <span
        aria-hidden
        className={`mt-1.5 size-3 shrink-0 rounded-full border transition-colors duration-(--motion-base) ${
          passed(state) ? "border-accent bg-accent" : "border-faint"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-[0.95rem] leading-snug ${
            checkpoint.required ? "text-ink" : "text-faint"
          }`}
        >
          {checkpoint.text}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={LABEL_CLASS}>{checkpoint.kind}</span>
          {!checkpoint.required && <span className={LABEL_CLASS}>bonus</span>}
          {checkpoint.kind === "metric" && best !== null && (
            <span className="font-mono text-[11px] text-soft">
              {score(best, target)}
            </span>
          )}
          <span className="font-mono text-[11px] text-faint">
            {standing(checkpoint, state)}
          </span>
        </p>
        {feedback !== null && (
          <details className="callout">
            <summary className="callout-label cursor-pointer">Feedback</summary>
            <p className="text-sm leading-relaxed text-soft">{feedback}</p>
          </details>
        )}
      </div>
    </li>
  );
}

/**
 * The paste fallback for pairing: a code issued here and typed into
 * `distill.login("…")` when the approval link the notebook prints is not an
 * option. Same shape as the Telegram code in the settings — one press, the
 * string on screen, and what it is for beside it.
 */
function NotebookCode() {
  const [code, setCode] = useState<PairingCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function issue() {
    setError(null);
    setCopied(false);
    try {
      setCode(await issuePairingCode());
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : "the server is unreachable",
      );
    }
  }

  return (
    <>
      <Button onClick={() => void issue()}>
        {code === null ? "Code for the notebook" : "New code"}
      </Button>
      {error !== null && (
        <p role="alert" className="basis-full text-sm text-accent">
          {error}
        </p>
      )}
      {code !== null && (
        <p className="flex basis-full flex-wrap items-center gap-x-3 gap-y-1">
          <button
            className={`inline-flex ${CHIP_CLASS} px-2 py-1 font-mono`}
            onClick={() =>
              void navigator.clipboard?.writeText(code.code).then(
                () => setCopied(true),
                // A browser that refuses the clipboard — an insecure origin, a
                // denied permission — leaves the code on screen to select by
                // hand. Claiming it was copied when it was not is the only
                // real failure available here.
                () => setCopied(false),
              )
            }
          >
            {code.code}
          </button>
          <span className="text-sm text-faint">
            {copied ? "Copied. " : ""}Run <code>distill.login(&quot;…&quot;)</code>{" "}
            with it in the notebook — the fallback when the login cell&apos;s
            approval link is not an option; it expires at{" "}
            {new Date(code.expires_at).toLocaleTimeString()}.
          </span>
        </p>
      )}
    </>
  );
}

function summary(checkpoints: LabCheckpoint[], states: States): string {
  const done = (list: LabCheckpoint[]) =>
    list.filter((checkpoint) => passed(states.get(checkpoint.id))).length;
  const required = checkpoints.filter((checkpoint) => checkpoint.required);
  const bonus = checkpoints.filter((checkpoint) => !checkpoint.required);
  // Counted apart rather than summed: only the required set decides whether
  // the lesson is done, and a bonus solved must not read as progress towards
  // it.
  const said = [`${done(required)} / ${required.length} required`];
  if (bonus.length > 0) said.push(`${done(bonus)} / ${bonus.length} bonus`);
  return said.join(" · ");
}

export default function LabPanel({ lab, spec }: { lab: string; spec: LabSpec }) {
  const signedIn = useAuth().status === "signed-in";
  const states = useLabProgress(lab, signedIn);
  // Only a signed-in reader can be shown a threshold: it is drawn beside a
  // best score, and a best score comes from progress, which nobody else has.
  const targets = useTargets(
    lab,
    signedIn && spec.checkpoints.some((checkpoint) => checkpoint.kind === "metric"),
  );

  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className={LABEL_CLASS}>Lab</p>
      <p className="mt-1 text-sm text-soft">
        ~{spec.est_hours} h in a notebook of your own. The checkpoints below are
        checked from it.
      </p>
      {/* One row of actions under the line that says what this is, the shape
          the settings page pairs Telegram in. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* The one thing this page is for; every other control here serves it.
            Opened in its own tab because the reader comes back to this one to
            watch the rows turn over. */}
        <a
          href={colabUrl(lab)}
          target="_blank"
          rel="noreferrer"
          className={buttonClass("solid", "md")}
        >
          Open in Colab
        </a>
        {signedIn ? (
          <NotebookCode />
        ) : (
          <span className="text-sm text-faint">
            Sign in to pair a notebook and keep your checkpoints.
          </span>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className={LABEL_CLASS}>Checkpoints</p>
          <p className="font-mono text-[12px] text-faint">
            {summary(spec.checkpoints, states)}
          </p>
        </div>
        <ol className="mt-2">
          {spec.checkpoints.map((checkpoint) => (
            <Checkpoint
              key={checkpoint.id}
              checkpoint={checkpoint}
              state={states.get(checkpoint.id)}
              target={targets.get(checkpoint.id)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
