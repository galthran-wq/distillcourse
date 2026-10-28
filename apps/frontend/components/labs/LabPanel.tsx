"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import HowLabsWork from "@/components/labs/HowLabsWork";
import { LABEL_CLASS, LINK_CLASS, buttonClass } from "@/components/ui/styles";
import { useAuth, type AuthState } from "@/lib/auth/store";
import type { LabCheckpoint, LabSpec } from "@/lib/content/schema";
import { day } from "@/lib/day";
import { answered } from "@/lib/load";
import {
  getLabManifest,
  getLabProgress,
  type CheckpointProgress,
  type LabManifest,
  type LabProgress,
} from "@/lib/labs/api";
import { colabUrl } from "@/lib/labs/mirror";

/**
 * A lab lesson's working surface, under its header: where the notebook is
 * opened, whether one is paired with the reader's account, and the checkpoints
 * they solve in it. The list of checkpoints is content — the lesson's own
 * `lab` block, the same one the index exports — and only the state beside each
 * row is the API's.
 */

/**
 * The work happens in another tab for hours and nothing here is pushed, so the
 * page asks again whenever it is looked at, and on a slow beat while it is.
 */
const POLL_SECONDS = 30;

function useLabProgress(lab: string, signedIn: boolean): LabProgress | null {
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

  return signedIn ? progress : null;
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

const CHECKLIST_KEY = "distillcourse.lab-checklist:";
// Tailwind's `sm`: below it the list would push the brief a screen down.
const WIDE = "(min-width: 40rem)";

const never = () => () => {};

/**
 * Whether the checklist is open: what the reader last chose for this lab, else
 * open where there is room for it. The server cannot know either, so it draws
 * the list closed and the browser's answer arrives straight after hydration —
 * a phone never sees the list open and then jump shut.
 */
function useChecklistOpen(lab: string): [boolean, () => void] {
  const key = CHECKLIST_KEY + lab;
  const remembered = useSyncExternalStore(
    never,
    () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(key);
      } catch {
        // Storage refused (a private window, blocked site data): the width
        // decides, as it does before the reader has chosen.
      }
      if (stored === "open" || stored === "closed") return stored === "open";
      return window.matchMedia(WIDE).matches;
    },
    () => false,
  );
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? remembered;

  function toggle() {
    setChosen(!open);
    try {
      window.localStorage.setItem(key, open ? "closed" : "open");
    } catch {
      // Not remembered past this page; the list still turns over.
    }
  }

  return [open, toggle];
}

type Standing = "passed" | "failed" | "pending" | "untouched";

function standingOf(
  checkpoint: LabCheckpoint,
  state: CheckpointProgress | undefined,
): Standing {
  if (state === undefined || state.attempts === 0) return "untouched";
  if (state.passed_at !== null) return "passed";
  // A review is judged while the submission is open, so an attempt with no
  // feedback is one the judge never answered. Nothing will answer it later:
  // the notebook has to post it again.
  if (checkpoint.kind === "review" && state.feedback === null) return "pending";
  return "failed";
}

const STATUS_TONE: Record<Standing, string> = {
  passed: "text-soft",
  failed: "font-semibold text-accent",
  pending: "italic text-ink",
  // The empty ring already says it where the row has no room for the words.
  untouched: "text-faint max-sm:hidden",
};

