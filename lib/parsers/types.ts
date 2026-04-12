import { ListingInput } from "@/lib/types";

export type ParserProvider = "sahibinden" | "hepsiemlak" | "emlakjet" | "unknown";
export type ParserStatus = "supported" | "partial" | "unsupported" | "failed";

export type ParsedListingData = Partial<ListingInput>;

export type ParserResult = {
  provider: ParserProvider;
  status: ParserStatus;
  extracted: ParsedListingData;
  missingFields: string[];
  warnings: string[];
  usedMockData: boolean;
};

export type ProviderParser = {
  provider: Exclude<ParserProvider, "unknown">;
  canHandle: (url: URL) => boolean;
  parseListing: (url: URL, options?: { rawHtml?: string }) => Promise<ParserResult>;
  parseListing: (url: URL) => Promise<ParserResult>;
};
