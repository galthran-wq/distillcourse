"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChatPanel from "@/components/chat/ChatPanel";
import PanelGrips from "@/components/chat/PanelGrips";
import { ChatIcon } from "@/components/chat/icons";
import { Button } from "@/components/ui";
import { MOTION_BASE_MS } from "@/components/ui/styles";
import { useAuth } from "@/lib/auth/store";
import { panelVars, usePanelDragging, usePanelFit } from "@/lib/chat/panel-box";
import { resumeSession, useSession } from "@/lib/chat/session";
import { collapsePanel, togglePanel, usePanel, usePanelBox } from "@/lib/chat/stored";
import { LessonsProvider, type Lessons } from "@/lib/content/links";
import { useExitDelay } from "@/lib/ui/exit";

export default function ChatWidget({ lessons }: { lessons: Lessons }) {
  const auth = useAuth();
  const session = useSession();
  const panel = usePanel();
  // A window can be smaller than the one the box was dragged out in, and can
  // change size under an open panel. What that leaves is drawn rather than
  // stored: the box stays the reader's.
  const box = usePanelFit(usePanelBox());
  const dragging = usePanelDragging();
  // What a drag moves. The lengths go straight onto this element while the
  // pointer is down, so it is handed to the header and the grips rather than
  // looked up from them.
  const section = useRef<HTMLElement>(null);
  const [unreachable, setUnreachable] = useState(false);
  const open = panel !== "closed";
  // `.chat-panel` shrinks back into its launcher over one `--motion-base`.
  const onScreen = useExitDelay(open, MOTION_BASE_MS);
  // Only an open conversation is worth the screen. It is also the only state
  // that carries the panel's own chrome, and the launcher is hidden under the
  // overlay — a sign-in prompt spread over the page would have no way out.
  const expanded = panel === "expanded" && session !== null;
  // Full height only for a reader who has a conversation to scroll: the sign-in
  // prompt and the line of status while auth is still loading are as tall as
  // their text, and a 24rem by 32rem box holding one line is an empty box.
  const shape = expanded ? "expanded" : auth.status === "signed-in" ? "docked" : "prompt";

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
          ref={section}
          aria-label="Tutor"
          // Expanded it covers the page, which is what a dialog is; docked it
          // sits beside the page and is just a region of it.
          role={expanded ? "dialog" : undefined}
          aria-modal={expanded || undefined}
          // Which box `.chat-panel` puts it in — and, docked, where in that
          // shape's rule the reader has put it.
          data-shape={shape}
          style={shape === "docked" ? panelVars(box) : undefined}
          className={`chat-panel flex flex-col rounded-md border border-line bg-paper shadow-popover ${
            expanded ? "z-50 max-sm:rounded-none" : "z-40"
          } ${open ? "" : "is-closing"} ${dragging ? "is-dragging" : ""}`}
        >
          {shape === "docked" && <PanelGrips panel={section} />}
          {auth.status === "anonymous" ? (
            <p className="p-4 text-sm text-soft">
              The tutor answers about the lesson you are reading.{" "}
              <Link href="/login" className="text-accent hover:underline">
                Sign in
              </Link>{" "}
              to ask it something.
            </p>
          ) : session !== null ? (
            <ChatPanel session={session} panel={section} expanded={expanded} />
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
