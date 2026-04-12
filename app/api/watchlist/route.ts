import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { upsertWatchlistFromAnalysis } from "@/lib/watchlist";

const sortMap: Record<string, Prisma.WatchlistItemOrderByWithRelationInput> = {
  updated: { updatedAt: "desc" },
  score: { currentScore: "desc" },
  edge: { negotiationEdge: "desc" },
  fatigue: { sellerFatigueIndex: "desc" }
};

export async function POST(request: Request) {
  const body = (await request.json()) as { listingAnalysisId?: string };
  if (!body.listingAnalysisId) {
    return NextResponse.json({ error: "listingAnalysisId is required" }, { status: 400 });
  }

  const watchlistItem = await upsertWatchlistFromAnalysis(body.listingAnalysisId);
  return NextResponse.json(watchlistItem, { status: 201 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const classification = searchParams.get("classification");
  const sort = searchParams.get("sort") || "updated";

  const items = await prisma.watchlistItem.findMany({
    where: {
      ...(action && action !== "ALL" ? { currentAction: action } : {}),
      ...(classification && classification !== "ALL" ? { currentClassification: classification } : {})
    },
    orderBy: sortMap[sort] ?? sortMap.updated,
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  return NextResponse.json(items);
}
