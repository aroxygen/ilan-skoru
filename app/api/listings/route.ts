import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const sortMap: Record<string, Prisma.ListingAnalysisOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  score: { score: "desc" },
  edge: { negotiationEdge: "desc" },
  fatigue: { sellerFatigueIndex: "desc" }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "newest";
  const classification = searchParams.get("classification");
  const action = searchParams.get("action");

  const where: Prisma.ListingAnalysisWhereInput = {
    ...(classification && classification !== "ALL" ? { classification } : {}),
    ...(action && action !== "ALL" ? { action } : {})
  };

  const listings = await prisma.listingAnalysis.findMany({
    where,
    orderBy: sortMap[sort] ?? sortMap.newest,
    include: { comparables: true }
  });

  return NextResponse.json(listings);
}
