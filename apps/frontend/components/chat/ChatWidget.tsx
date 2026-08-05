"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import { useAuth } from "@/lib/auth/store";
import { resumeSession, useSession } from "@/lib/chat/session";

export default function ChatWidget() {
  const auth = useAuth();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    if (!open || auth.status !== "signed-in" || session !== null) return;
    resumeSession().catch(() => setUnreachable(true));
  }, [open, auth.status, session]);

  return (
    <>
      {open && (
        <section
          aria-label="Tutor"
          // Full height only once there is a conversation to scroll; a prompt
          // to sign in is two lines and should be two lines tall.
          className={`fixed bottom-20 right-6 z-40 flex w-[min(24rem,calc(100vw-3rem))] flex-col rounded-md border border-line bg-paper shadow-lg ${
            auth.status === "signed-in" ? "h-[min(32rem,calc(100vh-8rem))]" : ""
          }`}
        >
          {auth.status === "anonymous" ? (
            <p className="p-4 text-sm text-soft">
              The tutor answers about the lesson you are reading.{" "}
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>{" "}
              to ask it something.
            </p>
          ) : session !== null ? (
            <ChatPanel session={session} />
          ) : (
            <p className="p-4 text-sm text-faint">
              {unreachable ? "the tutor is unreachable" : "opening…"}
            </p>
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-40 min-h-11 rounded-full border border-line bg-paper px-4 text-sm shadow-sm transition-colors hover:border-accent hover:text-accent"
      >
        {open ? "Close" : "Tutor"}
      </button>
    </>
  );
}
