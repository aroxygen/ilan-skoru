"use client";

import { useState } from "react";

type Props = {
  initial: {
    enabledEvents: string[];
    channels: string[];
    minimumSeverity: number;
    quietHoursStart: number | null;
    quietHoursEnd: number | null;
    dedupeWindowMinutes: number;
  };
};

const EVENTS = ["price_dropped", "score_improved", "fatigue_increased", "action_upgraded", "parser_failed", "confidence_dropped"];
const CHANNELS = ["email", "telegram", "push"];

export function NotificationSettingsForm({ initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [enabledEvents, setEnabledEvents] = useState(initial.enabledEvents);
  const [channels, setChannels] = useState(initial.channels);
  const [minimumSeverity, setMinimumSeverity] = useState(initial.minimumSeverity);
  const [quietHoursStart, setQuietHoursStart] = useState(initial.quietHoursStart ?? 23);
  const [quietHoursEnd, setQuietHoursEnd] = useState(initial.quietHoursEnd ?? 7);
  const [dedupeWindowMinutes, setDedupeWindowMinutes] = useState(initial.dedupeWindowMinutes);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledEvents, channels, minimumSeverity, quietHoursStart, quietHoursEnd, dedupeWindowMinutes })
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel space-y-3">
      <h2 className="text-sm uppercase tracking-wide text-slate-400">Notification Settings</h2>
      <div className="space-y-2 text-sm">
        <p className="text-slate-300">Events</p>
        <div className="flex flex-wrap gap-2">
          {EVENTS.map((event) => (
            <button key={event} type="button" onClick={() => setEnabledEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event])} className={`rounded-full border px-3 py-1 text-xs ${enabledEvents.includes(event) ? "border-terminal-400 text-terminal-300" : "border-slate-700 text-slate-400"}`}>
              {event}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-slate-300">Channels</p>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((channel) => (
            <button key={channel} type="button" onClick={() => setChannels((prev) => prev.includes(channel) ? prev.filter((e) => e !== channel) : [...prev, channel])} className={`rounded-full border px-3 py-1 text-xs ${channels.includes(channel) ? "border-terminal-400 text-terminal-300" : "border-slate-700 text-slate-400"}`}>
              {channel}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input type="number" value={minimumSeverity} onChange={(e) => setMinimumSeverity(Number(e.target.value) || 1)} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" placeholder="Min severity" />
        <input type="number" value={dedupeWindowMinutes} onChange={(e) => setDedupeWindowMinutes(Number(e.target.value) || 180)} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" placeholder="Dedupe minutes" />
        <input type="number" value={quietHoursStart} onChange={(e) => setQuietHoursStart(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" placeholder="Quiet start (UTC hour)" />
        <input type="number" value={quietHoursEnd} onChange={(e) => setQuietHoursEnd(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" placeholder="Quiet end (UTC hour)" />
      </div>
      <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-terminal-500 px-4 py-2 text-sm font-semibold text-slate-900">
        {saving ? "Saving..." : "Save Notification Settings"}
      </button>
    </div>
  );
}
