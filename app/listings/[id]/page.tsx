import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnalysisResultCard } from "@/components/analysis-result-card";
import { WatchlistButton } from "@/components/watchlist-button";
import { ComparableInsight, ParserMetadata, ScoreBreakdown } from "@/lib/types";

const breakdownLabels: Array<[keyof ScoreBreakdown, string]> = [
  ["baseScore", "Base score"],
  ["ageScore", "Age score"],
  ["priceVsMarketScore", "Price vs market"],
  ["priceChangeScore", "Price change"],
  ["descriptionWeaknessScore", "Description signal"],
  ["sellerTypeScore", "Seller type"],
  ["marketMismatchScore", "Market mismatch"],
  ["riskPenalty", "Risk penalty"],
  ["confidenceAdjustment", "Confidence adjustment"],
  ["finalScore", "Final score"]
];

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.listingAnalysis.findUnique({ where: { id }, include: { comparables: true } });

  if (!item) return notFound();

  const breakdown = item.scoreBreakdown as unknown as ScoreBreakdown;
  const comparableInsight = item.comparableInsight as unknown as ComparableInsight;
  const parserMetadata = item.parserMetadata as unknown as ParserMetadata;

  return (
    <section className="space-y-4">
      <div className="panel">
        <h1 className="text-xl font-semibold text-terminal-300">Listing Detail</h1>
        <p className="mt-2 text-sm text-slate-300">
          {item.location} • {item.squareMeters}m² • {item.price.toLocaleString()} • {item.roomCount}
        </p>
      </div>

      <div className="space-y-2">
      <WatchlistButton listingAnalysisId={item.id} />
      <AnalysisResultCard
        title={item.title}
        score={item.score}
        classification={item.classification}
        action={item.action}
        explanation={item.explanation}
        negotiationMin={item.negotiationMin}
        negotiationMax={item.negotiationMax}
        sellerFatigueIndex={item.sellerFatigueIndex}
        negotiationEdge={item.negotiationEdge}
        confidenceScore={item.confidenceScore}
        isPartial={item.isPartial}
        parserProvider={item.parserProvider}
        parserStatus={item.parserStatus}
      />
      </div>

      <div className="panel space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Weighted comparable intelligence</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="metric"><p className="text-xs text-slate-400">Weighted local avg/m²</p><p className="text-sm font-semibold">{Math.round(comparableInsight.weightedLocalAvgPricePerM2 || 0).toLocaleString()}</p></div>
          <div className="metric"><p className="text-xs text-slate-400">Listing price/m²</p><p className="text-sm font-semibold">{Math.round(comparableInsight.listingPricePerM2 || 0).toLocaleString()}</p></div>
          <div className="metric"><p className="text-xs text-slate-400">Deviation</p><p className="text-sm font-semibold">{(comparableInsight.deviationPct || 0).toFixed(1)}%</p></div>
          <div className="metric"><p className="text-xs text-slate-400">Effective count</p><p className="text-sm font-semibold">{(comparableInsight.effectiveComparableCount || 0).toFixed(2)}</p></div>
          <div className="metric"><p className="text-xs text-slate-400">Weighted confidence</p><p className="text-sm font-semibold">{Math.round(comparableInsight.weightedSampleConfidence || 0)}</p></div>
          <div className="metric"><p className="text-xs text-slate-400">Reliability</p><p className="text-sm font-semibold">{comparableInsight.diagnostics?.overallComparableReliability || 0}</p></div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Strongest comparable signals</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {comparableInsight.diagnostics?.strongestSignals?.map((signal) => <li key={signal}>{signal}</li>)}
          </ul>
        </div>
        <div className="panel space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Weakest comparable signals</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {comparableInsight.diagnostics?.weakestSignals?.map((signal) => <li key={signal}>{signal}</li>)}
          </ul>
        </div>
      </div>

      <div className="panel space-y-2 text-sm text-slate-300">
        <p>Neighborhood coverage: {comparableInsight.diagnostics?.neighborhoodCoverage ?? 0}</p>
        <p>Room-match strength: {comparableInsight.diagnostics?.roomMatchStrength ?? 0}</p>
        <p>Size-match strength: {comparableInsight.diagnostics?.sizeMatchStrength ?? 0}</p>
        <p>Recency strength: {comparableInsight.diagnostics?.recencyStrength ?? 0}</p>
      </div>


      <div className="panel space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Parser explainability</p>
        <p className="text-sm text-slate-300">Provider: {item.parserProvider} • Status: {item.parserStatus}</p>
        <p className="text-sm text-slate-300">Manual fallback used: {parserMetadata.manualFallbackUsed ? "Yes" : "No"}</p>
        <p className="text-sm text-slate-300">Extracted fields: {parserMetadata.extractedFields.length ? parserMetadata.extractedFields.join(", ") : "None"}</p>
        <p className="text-sm text-slate-300">Missing fields: {parserMetadata.missingFields.length ? parserMetadata.missingFields.join(", ") : "None"}</p>
      </div>

      <div className="panel space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Classification rationale</p>
        <p className="text-sm text-slate-300">{item.classificationReason}</p>
        <p className="text-xs text-slate-400">Parser status: {item.parserStatus} {item.isPartial ? "(partial analysis)" : "(full analysis)"}</p>
      </div>

      <div className="panel space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Factor-by-factor score breakdown</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {breakdownLabels.map(([key, label]) => (
            <div key={key} className="metric flex items-center justify-between text-sm">
              <span className="text-slate-300">{label}</span>
              <span className="font-semibold text-slate-100">{breakdown?.[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
