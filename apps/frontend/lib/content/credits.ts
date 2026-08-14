import { join } from "node:path";
import { loadYamlFile } from "./load";
import { CreditsFileSchema, type ImageCredit } from "./schema";

/**
 * Loader for a lesson's `figures/credits.yaml` — the provenance record of
 * every sourced raster figure it uses. The renderer prints it once, at the
 * end of <References>; the linter refuses images it does not cover.
 */

export const CREDITS_FILE = "credits.yaml";

export function creditsPath(lessonDir: string): string {
  return join(lessonDir, "figures", CREDITS_FILE);
}

export interface LoadedCredits {
  /** In file order — the order the credits are printed in. */
  entries: ImageCredit[];
  /** Present but unparsable/invalid; the message the linter reports. */
  error?: string;
  exists: boolean;
}

/**
 * `file` may name one image or, for a sequence whose frames share a source,
 * a `*` pattern (`shannon-1948-approximations-*.png`) — one entry for the
 * whole carousel instead of the same citation repeated per frame.
 */
export function creditMatches(entry: ImageCredit, fileName: string): boolean {
  if (!entry.file.includes("*")) return entry.file === fileName;
  const pattern = entry.file
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^/]*");
  return new RegExp(`^${pattern}$`).test(fileName);
}

export function creditFor(
  credits: LoadedCredits,
  fileName: string,
): ImageCredit | undefined {
  return (
    credits.entries.find((e) => e.file === fileName) ??
    credits.entries.find((e) => creditMatches(e, fileName))
  );
}

export function loadCredits(lessonDir: string): LoadedCredits {
  const file = loadYamlFile(creditsPath(lessonDir), CreditsFileSchema);
  return {
    entries: file.data?.images ?? [],
    error: file.error,
    exists: file.exists,
  };
}
