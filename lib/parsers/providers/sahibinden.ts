import { ParserResult, ProviderParser } from "@/lib/parsers/types";

const MOCK_FIXTURES: Record<string, ParserResult["extracted"]> = {
  "https://www.sahibinden.com/ilan/ornek-1": {
    title: "Sahibinden Örnek Daire",
    price: 5750000,
    location: "Kadikoy",
    district: "Kadikoy",
    neighborhood: "Fenerbahce",
    propertyType: "Apartment",
    roomCount: "3+1",
    squareMeters: 125,
    listingAgeDays: 46,
    description: "Owner listing. Price updated recently."
  }
};

export const sahibindenParser: ProviderParser = {
  provider: "sahibinden",
  canHandle: (url) => url.hostname.includes("sahibinden.com"),
  parseListing: async (url) => {
    const key = `${url.origin}${url.pathname}`;
    const extracted = MOCK_FIXTURES[key] || {};
    const missingFields = ["title", "price", "location", "squareMeters", "description"].filter((f) => !(f in extracted));

    return {
      provider: "sahibinden",
      status: extracted.title ? (missingFields.length > 0 ? "partial" : "supported") : "failed",
      extracted,
      missingFields,
      warnings: extracted.title
        ? ["Parsed via mock sahibinden provider fixture."]
        : ["Provider supported, but no mock fixture exists for this URL yet."],
      usedMockData: true
    };
  }
};
