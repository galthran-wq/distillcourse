"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import { ChatIcon } from "@/components/chat/icons";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth/store";
import { resumeSession, useSession } from "@/lib/chat/session";
import { collapsePanel, togglePanel, usePanel } from "@/lib/chat/stored";
import { LessonsProvider, type Lessons } from "@/lib/content/links";

// Over the page, all but its margin; on a phone there is no margin to leave.
const EXPANDED = "fixed inset-0 z-50 mx-auto sm:inset-4 sm:max-w-4xl sm:rounded-md";
// Beside the page, clear of the launcher below it.
const DOCKED = "fixed right-6 bottom-20 z-40 w-[min(24rem,calc(100vw-3rem))] rounded-md";

export default function ChatWidget({ lessons }: { lessons: Lessons }) {
  const auth = useAuth();
  const session = useSession();
  const panel = usePanel();
  const [unreachable, setUnreachable] = useState(false);
  const open = panel !== "closed";
  // Only an open conversation is worth the screen. It is also the only state
  // that carries the panel's own chrome, and the launcher is hidden under the
  // overlay — a sign-in prompt spread over the page would have no way out.
  const expanded = panel === "expanded" && session !== null;

  useEffect(() => {
    if (!open || auth.status !== "signed-in" || session !== null) return;
    resumeSession().catch(() => setUnreachable(true));
  }, [open, auth.status, session]);

  // What Escape does to anything covering the page. It returns the panel to its
  // corner rather than closing it: the conversation was not what was dismissed.
  // The page under the overlay is frozen while it is there, the way the image
  // lightbox freezes it — a scrim that scrolls what it covers is a backdrop the
  // reader can still work through.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") collapsePanel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  return (
    <LessonsProvider value={lessons}>
      {expanded && (
        // Not a control: the header's collapse button is the one that can be
        // reached and named, and a full-viewport button carrying the same name
        // would be a second one in the tab order with nothing to show for it.
        // Escape does what clicking here does, for everyone who cannot.
        <div aria-hidden onClick={collapsePanel} className="fixed inset-0 z-40 bg-scrim" />
      )}
      {open && (
        <section
          aria-label="Tutor"
          // Expanded it covers the page, which is what a dialog is; docked it
          // sits beside the page and is just a region of it.
          role={expanded ? "dialog" : undefined}
          aria-modal={expanded || undefined}
          // Full height only once there is a conversation to scroll.
          className={`flex flex-col border border-line bg-paper shadow-popover ${
            expanded
              ? EXPANDED
              : `${DOCKED} ${auth.status === "signed-in" ? "h-[min(32rem,calc(100vh-8rem))]" : ""}`
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
            <ChatPanel session={session} expanded={expanded} />
          ) : (
            <p className="p-4 text-sm text-faint">
              {unreachable ? "the tutor is unreachable" : "opening…"}
            </p>
          )}
        </section>
      )}
      {!expanded && (
        <Button
          variant={open ? "outline" : "solid"}
          size="pill"
          onClick={togglePanel}
          aria-expanded={open}
          className="fixed right-6 bottom-6 z-40 shadow-card"
        >
          <ChatIcon />
          Tutor
        </Button>
      )}
    </LessonsProvider>
  );
}
