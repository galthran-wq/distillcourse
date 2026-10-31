import { call } from "@/lib/http";

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
  full_name?: string;
}

export interface LoginBody {
  email: string;
  password: string;
  timezone: string;
}

// Mirrors the backend bound (app/core/security.py): the browser refusing a
// short password beats a round trip that comes back as a 422.
export const MIN_PASSWORD_LENGTH = 8;

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
