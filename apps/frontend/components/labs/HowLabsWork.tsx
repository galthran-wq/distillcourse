"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CHIP_CLASS, LINK_CLASS } from "@/components/ui/styles";
import type { AuthState } from "@/lib/auth/store";
import { ApiError } from "@/lib/http";
import { issuePairingCode, type PairingCode } from "@/lib/labs/api";

const CODE = "font-mono text-[12px] text-ink";

/**
 * The paste fallback for pairing: a code issued here and typed into
 * `distill.login("…")` when the approval link the notebook prints is not an
 * option. One press, and the string on screen to copy.
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
      No browser at hand —{" "}
      <button
        type="button"
        onClick={() => void issue()}
        className={LINK_CLASS}
      >
        {code === null ? "get a code" : "get a new code"}
      </button>{" "}
      and pass it to <code className={CODE}>login(&quot;…&quot;)</code>.
      {error !== null && (
        <span role="alert" className="mt-1 block text-accent">
          {error}
        </span>
      )}
      {code !== null && (
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
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
          <span className="text-faint">
            {copied ? "Copied. " : ""}Expires at{" "}
            {new Date(code.expires_at).toLocaleTimeString()}.
          </span>
        </span>
      )}
    </>
  );
}

function Step({ n, verb, children }: { n: number; verb: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.2rem_minmax(0,1fr)]">
      <span className="font-semibold text-faint">
        {n}
      </span>
      <span>
        <b className="font-semibold text-ink">{verb}</b> {children}
      </span>
    </li>
  );
}

/** The steps, said once on the page and folded away until asked for. */
export default function HowLabsWork({ who }: { who: AuthState["status"] }) {
  return (
    <details className="group/how ml-auto open:order-3 open:ml-0 open:basis-full max-sm:ml-0 max-sm:basis-full">
      <summary className="inline-flex cursor-pointer list-none items-center gap-[0.4rem] text-[0.9rem] text-faint transition-colors duration-(--motion-fast) hover:text-accent [&::-webkit-details-marker]:hidden">
        How labs work
        <span
          aria-hidden
          className="size-[0.38rem] -translate-y-[0.12rem] rotate-45 border-r-[1.5px] border-b-[1.5px] border-current transition-transform duration-(--motion-fast) group-open/how:translate-y-[0.08rem] group-open/how:-rotate-135"
        />
      </summary>
      <ol className="mt-[0.7rem] mb-[0.2rem] grid max-w-[40rem] gap-[0.45rem] text-[0.9rem] leading-[1.5] text-soft">
        <Step n={1} verb="Open">
          the notebook in Colab or any Jupyter. Its first cell installs{" "}
          <code className={CODE}>distill</code> and fetches the data.
        </Step>
        <Step n={2} verb="Pair">
          it once: <code className={CODE}>distill.login()</code> prints a link you
          approve here.{" "}
          {who === "signed-in" && <NotebookCode />}
          {who === "anonymous" && (
            <Link href="/login" className={LINK_CLASS}>
              Sign in to pair
            </Link>
          )}
        </Step>
        <Step n={3} verb="Check">
          each piece with <code className={CODE}>distill.check(…)</code>. The verdict
          prints in the notebook and this list follows; a short review of the code
          comes after it.
        </Step>
        <Step n={4} verb="Ask">
          the tutor about your code with{" "}
          <code className={CODE}>distill.ask(&quot;…&quot;, obj)</code>; the
          conversation stays with this lab.
        </Step>
      </ol>
    </details>
  );
}
