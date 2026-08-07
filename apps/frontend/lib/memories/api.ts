import { call } from "@/lib/http";

export interface Memory {
  slug: string;
  description: string;
  content: string;
  source: "agent" | "user";
  updated_at: string;
}

export function getMemories(): Promise<Memory[]> {
  return call<Memory[]>("/memories");
}

export function editMemory(
  slug: string,
  description: string,
  content: string,
): Promise<void> {
  return call<void>(`/memories/${slug}`, "PUT", { description, content });
}

export function forgetMemory(slug: string): Promise<void> {
  return call<void>(`/memories/${slug}`, "DELETE");
}
