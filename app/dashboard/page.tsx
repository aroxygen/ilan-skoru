import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AnalysisResultCard } from "@/components/analysis-result-card";

const sortMap: Record<string, Prisma.ListingAnalysisOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  score: { score: "desc" },
  edge: { negotiationEdge: "desc" },
  fatigue: { sellerFatigueIndex: "desc" }
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const classification = typeof params.classification === "string" ? params.classification : "ALL";
  const action = typeof params.action === "string" ? params.action : "ALL";

  const where: Prisma.ListingAnalysisWhereInput = {
    ...(classification !== "ALL" ? { classification } : {}),
    ...(action !== "ALL" ? { action } : {})
  };

  const listings = await prisma.listingAnalysis.findMany({
    where,
    orderBy: sortMap[sort] ?? sortMap.newest
  });

  return (
    <section className="space-y-5">
      <div className="panel space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Saved Analyses</h1>
          <p className="mt-2 text-sm text-slate-300">Filter and rank opportunities by score, fatigue, and negotiation edge.</p>
        </div>

        <form className="grid gap-2 sm:grid-cols-3">
          <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-sm">
            <option value="newest">Sort: newest</option>
            <option value="score">Sort: highest score</option>
            <option value="edge">Sort: highest negotiation edge</option>
            <option value="fatigue">Sort: highest seller fatigue</option>
          </select>

          <select name="classification" defaultValue={classification} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-sm">
            <option value="ALL">Class: all</option>
            <option value="Fresh">Fresh</option>
            <option value="Fair">Fair</option>
            <option value="Tired Alpha">Tired Alpha</option>
            <option value="Trap">Trap</option>
          </select>

          <select name="action" defaultValue={action} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-sm">
            <option value="ALL">Action: all</option>
            <option value="BUY">BUY</option>
            <option value="NEGOTIATE">NEGOTIATE</option>
            <option value="IGNORE">IGNORE</option>
          </select>

          <button className="rounded-lg bg-terminal-500 px-3 py-2 text-sm font-semibold text-slate-900 sm:col-span-3">Apply filters</button>
        </form>
      </div>

      <div className="grid gap-3">
        {listings.map((item) => (
          <Link key={item.id} href={`/listings/${item.id}`} className="block transition hover:opacity-95">
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
              compact
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
