"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResultCard } from "@/components/analysis-result-card";
import { WatchlistButton } from "@/components/watchlist-button";

type AnalyzeResponse = {
  id: string;
  title: string;
  score: number;
  classification: string;
  explanation: string;
  negotiationMin: number;
  negotiationMax: number;
  action: string;
  sellerFatigueIndex: number;
  negotiationEdge: number;
  confidenceScore: number;
  isPartial: boolean;
  parserStatus: string;
  parserProvider: string;
};

function parseComparableJson(value: string) {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AnalyzeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setResult(null);

    const payload = {
      url: String(formData.get("url") || ""),
      title: String(formData.get("title") || ""),
      price: Number(formData.get("price") || 0),
      location: String(formData.get("location") || ""),
      district: String(formData.get("district") || ""),
      neighborhood: String(formData.get("neighborhood") || ""),
      propertyType: String(formData.get("propertyType") || ""),
      roomCount: String(formData.get("roomCount") || ""),
      buildingAge: Number(formData.get("buildingAge") || 0) || undefined,
      floorInfo: String(formData.get("floorInfo") || "") || undefined,
      squareMeters: Number(formData.get("squareMeters") || 0),
      listingAgeDays: Number(formData.get("listingAgeDays") || 0),
      description: String(formData.get("description") || ""),
      comparableMedianPricePerM2: Number(formData.get("comparableMedianPricePerM2") || 0) || undefined,
      previousPrice: Number(formData.get("previousPrice") || 0) || undefined,
      sellerType: String(formData.get("sellerType") || "UNKNOWN"),
      comparables: parseComparableJson(String(formData.get("comparablesJson") || ""))
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Analyze request failed.");
      }

      const data: AnalyzeResponse = await response.json();
      setResult(data);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr,1.2fr]">
      <form action={onSubmit} className="panel grid gap-3">
        <h2 className="text-sm uppercase tracking-wide text-slate-400">Listing Input</h2>
        <p className="text-xs text-slate-400">Paste URL only for partial analysis, or combine URL + manual fields for a full score.</p>
        <input name="url" placeholder="Listing URL (optional)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
        <input name="title" placeholder="Title" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="price" type="number" placeholder="Price" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="location" placeholder="Location" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="district" placeholder="District" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="neighborhood" placeholder="Neighborhood" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="propertyType" placeholder="Property type" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="roomCount" placeholder="Room count (e.g. 3+1)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="buildingAge" type="number" placeholder="Building age (optional)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="floorInfo" placeholder="Floor info (e.g. 4/10)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="squareMeters" type="number" placeholder="Gross m²" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="listingAgeDays" type="number" placeholder="Listing age (days)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="comparableMedianPricePerM2" type="number" placeholder="Fallback median price/m²" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="previousPrice" type="number" placeholder="Previous price" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <select name="sellerType" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2">
            <option value="UNKNOWN">Seller type unknown</option>
            <option value="OWNER">Owner</option>
            <option value="AGENT">Agent</option>
            <option value="DEVELOPER">Developer</option>
          </select>
        </div>
        <textarea name="description" rows={5} placeholder="Description text" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
        <textarea
          name="comparablesJson"
          rows={4}
          placeholder='Optional comparable snapshot JSON array (advanced).'
          className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-xs"
        />
        <button disabled={loading} className="rounded-lg bg-terminal-500 px-4 py-2 font-semibold text-slate-900 hover:bg-terminal-400 disabled:opacity-60">
          {loading ? "Analyzing..." : "Run Decision Engine"}
        </button>
      </form>

      <aside className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-slate-400">Latest Analysis</p>
        {!result ? (
          <div className="panel">
            <p className="text-sm text-slate-300">No output yet. Submit listing data to see score, class, action, and negotiation range.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnalysisResultCard {...result} compact />
            <WatchlistButton listingAnalysisId={result.id} />
          </div>
        )}
      </aside>
    </div>
  );
}
