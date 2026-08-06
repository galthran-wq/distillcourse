"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth/store";
import { resumeSession, useSession } from "@/lib/chat/session";
import { togglePanel, usePanel } from "@/lib/chat/stored";
import { LessonsProvider, type Lessons } from "@/lib/content/links";

export default function ChatWidget({ lessons }: { lessons: Lessons }) {
  const auth = useAuth();
  const session = useSession();
  const open = usePanel();
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    if (!open || auth.status !== "signed-in" || session !== null) return;
    resumeSession().catch(() => setUnreachable(true));
  }, [open, auth.status, session]);

  return (
    <LessonsProvider value={lessons}>
      {open && (
        <section
          aria-label="Tutor"
          // Full height only once there is a conversation to scroll; a prompt
          // to sign in is two lines and should be two lines tall.
          className={`fixed bottom-20 right-6 z-40 flex w-[min(24rem,calc(100vw-3rem))] flex-col rounded-md border border-line bg-paper shadow-popover ${
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
      <Button
        variant={open ? "outline" : "solid"}
        onClick={togglePanel}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-40 shadow-card"
      >
        {open ? "Close" : "Tutor"}
      </Button>
    </LessonsProvider>
  );
}
