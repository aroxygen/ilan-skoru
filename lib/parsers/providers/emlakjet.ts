import { ParserResult, ProviderParser } from "@/lib/parsers/types";

const MOCK_FIXTURES: Record<string, ParserResult["extracted"]> = {
  "https://www.emlakjet.com/ilan/ornek-1": {
    title: "Emlakjet Örnek İlan",
    price: 8350000,
    location: "Besiktas",
    district: "Besiktas",
    neighborhood: "Levent",
    propertyType: "Residence",
    roomCount: "3+1",
    squareMeters: 135,
    listingAgeDays: 22,
    description: "Agent listing in residence project."
  }
};

export const emlakjetParser: ProviderParser = {
  provider: "emlakjet",
  canHandle: (url) => url.hostname.includes("emlakjet.com"),
  parseListing: async (url) => {
    const key = `${url.origin}${url.pathname}`;
    const extracted = MOCK_FIXTURES[key] || {};
    const missingFields = ["title", "price", "location", "squareMeters", "description"].filter((f) => !(f in extracted));

    return {
      provider: "emlakjet",
      status: extracted.title ? (missingFields.length > 0 ? "partial" : "supported") : "failed",
      extracted,
      missingFields,
      warnings: extracted.title
        ? ["Parsed via mock emlakjet provider fixture."]
        : ["Provider supported, but no mock fixture exists for this URL yet."],
      usedMockData: true
    };
  }
};
