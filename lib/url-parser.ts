import { ListingInput } from "@/lib/types";

export type UrlParseResult = {
  status: "MANUAL" | "URL_UNSUPPORTED";
  partial: boolean;
  notes: string[];
  parsedFields: Partial<ListingInput>;
};

export function runUrlIngestionPipeline(url?: string): UrlParseResult {
  if (!url) {
    return {
      status: "MANUAL",
      partial: false,
      notes: ["Manual input path used."],
      parsedFields: {}
    };
  }

  return {
    status: "URL_UNSUPPORTED",
    partial: true,
    notes: [
      "URL detected and ingestion pipeline invoked.",
      "Parser connector is not implemented yet; no fields were auto-extracted.",
      "Analysis saved as partial without hallucinated extracted data."
    ],
    parsedFields: {}
  };
}
