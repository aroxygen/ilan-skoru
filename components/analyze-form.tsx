"use client";

import { useMemo, useState } from "react";
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

type PrefillExtracted = {
  title?: string;
  price?: number;
  location?: string;
  district?: string;
  neighborhood?: string;
  propertyType?: string;
  roomCount?: string;
  buildingAge?: number;
  floorInfo?: string;
  squareMeters?: number;
  listingAgeDays?: number;
  description?: string;
};

type PrefillResult = {
  provider: string;
  status: string;
  extracted: PrefillExtracted;
type PrefillResult = {
  provider: string;
  status: string;
  extracted: Record<string, string | number | undefined>;
  extractedFields: string[];
  missingFields: string[];
  warnings: string[];
};

type FieldState = {
  title: string;
  price: string;
  location: string;
  district: string;
  neighborhood: string;
  propertyType: string;
  roomCount: string;
  buildingAge: string;
  floorInfo: string;
  squareMeters: string;
  listingAgeDays: string;
  description: string;
};

type FieldKey = keyof FieldState;

const INITIAL_FIELDS: FieldState = {
  title: "",
  price: "",
  location: "",
  district: "",
  neighborhood: "",
  propertyType: "",
  roomCount: "",
  buildingAge: "",
  floorInfo: "",
  squareMeters: "",
  listingAgeDays: "",
  description: ""
};

const PREFILL_FIELD_KEYS: FieldKey[] = [
  "title",
  "price",
  "location",
  "district",
  "neighborhood",
  "propertyType",
  "roomCount",
  "buildingAge",
  "squareMeters",
  "description"
];

function parseComparableJson(value: string) {
  if (!value.trim()) return [];
function parseComparableJson(value: string) {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toDisplayValue(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

export function AnalyzeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [prefillInfo, setPrefillInfo] = useState<PrefillResult | null>(null);

  const [url, setUrl] = useState("");
  const [fields, setFields] = useState<FieldState>(INITIAL_FIELDS);

  const extractedEntries = useMemo(() => {
    if (!prefillInfo) return [];

    return Object.entries(prefillInfo.extracted).filter(([, value]) => value !== undefined && value !== "");
  }, [prefillInfo]);

  async function prefillFromUrl() {
    if (!url.trim()) return;

    setPrefilling(true);
    setPrefillError(null);

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
        body: JSON.stringify({ url: url.trim() })
      });

      if (!response.ok) {
        throw new Error(`Prefill request failed (${response.status})`);
      }

      const data: PrefillResult = await response.json();
      setPrefillInfo(data);

      setFields((current) => {
        const next = { ...current };

        for (const key of PREFILL_FIELD_KEYS) {
          const parsedValue = data.extracted[key];
          if ((current[key] ?? "").trim() || parsedValue === undefined || parsedValue === "") {
            continue;
          }

          next[key] = String(parsedValue);
        }

        return next;
      });
    } catch (error) {
      setPrefillInfo(null);
      setPrefillError(error instanceof Error ? error.message : "Prefill failed.");
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
      if (!response.ok) throw new Error("Analyze request failed.");

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
        <p className="text-xs text-slate-400">
          Paste a listing URL to prefill key fields. Any value you type manually is kept and will not be overridden by
          parser output.
        </p>

        <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
          <input
            name="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Listing URL (optional)"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <button
            type="button"
            onClick={prefillFromUrl}
            disabled={prefilling || !url.trim()}
            className="rounded-lg border border-terminal-400/60 px-3 py-2 text-xs font-semibold text-terminal-300 disabled:opacity-50"
          >
        <p className="text-xs text-slate-400">Sahibinden URL can prefill key fields. You can always override manually before analysis.</p>
        <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
          <input name="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Listing URL (optional)" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
          <button type="button" onClick={prefillFromUrl} disabled={prefilling || !url} className="rounded-lg border border-terminal-400/60 px-3 py-2 text-xs font-semibold text-terminal-300 disabled:opacity-50">
            {prefilling ? "Prefilling..." : "Prefill from URL"}
          </button>
        </div>

        {prefillError && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/20 p-3 text-xs text-red-200">{prefillError}</div>
        )}

        {prefillInfo && (
          <section className="rounded-lg border border-slate-700 bg-terminal-950/60 p-3 text-xs text-slate-300">
            <p className="text-slate-200">
              Parser: <span className="font-semibold">{prefillInfo.provider}</span> • Status:{" "}
              <span className="font-semibold">{prefillInfo.status}</span>
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Extracted Fields</p>
                {extractedEntries.length === 0 ? (
                  <p className="text-slate-500">No extracted values.</p>
                ) : (
                  <ul className="space-y-1">
                    {extractedEntries.map(([key, value]) => (
                      <li key={key} className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">{key}</span>
                        <span className="truncate text-right text-slate-100">{toDisplayValue(value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Missing Fields</p>
                  <p>{prefillInfo.missingFields.length ? prefillInfo.missingFields.join(", ") : "None"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">Warnings</p>
                  <p>{prefillInfo.warnings.length ? prefillInfo.warnings.join(" | ") : "None"}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <input
          name="title"
          value={fields.title}
          onChange={(event) => setFields((current) => ({ ...current, title: event.target.value }))}
          placeholder="Title"
          className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="price"
            value={fields.price}
            onChange={(event) => setFields((current) => ({ ...current, price: event.target.value }))}
            type="number"
            placeholder="Price"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="location"
            value={fields.location}
            onChange={(event) => setFields((current) => ({ ...current, location: event.target.value }))}
            placeholder="Location"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="district"
            value={fields.district}
            onChange={(event) => setFields((current) => ({ ...current, district: event.target.value }))}
            placeholder="District"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="neighborhood"
            value={fields.neighborhood}
            onChange={(event) => setFields((current) => ({ ...current, neighborhood: event.target.value }))}
            placeholder="Neighborhood"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="propertyType"
            value={fields.propertyType}
            onChange={(event) => setFields((current) => ({ ...current, propertyType: event.target.value }))}
            placeholder="Property type"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="roomCount"
            value={fields.roomCount}
            onChange={(event) => setFields((current) => ({ ...current, roomCount: event.target.value }))}
            placeholder="Room count (e.g. 3+1)"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="buildingAge"
            value={fields.buildingAge}
            onChange={(event) => setFields((current) => ({ ...current, buildingAge: event.target.value }))}
            type="number"
            placeholder="Building age (optional)"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="floorInfo"
            value={fields.floorInfo}
            onChange={(event) => setFields((current) => ({ ...current, floorInfo: event.target.value }))}
            placeholder="Floor info (e.g. 4/10)"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="squareMeters"
            value={fields.squareMeters}
            onChange={(event) => setFields((current) => ({ ...current, squareMeters: event.target.value }))}
            type="number"
            placeholder="Gross m²"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="listingAgeDays"
            value={fields.listingAgeDays}
            onChange={(event) => setFields((current) => ({ ...current, listingAgeDays: event.target.value }))}
            type="number"
            placeholder="Listing age (days)"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="comparableMedianPricePerM2"
            type="number"
            placeholder="Fallback median price/m²"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
          <input
            name="previousPrice"
            type="number"
            placeholder="Previous price"
            className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
          />
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

        <textarea
          name="description"
          value={fields.description}
          onChange={(event) => setFields((current) => ({ ...current, description: event.target.value }))}
          rows={5}
          placeholder="Description text"
          className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2"
        />

        <textarea
          name="comparablesJson"
          rows={4}
          placeholder="Optional comparable snapshot JSON array (advanced)."
          className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-xs"
        />

        <button
          disabled={loading}
          className="rounded-lg bg-terminal-500 px-4 py-2 font-semibold text-slate-900 hover:bg-terminal-400 disabled:opacity-60"
        >
        <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Description text" className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2" />
        <textarea name="comparablesJson" rows={4} placeholder='Optional comparable snapshot JSON array (advanced).' className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-xs" />
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
            <p className="text-sm text-slate-300">
              No output yet. Submit listing data to see score, class, action, and negotiation range.
            </p>
          <div className="panel"><p className="text-sm text-slate-300">No output yet. Submit listing data to see score, class, action, and negotiation range.</p></div>
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
