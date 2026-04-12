import { NextResponse } from "next/server";
import { normalizeParsedListing, parseListing } from "@/lib/parsers";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; rawHtml?: string };
  const parsed = await parseListing(body.url, { rawHtml: body.rawHtml });
  const normalized = normalizeParsedListing(parsed.extracted);

  return NextResponse.json({
    provider: parsed.provider,
    status: parsed.status,
    extracted: normalized,
    extractedFields: Object.entries(normalized)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key]) => key),
    missingFields: parsed.missingFields,
    warnings: parsed.warnings
  });
}
