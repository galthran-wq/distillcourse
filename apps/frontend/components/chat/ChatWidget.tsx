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

// How long the panel takes to leave: `--motion-base`, which a timer cannot read.
const EXIT_MS = 200;

export default function ChatWidget({ lessons }: { lessons: Lessons }) {
  const auth = useAuth();
  const session = useSession();
  const panel = usePanel();
  const [unreachable, setUnreachable] = useState(false);
  const open = panel !== "closed";
  // A closed panel is an unmounted one, and an unmounted panel has nothing left
  // to animate — so it stays on screen for the length of its exit. Opening is
  // adjusted here rather than in an effect: the panel has to be in the paint
  // that opens it, and a paint later is a frame of nothing.
  const [onScreen, setOnScreen] = useState(open);
  if (open && !onScreen) setOnScreen(true);
  // Only an open conversation is worth the screen. It is also the only state
  // that carries the panel's own chrome, and the launcher is hidden under the
  // overlay — a sign-in prompt spread over the page would have no way out.
  const expanded = panel === "expanded" && session !== null;

  useEffect(() => {
    if (open || !onScreen) return;
    const timer = setTimeout(() => setOnScreen(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, onScreen]);

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
        <div
          aria-hidden
          onClick={collapsePanel}
          className="fixed inset-0 z-40 bg-scrim transition-opacity duration-(--motion-base) starting:opacity-0"
        />
      )}
      {onScreen && (
        <section
          aria-label="Tutor"
          // Expanded it covers the page, which is what a dialog is; docked it
          // sits beside the page and is just a region of it.
          role={expanded ? "dialog" : undefined}
          aria-modal={expanded || undefined}
          // Which box `.chat-panel` puts it in. Full height only once there is
          // a conversation to scroll.
          data-shape={
            expanded ? "expanded" : auth.status === "anonymous" ? "prompt" : "docked"
          }
          className={`chat-panel flex flex-col rounded-md border border-line bg-paper shadow-popover ${
            expanded ? "z-50 max-sm:rounded-none" : "z-40"
          } ${open ? "" : "is-closing"}`}
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
