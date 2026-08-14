"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth/store";
import { ApiError } from "@/lib/http";
import { approveDevice } from "@/lib/labs/api";

/**
 * The browser half of the device flow: a notebook printed this page's URL and
 * is polling on the code in it; the one thing to do here is say that the
 * notebook may act as this account. Nothing is copied anywhere — the token
 * travels server → notebook, and this page never sees it.
 */
export default function ApproveNotebook({ code }: { code: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // The approval binds whoever is signed in, so an anonymous visitor signs in
  // first and comes back to this same URL — the code in it is the whole state.
  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(`/labs/pair/${code}`)}`);
    }
  }, [auth.status, router, code]);

  async function approve() {
    setError(null);
    setPending(true);
    try {
      await approveDevice(code);
      setApproved(true);
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : "the server is unreachable",
      );
      setPending(false);
    }
  }

  if (auth.status !== "signed-in") return null;

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      <div className="rounded-md border border-line bg-panel p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Approve this notebook</h1>
        {approved ? (
          <p className="mt-1.5 text-[13px] text-soft">
            Approved. The notebook picks it up within a few seconds — go back to
            it; this tab can be closed.
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-[13px] text-faint">
              A notebook that printed this link is asking to submit lab
              checkpoints as <strong className="text-soft">{auth.user.email}</strong>.
              If you did not just run its login cell, close this tab.
            </p>
            {error !== null && (
              <p
                role="alert"
                className="mt-4 rounded-sm border border-accent/40 bg-accent/10 px-3 py-2 text-[13px] text-accent"
              >
                {error}
              </p>
            )}
            <Button
              variant="solid"
              disabled={pending}
              onClick={() => void approve()}
              className="mt-6 w-full"
            >
              {pending ? "Approving…" : "Approve this notebook"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
