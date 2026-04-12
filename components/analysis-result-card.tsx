import { Action, Classification } from "@/lib/types";

type AnalysisResultCardProps = {
  title: string;
  score: number;
  classification: Classification | string;
  action: Action | string;
  explanation: string;
  negotiationMin: number;
  negotiationMax: number;
  sellerFatigueIndex: number;
  negotiationEdge: number;
  confidenceScore: number;
  isPartial?: boolean;
  parserProvider?: string;
  parserStatus?: string;
  compact?: boolean;
};

const actionTone: Record<string, string> = {
  BUY: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  NEGOTIATE: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  IGNORE: "text-rose-300 border-rose-500/40 bg-rose-500/10"
};

export function AnalysisResultCard({
  title,
  score,
  classification,
  action,
  explanation,
  negotiationMin,
  negotiationMax,
  sellerFatigueIndex,
  negotiationEdge,
  confidenceScore,
  isPartial = false,
  parserProvider,
  parserStatus,
  compact = false
}: AnalysisResultCardProps) {
  return (
    <article className="panel space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="max-w-[24rem] text-base font-semibold text-terminal-300">{title}</h3>
        <div className="flex items-center gap-2">
          {isPartial && <span className="rounded-full border border-slate-600 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">Partial</span>}
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${actionTone[action] ?? "border-slate-600 bg-slate-700/30 text-slate-200"}`}>
            {action}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="metric">
          <p className="text-xs uppercase tracking-wide text-slate-400">Score</p>
          <p className="mt-1 text-lg font-semibold">{score}/100</p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase tracking-wide text-slate-400">Class</p>
          <p className="mt-1 text-lg font-semibold">{classification}</p>
        </div>
        <div className="metric">
          <p className="text-xs uppercase tracking-wide text-slate-400">Confidence</p>
          <p className="mt-1 text-lg font-semibold">{confidenceScore}</p>
        </div>
      </div>

      {!compact && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="metric">
            <p className="text-xs uppercase tracking-wide text-slate-400">Seller Fatigue Index</p>
            <p className="mt-1 text-sm text-slate-200">{sellerFatigueIndex}</p>
          </div>
          <div className="metric">
            <p className="text-xs uppercase tracking-wide text-slate-400">Negotiation Edge</p>
            <p className="mt-1 text-sm text-slate-200">{negotiationEdge}</p>
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm text-slate-300">
        {(parserProvider || parserStatus) && <p className="text-xs text-slate-400">Parser: {parserProvider || "unknown"} • {parserStatus || "unsupported"}</p>}
        <p>{explanation || "No clear edge signal yet."}</p>
        <p>
          Suggested range: <span className="font-medium text-slate-100">{negotiationMin.toLocaleString()} - {negotiationMax.toLocaleString()}</span>
        </p>
      </div>
    </article>
  );
}
