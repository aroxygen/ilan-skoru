import { ListingInput } from "@/lib/types";
import { emlakjetParser } from "@/lib/parsers/providers/emlakjet";
import { hepsiemlakParser } from "@/lib/parsers/providers/hepsiemlak";
import { sahibindenParser } from "@/lib/parsers/providers/sahibinden";
import { ParserProvider, ParserResult, ProviderParser } from "@/lib/parsers/types";

const PROVIDERS: ProviderParser[] = [sahibindenParser, hepsiemlakParser, emlakjetParser];

export function detectProvider(urlRaw?: string): ParserProvider {
  if (!urlRaw) return "unknown";

  try {
    const url = new URL(urlRaw);
    const match = PROVIDERS.find((provider) => provider.canHandle(url));
    return match?.provider ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function parseListing(urlRaw?: string, options?: { rawHtml?: string }): Promise<ParserResult> {
export async function parseListing(urlRaw?: string): Promise<ParserResult> {
  if (!urlRaw) {
    return {
      provider: "unknown",
      status: "unsupported",
      extracted: {},
      missingFields: [],
      warnings: ["No URL provided; parser was not invoked."],
      usedMockData: false
    };
  }

  let url: URL;
  try {
    url = new URL(urlRaw);
  } catch {
    return {
      provider: "unknown",
      status: "failed",
      extracted: {},
      missingFields: ["url"],
      warnings: ["URL format is invalid."],
      usedMockData: false
    };
  }

  const parser = PROVIDERS.find((provider) => provider.canHandle(url));
  if (!parser) {
    return {
      provider: "unknown",
      status: "unsupported",
      extracted: {},
      missingFields: ["provider"],
      warnings: ["No provider parser available for this URL."],
      usedMockData: false
    };
  }

  return parser.parseListing(url, options);
  return parser.parseListing(url);
}

export function normalizeParsedListing(parsed: ParserResult["extracted"]): Partial<ListingInput> {
  return {
    title: typeof parsed.title === "string" ? parsed.title.trim() : undefined,
    price: typeof parsed.price === "number" ? parsed.price : undefined,
    location: typeof parsed.location === "string" ? parsed.location.trim() : undefined,
    district: typeof parsed.district === "string" ? parsed.district.trim() : undefined,
    neighborhood: typeof parsed.neighborhood === "string" ? parsed.neighborhood.trim() : undefined,
    propertyType: typeof parsed.propertyType === "string" ? parsed.propertyType.trim() : undefined,
    roomCount: typeof parsed.roomCount === "string" ? parsed.roomCount.trim() : undefined,
    buildingAge: typeof parsed.buildingAge === "number" ? parsed.buildingAge : undefined,
    floorInfo: typeof parsed.floorInfo === "string" ? parsed.floorInfo.trim() : undefined,
    squareMeters: typeof parsed.squareMeters === "number" ? parsed.squareMeters : undefined,
    listingAgeDays: typeof parsed.listingAgeDays === "number" ? parsed.listingAgeDays : undefined,
    description: typeof parsed.description === "string" ? parsed.description.trim() : undefined,
    sellerType: parsed.sellerType,
    comparableMedianPricePerM2:
      typeof parsed.comparableMedianPricePerM2 === "number" ? parsed.comparableMedianPricePerM2 : undefined,
    previousPrice: typeof parsed.previousPrice === "number" ? parsed.previousPrice : undefined,
    comparables: Array.isArray(parsed.comparables) ? parsed.comparables : undefined
  };
}
