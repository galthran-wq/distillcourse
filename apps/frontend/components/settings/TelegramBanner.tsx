"use client";

import Link from "next/link";
import { useSettings } from "@/lib/settings/store";

/**
 * The one thing about the channel a reader has to learn without going looking:
 * the bot is blocked, so nothing the platform sends is arriving.
 */
export default function TelegramBanner() {
  const settings = useSettings();
  if (settings?.telegram !== "broken") return null;

  return (
    <div className="border-b border-line bg-panel">
      <p className="mx-auto w-full max-w-7xl px-6 py-2 text-[13px] text-soft">
        Telegram is blocked, so reviews and reminders are paused.{" "}
        <Link href="/settings" className="text-accent hover:underline">
          Settings
        </Link>{" "}
        says how to resume them.
      </p>
    </div>
  );
}