function status(standing: Standing, state: CheckpointProgress | undefined): string {
  if (standing === "passed" && state?.passed_at) {
    const at = new Date(state.passed_at);
    return `passed ${day(at, at.getFullYear() !== new Date().getFullYear())}`;
  }
  if (standing === "failed" && state !== undefined) {
    return `failed · ${state.attempts === 1 ? "1 attempt" : `${state.attempts} attempts`}`;
  }
  if (standing === "pending") return "not judged — post it again";
  return "not attempted";
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

function shown(value: number, target: Target | undefined): string {
  return figure(LOWER_IS_BETTER.has(target?.metric ?? "") ? -value : value);
}

// `exact` is what a checkpoint is unless it says otherwise, so only the other
// two kinds are named.
function kindLabel(
  checkpoint: LabCheckpoint,
  best: number | null,
  target: Target | undefined,
): string | null {
  if (checkpoint.kind === "review") return "review";
  if (checkpoint.kind !== "metric") return null;
  if (best !== null) {
    return target === undefined
      ? `metric · ${shown(best, target)}`
      : `metric · ${shown(best, target)} / ${shown(target.threshold, target)}`;
  }
  return target === undefined ? "metric" : `metric · bar ${shown(target.threshold, target)}`;
}

function Checkpoint({
  checkpoint,
  state,
  target,
  known,
}: {
  checkpoint: LabCheckpoint;
  state?: CheckpointProgress;
  target?: Target;
  /** False until there is progress to show — for nobody, or not yet: the rows
      stand bare rather than claim that nothing was attempted. */
  known: boolean;
}) {
  const standing = standingOf(checkpoint, state);
  const kind = kindLabel(checkpoint, state?.best_score ?? null, target);
  const feedback = state?.feedback ?? null;
  // A failed row says why; a passed review keeps what the judge said of it.
  // A passed exact or metric row does not: its stored feedback is the hint of
  // whatever later attempt failed, and the pass is what stands.
  const note =
    feedback !== null &&
    (standing === "failed" || (standing === "passed" && checkpoint.kind === "review"));

  return (
    <li className="grid grid-cols-[1rem_minmax(0,1fr)_auto] gap-x-3 border-t border-line py-[0.6rem] max-sm:grid-cols-[1rem_minmax(0,1fr)]">
      <span aria-hidden className="lab-mark" data-state={standing} />
      <p className="text-[0.95rem] leading-[1.42] text-ink">
        {checkpoint.text}
        {kind !== null && (
          <span className="ml-2 whitespace-nowrap text-[12.5px] text-faint">{kind}</span>
        )}
      </p>
      <p className="flex flex-col items-end gap-[0.15rem] whitespace-nowrap pt-[0.1rem] text-right text-[13px] leading-[1.42] tabular-nums max-sm:col-start-2 max-sm:flex-row max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-3 max-sm:pt-[0.2rem] max-sm:text-[12.5px]">
        {known && <span className={STATUS_TONE[standing]}>{status(standing, state)}</span>}
        <code className="font-mono text-[11.5px] text-faint">{checkpoint.id}</code>
      </p>
      {note && (
        <p
          className={`col-[2/-1] mt-[0.4rem] border-l-2 pl-[0.7rem] text-[0.88rem] leading-[1.45] text-soft ${
            standing === "failed" ? "border-accent" : "border-line"
          }`}
        >
          {feedback}
        </p>
      )}
    </li>
  );
}

function Pairing({
  who,
  progress,
}: {
  who: AuthState["status"];
  progress: LabProgress | null;
}) {
  if (who === "anonymous") {
    return (
      <span>
        <Link href="/login" className={LINK_CLASS}>
          Sign in
        </Link>{" "}
        to pair a notebook and keep your checkpoints.
      </span>
    );
  }
  // Nothing until the API has said: a paired reader must not be told first
  // that nothing is.
  if (progress === null) return null;
  if (!progress.paired) return <span>No notebook paired yet</span>;
  return (
    <span className="inline-flex items-center gap-[0.45rem]">
      <span aria-hidden className="size-[0.45rem] rounded-full bg-accent" />
      Notebook paired
    </span>
  );
}

const COUNT = "text-[13px] font-medium tabular-nums text-soft max-sm:text-[12.5px]";

export default function LabPanel({ lab, spec }: { lab: string; spec: LabSpec }) {
  const auth = useAuth();
  const signedIn = auth.status === "signed-in";
  const progress = useLabProgress(lab, signedIn);
  const targets = useTargets(
    lab,
    spec.checkpoints.some((checkpoint) => checkpoint.kind === "metric"),
  );
  const [open, toggle] = useChecklistOpen(lab);

  const states = new Map((progress?.checkpoints ?? []).map((state) => [state.id, state]));
  const required = spec.checkpoints.filter((checkpoint) => checkpoint.required);
  const bonus = spec.checkpoints.filter((checkpoint) => !checkpoint.required);
  const count = (list: LabCheckpoint[], standing: Standing) =>
    list.filter((checkpoint) => standingOf(checkpoint, states.get(checkpoint.id)) === standing)
      .length;
  const failed = count(spec.checkpoints, "failed");

  const rows = (list: LabCheckpoint[]) => (
    <ol>
      {list.map((checkpoint) => (
        <Checkpoint
          key={checkpoint.id}
          checkpoint={checkpoint}
          state={states.get(checkpoint.id)}
          target={targets.get(checkpoint.id)}
          known={progress !== null}
        />
      ))}
    </ol>
  );

  return (
    <section aria-label="Lab" className="border-b border-line pt-[1.4rem] pb-[0.4rem]">
      <div className="flex flex-wrap items-center gap-x-[1.4rem] gap-y-[0.6rem]">
        {/* The one thing this page is for. Opened in its own tab because the
            reader comes back to this one to watch the rows turn over. */}
        <a
          href={colabUrl(lab)}
          target="_blank"
          rel="noreferrer"
          className={`${buttonClass("solid", "md")} max-sm:w-full`}
        >
          Open in Colab <span aria-hidden>↗</span>
        </a>
        <p className="flex flex-wrap items-center gap-x-[1.2rem] gap-y-[0.3rem] text-[0.9rem] text-faint">
          <span>~{spec.est_hours} h in a notebook of your own</span>
          <Pairing who={auth.status} progress={progress} />
        </p>
        <HowLabsWork who={auth.status} />
      </div>

      {/* Driven from here rather than by the browser: only the reader's own
          press is remembered, never the default the width chose. */}
      <details
        open={open}
        // The browser can still open it on its own — find-in-page expands a
        // match inside — and the summary has to say so.
        onToggle={(event) => {
          if (event.currentTarget.open !== open) toggle();
        }}
        className="mt-[1.2rem]"
      >
        <summary
          onClick={(event) => {
            event.preventDefault();
            toggle();
          }}
          className="group/sum flex cursor-pointer list-none items-baseline gap-[0.9rem] border-t border-ink py-[0.55rem] [&::-webkit-details-marker]:hidden"
        >
          <span className={LABEL_CLASS}>Checkpoints</span>
          <span className={COUNT}>
            <b className="font-bold text-ink">{count(required, "passed")}</b> of{" "}
            {required.length} required
            {failed > 0 && (
              <span className="font-semibold text-accent"> · {failed} failed</span>
            )}
          </span>
          <span className="ml-auto text-[0.88rem] text-faint transition-colors duration-(--motion-fast) group-hover/sum:text-accent">
            {open ? "Hide" : "Show"}
          </span>
        </summary>
        {rows(required)}
        {bonus.length > 0 && (
          <>
            <p className="mt-[0.9rem] mb-[0.35rem] flex items-baseline gap-[0.9rem]">
              <span className={LABEL_CLASS}>Bonus</span>
              <span className={COUNT}>
                {count(bonus, "passed")} of {bonus.length}
              </span>
            </p>
            {rows(bonus)}
          </>
        )}
      </details>
    </section>
  );
}
