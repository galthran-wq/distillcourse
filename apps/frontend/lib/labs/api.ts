import { call } from "@/lib/http";

/**
 * What the lab lesson page asks the API for. `lab` throughout is the pair a
 * lab is named by everywhere else on this side — `<course>/<lesson>`, the
 * string `lib/labs/mirror` builds its URLs from — which is also the path both
 * of these routes take.
 */

/**
 * One checkpoint's standing for this reader. What the checkpoint IS — its
 * order, text, kind and whether it is required — is content, and the page
 * already has it from the lesson's `lab` block; this is only the state beside
 * it, joined on the id.
 */
export interface CheckpointProgress {
  id: string;
  attempts: number;
  passed_at: string | null;
  best_score: number | null;
  feedback: string | null;
}

export interface LabProgress {
  checkpoints: CheckpointProgress[];
}

export interface PairingCode {
  code: string;
  expires_at: string;
}

/**
 * The manifest the notebook itself reads, for the one number a metric row
 * needs that the content index does not carry: the threshold is calibrated by
 * the lab build, not authored in course.yaml, so the page reads it from the
 * same document the grader was ingested with rather than from a second copy.
 */
export interface LabManifest {
  checkpoints: { id: string; spec: { metric?: string; threshold?: number } }[];
}

export function getLabProgress(lab: string): Promise<LabProgress> {
  return call<LabProgress>(`/labs/${lab}/progress`);
}

export function getLabManifest(lab: string): Promise<LabManifest> {
  return call<LabManifest>(`/labs/${lab}/manifest`);
}

export function issuePairingCode(): Promise<PairingCode> {
  return call<PairingCode>("/labs/pairing-code", "POST");
}
