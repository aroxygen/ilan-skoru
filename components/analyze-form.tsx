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

type PrefillResult = {
  provider: string;
  status: string;
  extracted: Record<string, string | number | undefined>;
  extractedFields: string[];
  missingFields: string[];
  warnings: string[];
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
  const [prefilling, setPrefilling] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [prefillInfo, setPrefillInfo] = useState<PrefillResult | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [roomCount, setRoomCount] = useState("");
  const [buildingAge, setBuildingAge] = useState("");
  const [floorInfo, setFloorInfo] = useState("");
  const [squareMeters, setSquareMeters] = useState("");
  const [listingAgeDays, setListingAgeDays] = useState("");
  const [description, setDescription] = useState("");

  async function prefillFromUrl() {
    if (!url) return;
    setPrefilling(true);
    try {
      const response = await fetch("/api/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!response.ok) throw new Error("Prefill failed");
      const data: PrefillResult = await response.json();
      setPrefillInfo(data);

      if (data.extracted.title && !title) setTitle(String(data.extracted.title));
      if (data.extracted.price && !price) setPrice(String(data.extracted.price));
      if (data.extracted.location && !location) setLocation(String(data.extracted.location));
      if (data.extracted.district && !district) setDistrict(String(data.extracted.district));
      if (data.extracted.neighborhood && !neighborhood) setNeighborhood(String(data.extracted.neighborhood));
      if (data.extracted.propertyType && !propertyType) setPropertyType(String(data.extracted.propertyType));
      if (data.extracted.roomCount && !roomCount) setRoomCount(String(data.extracted.roomCount));
      if (data.extracted.buildingAge && !buildingAge) setBuildingAge(String(data.extracted.buildingAge));
      if (data.extracted.squareMeters && !squareMeters) setSquareMeters(String(data.extracted.squareMeters));
      if (data.extracted.description && !description) setDescription(String(data.extracted.description));
    } finally {
      setPrefilling(false);
    }
  }

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
      if (!response.ok) throw new Error("Analyze request failed.");

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
        <p className="text-xs text-slate-400">Sahibinden URL can prefill key fields. You can always override manually before analysis.</p>
        <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
          <input name="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Listing URL (optional)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <button type="button" onClick={prefillFromUrl} disabled={prefilling || !url} className="rounded-lg border border-terminal-400/60 px-3 py-2 text-xs font-semibold text-terminal-300 disabled:opacity-50">
            {prefilling ? "Prefilling..." : "Prefill from URL"}
          </button>
        </div>

        {prefillInfo && (
          <div className="rounded-lg border border-slate-700 bg-terminal-950/60 p-3 text-xs text-slate-300">
            <p>Parser: {prefillInfo.provider} • {prefillInfo.status}</p>
            <p>Extracted: {prefillInfo.extractedFields.join(", ") || "None"}</p>
            <p>Missing: {prefillInfo.missingFields.join(", ") || "None"}</p>
          </div>
        )}

        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="price" value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Price" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Neighborhood" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} placeholder="Property type" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="roomCount" value={roomCount} onChange={(e) => setRoomCount(e.target.value)} placeholder="Room count (e.g. 3+1)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="buildingAge" value={buildingAge} onChange={(e) => setBuildingAge(e.target.value)} type="number" placeholder="Building age (optional)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="floorInfo" value={floorInfo} onChange={(e) => setFloorInfo(e.target.value)} placeholder="Floor info (e.g. 4/10)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="squareMeters" value={squareMeters} onChange={(e) => setSquareMeters(e.target.value)} type="number" placeholder="Gross m²" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="listingAgeDays" value={listingAgeDays} onChange={(e) => setListingAgeDays(e.target.value)} type="number" placeholder="Listing age (days)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="comparableMedianPricePerM2" type="number" placeholder="Fallback median price/m²" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <input name="previousPrice" type="number" placeholder="Previous price" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <select name="sellerType" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2">
            <option value="UNKNOWN">Seller type unknown</option>
            <option value="OWNER">Owner</option>
            <option value="AGENT">Agent</option>
            <option value="DEVELOPER">Developer</option>
          </select>
        </div>
        <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Description text" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
        <textarea name="comparablesJson" rows={4} placeholder='Optional comparable snapshot JSON array (advanced).' className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-xs" />
        <button disabled={loading} className="rounded-lg bg-terminal-500 px-4 py-2 font-semibold text-slate-900 hover:bg-terminal-400 disabled:opacity-60">
          {loading ? "Analyzing..." : "Run Decision Engine"}
        </button>
      </form>

      <aside className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-slate-400">Latest Analysis</p>
        {!result ? (
          <div className="panel"><p className="text-sm text-slate-300">No output yet. Submit listing data to see score, class, action, and negotiation range.</p></div>
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
