import type { Metadata } from "next";
import SettingsPanel from "@/components/settings/SettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsPanel />
    </div>
  );
}
