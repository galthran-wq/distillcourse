import { API } from "@/lib/api-base";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// The whole API client: every feature declares the shapes it reads in its own
// lib/*/api.ts over this. Hand-written rather than generated from the backend's
// OpenAPI spec, because a generator needs uv and the backend source, which the
// frontend image build (apps/frontend/Dockerfile) has neither of, and the
// handful of calls the site makes is this. The session cookie is httpOnly and
// first-party, so no code here ever touches it.
export async function call<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError(response.status, await failure(response));
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

interface FieldError {
  loc?: unknown[];
  msg?: string;
}

// Exported because a chat stream fails through the AI SDK transport instead of
// through `call`, and it reaches the widget as the response body verbatim.
export function errorDetail(payload: unknown): string | null {
  const detail = (payload as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  // A 422 carries `detail` as a list of {loc, msg} instead: without this the
  // form can only show the bare status, naming neither field nor reason.
  const invalid: FieldError | undefined = Array.isArray(detail) ? detail[0] : undefined;
  if (invalid?.msg) return `${String(invalid.loc?.at(-1) ?? "request")}: ${invalid.msg}`;
  return null;
}

async function failure(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  return errorDetail(payload) ?? `request failed (${response.status})`;
}
