export interface User {
  id: string;
  email: string;
  full_name: string | null;
  timezone: string;
}

export interface SignupBody {
  email: string;
  password: string;
  timezone: string;
  invite_code: string;
  full_name?: string;
}

export interface LoginBody {
  email: string;
  password: string;
  timezone: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// Hand-written rather than taken from the generated client in lib/api: that
// client needs uv and the backend source to exist, which the frontend image
// build (apps/frontend/Dockerfile) has neither of, and these four calls are
// what the site itself needs. Generated types stay for code that runs outside
// the image build.
//
// Same origin on purpose: caddy serves the site and /api/* from one host, and
// `next dev` rewrites /api the same way (next.config.ts). The session cookie is
// httpOnly and first-party, so no code here ever touches it.
const API = "/api/v1";

async function call<T>(
  path: string,
  method: "GET" | "POST" = "GET",
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

async function failure(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  const detail = (payload as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" ? detail : `request failed (${response.status})`;
}

export function signup(body: SignupBody): Promise<User> {
  return call<User>("/auth/signup", "POST", body);
}

export function login(body: LoginBody): Promise<User> {
  return call<User>("/auth/login", "POST", body);
}

export function logout(): Promise<void> {
  return call<void>("/auth/logout", "POST");
}

export function me(): Promise<User> {
  return call<User>("/auth/me");
}
