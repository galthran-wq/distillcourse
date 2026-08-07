import { call } from "@/lib/http";

export type TelegramStatus = "none" | "active" | "broken";

export interface Settings {
  timezone: string;
  /** "HH:MM:SS" — the two ends of the window the platform may write in. */
  quiet_start: string;
  quiet_end: string;
  muted_until: string | null;
  telegram: TelegramStatus;
}

export interface SettingsUpdate {
  timezone?: string;
  quiet_start?: string;
  quiet_end?: string;
  muted?: boolean;
}

export interface Pairing {
  link: string;
  expires_at: string;
}

/** `<input type="time">` speaks HH:MM; the API and Postgres speak HH:MM:SS. */
export function toClock(value: string): string {
  return value.slice(0, 5);
}

export function toApi(clock: string): string {
  return `${clock}:00`;
}

export function getSettings(): Promise<Settings> {
  return call<Settings>("/settings");
}

export function updateSettings(body: SettingsUpdate): Promise<Settings> {
  return call<Settings>("/settings", "PATCH", body);
}

export function pairTelegram(): Promise<Pairing> {
  return call<Pairing>("/settings/telegram/code", "POST");
}

export function unpairTelegram(): Promise<void> {
  return call<void>("/settings/telegram", "DELETE");
}
