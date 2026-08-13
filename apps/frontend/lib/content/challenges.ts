import { join } from "node:path";
import { loadYamlFile } from "./load";
import { ChallengesFileSchema, type LabCheckpointKind } from "./schema";

/**
 * Loader for a lab lesson's `challenges.yaml` — the VERIFICATION half of the
 * contract pair documented on `LabSpecSchema` in schema.ts.
 */

export const CHALLENGES_FILE = "challenges.yaml";

export function challengesPath(lessonDir: string): string {
  return join(lessonDir, CHALLENGES_FILE);
}

export interface LoadedChallenges {
  /** Declared checkpoint ids, in file order. */
  ids: string[];
  /** Declared verification kind, per id — absent where the file omits it. */
  kinds: Map<string, LabCheckpointKind>;
  /** Present but unparsable/invalid; the message the linter reports. */
  error?: string;
  exists: boolean;
}

export function loadChallenges(lessonDir: string): LoadedChallenges {
  const file = loadYamlFile(challengesPath(lessonDir), ChallengesFileSchema);
  const checkpoints = Object.entries(file.data?.checkpoints ?? {});
  const kinds = new Map<string, LabCheckpointKind>();
  for (const [id, checkpoint] of checkpoints) {
    if (checkpoint.kind !== undefined) kinds.set(id, checkpoint.kind);
  }
  return {
    ids: checkpoints.map(([id]) => id),
    kinds,
    error: file.error,
    exists: file.exists,
  };
}
