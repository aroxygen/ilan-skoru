import { NextResponse } from "next/server";
import { SellerType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeListing, normalizeListingInput } from "@/lib/scoring";
import { ListingInput, ParserMetadata } from "@/lib/types";
import { detectProvider, normalizeParsedListing, parseListing } from "@/lib/parsers";
import { upsertWatchlistFromAnalysis } from "@/lib/watchlist";

export async function POST(request: Request) {
  const body = (await request.json()) as ListingInput;

  const detectedProvider = detectProvider(body.url);
  const parseResult = await parseListing(body.url);
  const parsedNormalized = normalizeParsedListing(parseResult.extracted);

  // Manual input should override parser-extracted values.
  const merged = {
    ...parsedNormalized,
    ...body
  };

  const manualProvidedKeys = Object.entries(body).filter(([, value]) => value !== undefined && value !== "" && value !== 0).map(([key]) => key);
  const extractedKeys = Object.entries(parsedNormalized).filter(([, value]) => value !== undefined && value !== "" && value !== 0).map(([key]) => key);
  const manualFallbackUsed = extractedKeys.some((key) => manualProvidedKeys.includes(key));

  const hasManualCore = Boolean(merged.title && merged.location && merged.description && merged.price && merged.squareMeters);
  if (!hasManualCore && !body.url) {
    return NextResponse.json({ error: "Missing required fields (or provide a URL for partial ingestion)." }, { status: 400 });
  }

  const normalized = normalizeListingInput({
    title: merged.title,
    url: body.url,
    price: merged.price,
    location: merged.location,
    district: merged.district,
    neighborhood: merged.neighborhood,
    propertyType: merged.propertyType,
    roomCount: merged.roomCount,
    buildingAge: merged.buildingAge,
    floorInfo: merged.floorInfo,
    squareMeters: merged.squareMeters,
    listingAgeDays: merged.listingAgeDays,
    description: merged.description,
    comparableMedianPricePerM2: merged.comparableMedianPricePerM2,
    previousPrice: merged.previousPrice,
    sellerType: merged.sellerType,
    comparables: merged.comparables
  });

  const result = analyzeListing(normalized);

  const parserMetadata: ParserMetadata = {
    provider: parseResult.provider,
    status: parseResult.status,
    extractedFields: extractedKeys,
    missingFields: parseResult.missingFields,
    manualFallbackUsed,
    usedMockData: parseResult.usedMockData,
    warnings: parseResult.warnings
  };

  const created = await prisma.listingAnalysis.create({
    data: {
      url: normalized.url,
      title: normalized.title,
      price: normalized.price,
      location: normalized.location,
      district: normalized.district,
      neighborhood: normalized.neighborhood,
      propertyType: normalized.propertyType,
      roomCount: normalized.roomCount,
      buildingAge: normalized.buildingAge,
      floorInfo: normalized.floorInfo,
      squareMeters: normalized.squareMeters,
      listingAgeDays: normalized.listingAgeDays,
      description: normalized.description,
      comparableMedianPricePerM2: normalized.comparableMedianPricePerM2,
      previousPrice: normalized.previousPrice,
      sellerType: (normalized.sellerType as SellerType) ?? SellerType.UNKNOWN,
      ...result,
      parserProvider: parseResult.provider,
      parserStatus: parseResult.status,
      parserMetadata,
      isPartial: parseResult.status === "partial" || parseResult.status === "failed" || !hasManualCore,
      urlIngestionNotes: [
        `Detected provider: ${detectedProvider}`,
        ...parseResult.warnings
      ],
      comparables: {
        create: normalized.comparables.map((item) => ({
          district: item.district,
          neighborhood: item.neighborhood,
          propertyType: item.propertyType,
          grossSquareMeters: item.grossSquareMeters,
          netSquareMeters: item.netSquareMeters,
          roomCount: item.roomCount,
          buildingAge: item.buildingAge,
          floorInfo: item.floorInfo,
          listingAgeDays: item.listingAgeDays,
          askingPrice: item.askingPrice,
          pricePerSquareMeter: item.pricePerSquareMeter
        }))
      }
    },
    include: { comparables: true }
  });


  const existingWatchlist = await prisma.watchlistItem.findFirst({
    where: normalized.url ? { canonicalUrl: normalized.url } : { title: normalized.title, location: normalized.location }
  });

  if (existingWatchlist) {
    await upsertWatchlistFromAnalysis(created.id);
  }

  return NextResponse.json(created, { status: 201 });
}
