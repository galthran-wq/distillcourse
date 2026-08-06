"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ApiError } from "@/lib/http";
import {
  getSettings,
  pairTelegram,
  toApi,
  toClock,
  unpairTelegram,
  updateSettings,
  type Pairing,
  type Settings,
} from "@/lib/settings/api";
import { setSettings, useSettings } from "@/lib/settings/store";

const LABEL = "font-mono text-[11px] uppercase tracking-wider text-faint";
const CHANNEL: Record<Settings["telegram"], string> = {
  none: "not connected",
  active: "connected",
  broken: "connected, but the bot is blocked",
};

type Write = (change: () => Promise<Settings | void>) => Promise<void>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className={`mb-3 ${LABEL}`}>{title}</h2>
      {children}
    </section>
  );
}

function QuietHours({ settings, write }: { settings: Settings; write: Write }) {
  // The fields are the reader's until they leave one. Writing on every change
  // sends 23:00 while they are still typing 23:30, and the server refuses a
  // window that closes before it opens — so a value the reader is halfway
  // through is both sent and reset under them.
  const [start, setStart] = useState(toClock(settings.quiet_start));
  const [end, setEnd] = useState(toClock(settings.quiet_end));

  function save(): void {
    if (!start || !end) {
      // A cleared field is not a window; the one on the server stands.
      setStart(toClock(settings.quiet_start));
      setEnd(toClock(settings.quiet_end));
      return;
    }
    if (toApi(start) === settings.quiet_start && toApi(end) === settings.quiet_end) {
      return;
    }
    // Both ends in one write, so moving the window later is a change the
    // server can accept rather than two it has to refuse.
    void write(() =>
      updateSettings({ quiet_start: toApi(start), quiet_end: toApi(end) }),
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      {(
        [
          ["From", start, setStart],
          ["Until", end, setEnd],
        ] as const
      ).map(([label, value, set]) => (
        <label key={label} className="block text-sm">
          <span className="text-soft">{label}</span>
          <input
            type="time"
            value={value}
            onChange={(event) => set(event.target.value)}
            onBlur={save}
            className="mt-1 block rounded border border-line bg-transparent px-2 py-1"
          />
        </label>
      ))}
    </div>
  );
}

export default function SettingsPanel() {
  const settings = useSettings();
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (settings === null) {
    return <p className="mt-8 text-sm text-faint">Sign in to read your settings.</p>;
  }

  async function write(change: () => Promise<Settings | void>) {
    setError(null);
    try {
      const updated = await change();
      if (updated) setSettings(updated);
      else setSettings(await getSettings());
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : "the server is unreachable",
      );
    }
  }

  // A mute the tutor set has an end date, and the column keeps that time after
  // it has passed: the moment, not the column, says whether this is paused.
  const muted =
    settings.muted_until !== null && new Date(settings.muted_until) > new Date();

  return (
    <>
      {error !== null && (
        <p role="alert" className="mt-6 text-sm text-accent">
          {error}
        </p>
      )}

      <Section title="Telegram">
        <p className="text-sm text-soft">{CHANNEL[settings.telegram]}</p>
        {settings.telegram === "broken" && (
          <p className="mt-2 text-sm text-accent">
            Nothing is sent while the bot is blocked, and reviews and reminders wait
            rather than pile up. Unblock it and write anything to the bot to resume.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => void write(async () => setPairing(await pairTelegram()))}>
            {settings.telegram === "none" ? "Connect Telegram" : "Connect another account"}
          </Button>
          {settings.telegram !== "none" && (
            <Button onClick={() => void write(unpairTelegram)}>Disconnect</Button>
          )}
        </div>
        {pairing !== null && (
          <p className="mt-4 text-sm">
            <a href={pairing.link} className="text-accent hover:underline">
              {pairing.link}
            </a>{" "}
            <span className="text-faint">
              — one use, and it expires at{" "}
              {new Date(pairing.expires_at).toLocaleTimeString()}.
            </span>
          </p>
        )}
      </Section>

      <Section title="When the platform may write">
        <QuietHours settings={settings} write={write} />
        <p className="mt-3 text-sm text-faint">
          On your own clock. Outside these hours a message waits for the next morning.
          The window has to open before it closes, so it cannot run past midnight.
        </p>
      </Section>

      <Section title="Timezone">
        <p className="text-sm text-soft">{settings.timezone}</p>
        <p className="mt-2 text-sm text-faint">
          Read from the browser at every sign-in. Set it by hand if you are signing in
          from somewhere you do not live.
        </p>
        <Button
          className="mt-3"
          onClick={() =>
            void write(() =>
              updateSettings({
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }),
            )
          }
        >
          Use this browser&apos;s timezone
        </Button>
      </Section>

      <Section title="Messages the platform starts">
        <p className="text-sm text-soft">
          {muted ? "Paused. Answers to what you write are unaffected." : "On."}
        </p>
        <Button className="mt-3" onClick={() => void write(() => updateSettings({ muted: !muted }))}>
          {muted ? "Resume" : "Pause"}
        </Button>
      </Section>
    </>
  );
}
