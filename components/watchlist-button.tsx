"use client";

import { useState } from "react";

export function WatchlistButton({ listingAnalysisId }: { listingAnalysisId: string }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingAnalysisId })
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving || done}
      className="rounded-lg border border-terminal-400/50 px-3 py-2 text-xs font-semibold text-terminal-300 disabled:opacity-50"
    >
      {done ? "Saved to Watchlist" : saving ? "Saving..." : "Add to Watchlist"}
    </button>
  );
}
