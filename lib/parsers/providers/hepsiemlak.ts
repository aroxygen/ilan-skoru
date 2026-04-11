import { ParserResult, ProviderParser } from "@/lib/parsers/types";

const MOCK_FIXTURES: Record<string, ParserResult["extracted"]> = {
  "https://www.hepsiemlak.com/ilan/ornek-1": {
    title: "Hepsiemlak Örnek İlan",
    price: 4980000,
    location: "Atasehir",
    district: "Atasehir",
    neighborhood: "Ataturk",
    propertyType: "Apartment",
    roomCount: "2+1",
    squareMeters: 98,
    description: "Clean apartment, negotiable terms."
  }
};

export const hepsiemlakParser: ProviderParser = {
  provider: "hepsiemlak",
  canHandle: (url) => url.hostname.includes("hepsiemlak.com"),
  parseListing: async (url) => {
    const key = `${url.origin}${url.pathname}`;
    const extracted = MOCK_FIXTURES[key] || {};
    const missingFields = ["title", "price", "location", "squareMeters", "description"].filter((f) => !(f in extracted));

    return {
      provider: "hepsiemlak",
      status: extracted.title ? (missingFields.length > 0 ? "partial" : "supported") : "failed",
      extracted,
      missingFields,
      warnings: extracted.title
        ? ["Parsed via mock hepsiemlak provider fixture."]
        : ["Provider supported, but no mock fixture exists for this URL yet."],
      usedMockData: true
    };
  }
};
