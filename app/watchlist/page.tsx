import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const sortMap: Record<string, Prisma.WatchlistItemOrderByWithRelationInput> = {
  updated: { updatedAt: "desc" },
  score: { currentScore: "desc" },
  edge: { negotiationEdge: "desc" },
  fatigue: { sellerFatigueIndex: "desc" }
};

export default async function WatchlistPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = typeof params.sort === "string" ? params.sort : "updated";
  const action = typeof params.action === "string" ? params.action : "ALL";
  const classification = typeof params.classification === "string" ? params.classification : "ALL";

  const items = await prisma.watchlistItem.findMany({
    where: {
      ...(action !== "ALL" ? { currentAction: action } : {}),
      ...(classification !== "ALL" ? { currentClassification: classification } : {})
    },
    orderBy: sortMap[sort] ?? sortMap.updated,
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  return (
    <section className="space-y-5">
      <div className="panel space-y-3">
        <h1 className="text-xl font-semibold">Watchlist</h1>
        <p className="text-sm text-slate-300">Track listings over time and prepare alert-ready decisions.</p>
        <form className="grid gap-2 sm:grid-cols-3">
          <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-sm">
            <option value="updated">Sort: latest update</option>
            <option value="score">Sort: highest score</option>
            <option value="edge">Sort: highest negotiation edge</option>
            <option value="fatigue">Sort: highest fatigue</option>
          </select>
          <select name="action" defaultValue={action} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-sm">
            <option value="ALL">Action: all</option>
            <option value="BUY">BUY</option>
            <option value="NEGOTIATE">NEGOTIATE</option>
            <option value="IGNORE">IGNORE</option>
          </select>
          <select name="classification" defaultValue={classification} className="rounded-lg border border-slate-700 bg-terminal-950 px-3 py-2 text-sm">
            <option value="ALL">Class: all</option>
            <option value="Fresh">Fresh</option>
            <option value="Fair">Fair</option>
            <option value="Tired Alpha">Tired Alpha</option>
            <option value="Trap">Trap</option>
          </select>
          <button className="rounded-lg bg-terminal-500 px-3 py-2 text-sm font-semibold text-slate-900 sm:col-span-3">Apply filters</button>
        </form>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const latestFlags = item.snapshots[0]?.eventFlags ?? [];
          return (
            <article key={item.id} className="panel space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-terminal-300">{item.title}</h2>
                <span className="text-xs text-slate-400">Updated: {item.lastAnalyzedAt.toISOString().slice(0, 10)}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="metric text-sm">Score: {item.currentScore}</div>
                <div className="metric text-sm">Action: {item.currentAction}</div>
                <div className="metric text-sm">Class: {item.currentClassification}</div>
                <div className="metric text-sm">Price: {item.latestAskingPrice.toLocaleString()}</div>
                <div className="metric text-sm">Price/m²: {item.latestPricePerM2.toLocaleString()}</div>
                <div className="metric text-sm">Edge: {item.negotiationEdge}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestFlags.length === 0 ? (
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">No new alert flags</span>
                ) : (
                  latestFlags.map((flag) => (
                    <span key={flag} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                      {flag}
                    </span>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
