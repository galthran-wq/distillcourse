import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { ChallengesFileSchema } from "./schema";

/**
 * Loader for a lab lesson's `challenges.yaml` — the verification contract the
 * lab build compiles into the student notebook. Only the checkpoint ids are
 * read here; the linter cross-checks them against the display contract in
 * course.yaml, so the page can never promise work the notebook does not check.
 */

export const CHALLENGES_FILE = "challenges.yaml";

export function challengesPath(lessonDir: string): string {
  return join(lessonDir, CHALLENGES_FILE);
}

export interface LoadedChallenges {
  /** Declared checkpoint ids, in file order. */
  ids: string[];
  /** Present but unparsable/invalid; the message the linter reports. */
  error?: string;
  exists: boolean;
}

export function loadChallenges(lessonDir: string): LoadedChallenges {
  const path = challengesPath(lessonDir);
  if (!existsSync(path)) return { ids: [], exists: false };
  let raw: unknown;
  try {
    raw = parse(readFileSync(path, "utf8"));
  } catch (err) {
    return {
      ids: [],
      exists: true,
      error: `YAML parse error: ${(err as Error).message}`,
    };
  }
  const parsed = ChallengesFileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ids: [], exists: true, error: parsed.error.message };
  }
  return { ids: Object.keys(parsed.data.checkpoints), exists: true };
}
