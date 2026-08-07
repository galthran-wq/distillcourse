"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { answered } from "@/lib/load";
import type { LessonSections } from "@/lib/content/site";

/** Where the build left the section index (app/content/sections/route.ts). */
const PATH = "/content/sections";

// One request per tab. The index is a build artefact, so it cannot change
// under an open page, and the panel is opened and closed all day.
let loading: Promise<LessonSections> | null = null;

function load(): Promise<LessonSections> {
  loading ??= fetch(PATH)
    .then((response) => response.json() as Promise<LessonSections>)
    .catch(() => {
      // Not an answer to remember: the next open asks again, and until one
      // lands the autocomplete offers courses and lessons but no sections.
      loading = null;
      return {};
    });
  return loading;
}

/**
 * The index, from the moment it is wanted. Held by whoever knows when that is
 * — the widget, which asks as the panel opens rather than as the page loads:
 * every page of the site carries the launcher and most readers never press it.
 */
export function useLoadedSections(wanted: boolean): LessonSections {
  const [sections, setSections] = useState<LessonSections>({});

  useEffect(() => {
    if (!wanted) return;
    return answered(load(), (value) => setSections(value ?? {}));
  }, [wanted]);

  return sections;
}

// Read by the composer's autocomplete and by the chips a message's references
// are drawn as — neither of which is under the widget by props.
const context = createContext<LessonSections>({});

export const SectionsProvider = context.Provider;

export function useSections(): LessonSections {
  return useContext(context);
}
