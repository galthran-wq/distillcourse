"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import { FIELD_CLASS, FIELD_LABEL_CLASS } from "@/components/ui/styles";
import { useSignedIn } from "@/lib/auth/signed-in";
import { useAuth } from "@/lib/auth/store";
import { day } from "@/lib/day";
import { editMemory, forgetMemory, getMemories, type Memory } from "@/lib/memories/api";

export function MemoryRow({
  memory,
  onEdited,
  onForgotten,
}: {
  memory: Memory;
  onEdited: (edited: Memory) => void;
  onForgotten: () => void;
}) {
  const [description, setDescription] = useState(memory.description);
  const [content, setContent] = useState(memory.content);
  const [failure, setFailure] = useState<string | null>(null);
  const edited = description !== memory.description || content !== memory.content;

  // The write is awaited before the list is told: this page exists to show
  // what the tutor will actually read next time, so it must not show an edit
  // the server rejected.
  async function save() {
    setFailure(null);
    try {
      await editMemory(memory.slug, description, content);
      // The row carries the moment of the write it just made: the line reads
      // "edited by you" beside the date, and the tutor's original date under
      // that wording is a claim the page would be making up.
      onEdited({
        ...memory,
        description,
        content,
        source: "user",
        updated_at: new Date().toISOString(),
      });
    } catch {
      setFailure("could not save that");
    }
  }

  async function forget() {
    setFailure(null);
    try {
      await forgetMemory(memory.slug);
      onForgotten();
    } catch {
      setFailure("could not delete that");
    }
  }

  return (
    <li className="border-b border-line py-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[11px] text-faint">{memory.slug}</span>
        <span className="shrink-0 font-mono text-[11px] text-faint">
          {memory.source === "user" ? "edited by you" : "written by the tutor"} ·{" "}
          {day(memory.updated_at)}
        </span>
      </div>
      <label className="mt-3 block text-sm">
        <span className={FIELD_LABEL_CLASS}>What it is about</span>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={FIELD_CLASS}
        />
      </label>
      <label className="mt-3 block text-sm">
        <span className={FIELD_LABEL_CLASS}>What it remembers</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          className={`${FIELD_CLASS} resize-y`}
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={save} disabled={!edited}>
          save
        </Button>
        <Button size="sm" variant="ghost" onClick={forget}>
          forget this
        </Button>
        {failure !== null && (
          <span role="alert" className="ml-1 text-[13px] text-accent">
            {failure}
          </span>
        )}
      </div>
    </li>
  );
}

export default function Memories() {
  const auth = useAuth();
  const [memories, setMemories] = useSignedIn(getMemories);

  if (auth.status === "anonymous") {
    return (
      <p className="mt-6 text-sm text-soft">
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>{" "}
        to see what the tutor remembers about you.
      </p>
    );
  }
  if (memories === null) return null;
  if (memories.length === 0) {
    return (
      <p className="mt-6 text-sm text-faint">
        The tutor has written nothing down yet. It keeps what would change a later
        answer — your background, what you are working towards, an explanation that
        worked.
      </p>
    );
  }

  return (
    <ul className="mt-6">
      {memories.map((memory) => (
        <MemoryRow
          key={memory.slug}
          memory={memory}
          onEdited={(edited) =>
            setMemories((held) =>
              (held ?? []).map((row) => (row.slug === edited.slug ? edited : row)),
            )
          }
          onForgotten={() =>
            setMemories((held) =>
              (held ?? []).filter((row) => row.slug !== memory.slug),
            )
          }
        />
      ))}
    </ul>
  );
}
