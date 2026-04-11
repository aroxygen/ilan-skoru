export type SellerType = "OWNER" | "AGENT" | "DEVELOPER" | "UNKNOWN";

export type ComparableListingInput = {
  district: string;
  neighborhood: string;
  propertyType: string;
  grossSquareMeters: number;
  netSquareMeters?: number;
  roomCount: string;
  buildingAge?: number;
  floorInfo?: string;
  listingAgeDays: number;
  askingPrice: number;
  pricePerSquareMeter: number;
};

export type ListingInput = {
  title?: string;
  url?: string;
  price?: number;
  location?: string;
  district?: string;
  neighborhood?: string;
  propertyType?: string;
  roomCount?: string;
  buildingAge?: number;
  floorInfo?: string;
  squareMeters?: number;
  listingAgeDays?: number;
  description?: string;
  comparableMedianPricePerM2?: number;
  previousPrice?: number;
  sellerType?: SellerType;
  comparables?: ComparableListingInput[];
};

export type NormalizedListingInput = {
  title: string;
  url?: string;
  price: number;
  location: string;
  district: string;
  neighborhood: string;
  propertyType: string;
  roomCount: string;
  buildingAge?: number;
  floorInfo?: string;
  squareMeters: number;
  listingAgeDays: number;
  description: string;
  comparableMedianPricePerM2?: number;
  previousPrice?: number;
  sellerType: SellerType;
  comparables: ComparableListingInput[];
};

export type Classification = "Fresh" | "Fair" | "Tired Alpha" | "Trap";
export type Action = "IGNORE" | "NEGOTIATE" | "BUY";

export type ComparableDiagnostics = {
  neighborhoodCoverage: number;
  roomMatchStrength: number;
  sizeMatchStrength: number;
  recencyStrength: number;
  overallComparableReliability: number;
  strongestSignals: string[];
  weakestSignals: string[];
};

export type ComparableInsight = {
  weightedLocalAvgPricePerM2: number;
  listingPricePerM2: number;
  deviationPct: number;
  sampleSize: number;
  effectiveComparableCount: number;
  weightedSampleConfidence: number;
  sampleQuality: "none" | "thin" | "moderate" | "strong";
  sampleQualityImpact: number;
  source: "weighted_snapshot" | "fallback" | "none";
  diagnostics: ComparableDiagnostics;
};

export type ParserMetadata = {
  provider: "sahibinden" | "hepsiemlak" | "emlakjet" | "unknown";
  status: "supported" | "partial" | "unsupported" | "failed";
  extractedFields: string[];
  missingFields: string[];
  manualFallbackUsed: boolean;
  usedMockData: boolean;
  warnings: string[];
};

export type ScoreBreakdown = {
  baseScore: number;
  ageScore: number;
  priceVsMarketScore: number;
  priceChangeScore: number;
  descriptionWeaknessScore: number;
  sellerTypeScore: number;
  marketMismatchScore: number;
  riskPenalty: number;
  confidenceAdjustment: number;
  finalScore: number;
};

export type AnalysisOutput = {
  score: number;
  classification: Classification;
  explanation: string;
  negotiationMin: number;
  negotiationMax: number;
  action: Action;
  sellerFatigueIndex: number;
  negotiationEdge: number;
  confidenceScore: number;
  signals: string[];
  helpedSignals: string[];
  hurtSignals: string[];
  classificationReason: string;
  scoreBreakdown: ScoreBreakdown;
  comparableInsight: ComparableInsight;
  parserStatus: string;
  parserProvider: string;
  parserMetadata: ParserMetadata;
  isPartial: boolean;
  urlIngestionNotes: string[];
};
