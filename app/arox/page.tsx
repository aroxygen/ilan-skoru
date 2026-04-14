"use client";

import { FormEvent, useState } from "react";
import { AroxResultCard } from "@/components/arox/arox-result-card";

type AnalyzeResponse = {
  karar: string;
  yorgunluk_skoru: number;
  firsat_skoru: number;
  risk_skoru: number;
  ozet: string;
};

export default function AroxPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/arox/analiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || payload?.error || "Analiz başarısız");

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-12 text-slate-100">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Arox Emlak Operatörü</p>
        <h1 className="mt-2 text-3xl font-bold">Link → analiz → psikoloji → karar</h1>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
        <label className="text-sm text-slate-300">İlan Linki</label>
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.sahibinden.com/..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60"
          >
            {loading ? "Analiz..." : "Analiz Et"}
          </button>
        </div>
      </form>

      {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {result && <AroxResultCard result={result} />}
    </main>
  );
}
