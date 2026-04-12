import { AnalysisOutput, ComparableInsight, NormalizedListingInput } from "@/lib/types";
import { buildWeightedComparableInsight } from "@/lib/comparable-weighting";

const WEAK_DESCRIPTION_KEYWORDS = ["urgent", "need to sell", "price dropped", "as is", "motivated", "quick sale", "negotiable"];
const HYPE_KEYWORDS = ["luxury", "exclusive", "premium", "perfect", "dream", "invest now"];
const RISK_KEYWORDS = ["cash only", "no title", "tenant issue", "structural", "legal dispute"];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

type FactorResult = { delta: number; helped?: string; hurt?: string };
type PriceMarketResult = { factor: FactorResult; insight: ComparableInsight; confidenceImpact: number };

function ageFactor(listingAgeDays: number): FactorResult {
  if (listingAgeDays >= 90) return { delta: 16, helped: "Long listing age indicates strong seller fatigue." };
  if (listingAgeDays >= 45) return { delta: 8, helped: "Moderate listing age suggests negotiation room." };
  return { delta: -6, hurt: "Fresh listing usually has less urgency from seller." };
}

function marketDeltaFromDeviation(deviationPct: number, sampleQuality: ComparableInsight["sampleQuality"]) {
  const maxDelta = sampleQuality === "strong" ? 18 : sampleQuality === "moderate" ? 11 : 5;
  if (deviationPct >= 12) return maxDelta;
  if (deviationPct >= 4) return Math.round(maxDelta * 0.6);
  if (deviationPct <= -10) return -maxDelta;
  if (deviationPct <= -4) return -Math.round(maxDelta * 0.6);
  return 0;
}

function priceVsMarketFactor(input: NormalizedListingInput): PriceMarketResult {
  const insight = buildWeightedComparableInsight(input, input.comparableMedianPricePerM2);
  const delta = marketDeltaFromDeviation(insight.deviationPct, insight.sampleQuality);

  const factor: FactorResult = { delta };
  if (delta > 0) factor.helped = "Weighted local benchmark suggests listing is under market.";
  if (delta < 0) factor.hurt = "Weighted local benchmark suggests listing is above market.";
  if (insight.sampleQuality === "thin") {
    factor.hurt = `${factor.hurt ? `${factor.hurt} ` : ""}Comparable reliability is thin; pricing claim softened.`;
  }

  return { factor, insight, confidenceImpact: insight.sampleQualityImpact };
}

function priceChangeFactor(price: number, previousPrice?: number): FactorResult {
  if (!previousPrice || previousPrice <= price) return { delta: 0 };
  const dropPct = ((previousPrice - price) / previousPrice) * 100;
  return dropPct >= 10
    ? { delta: 10, helped: "Large price cut history suggests willingness to close." }
    : { delta: 5, helped: "Price cut history suggests potential negotiation flexibility." };
}

function descriptionFactors(description: string) {
  const text = description.toLowerCase();
  const weaknessHits = WEAK_DESCRIPTION_KEYWORDS.filter((k) => text.includes(k)).length;
  const hypeHits = HYPE_KEYWORDS.filter((k) => text.includes(k)).length;
  const riskHits = RISK_KEYWORDS.filter((k) => text.includes(k)).length;

  return {
    weaknessScore: weaknessHits * 3,
    riskPenalty: -(riskHits * 8),
    hypePenalty: -(hypeHits * 4),
    weaknessHits,
    hypeHits,
    riskHits
  };
}

function sellerTypeFactor(sellerType: NormalizedListingInput["sellerType"]): FactorResult {
  if (sellerType === "OWNER") return { delta: 8, helped: "Owner-led listing may accept flexible terms." };
  if (sellerType === "AGENT") return { delta: -8, hurt: "Agent-managed listings are often priced efficiently." };
  if (sellerType === "DEVELOPER") return { delta: -5, hurt: "Developer inventory can be less negotiable." };
  return { delta: 0, hurt: "Seller type unknown; lower interpretability." };
}

function marketMismatchFactor(location: string, squareMeters: number): FactorResult {
  const mismatch = squareMeters > 180 && location.toLowerCase().includes("central");
  return mismatch ? { delta: 7, helped: "Niche size-location mismatch can increase leverage." } : { delta: 0 };
}

function missingFieldsCount(input: NormalizedListingInput) {
  return [
    !input.title || input.title === "Untitled listing",
    !input.location || input.location === "Unknown location",
    !input.description,
    input.comparables.length === 0 && !Number.isFinite(input.comparableMedianPricePerM2 ?? NaN),
    !Number.isFinite(input.previousPrice ?? NaN),
    input.sellerType === "UNKNOWN"
  ].filter(Boolean).length;
}

export function normalizeListingInput(input: Partial<NormalizedListingInput>): NormalizedListingInput {
  return {
    title: (input.title || "Untitled listing").trim(),
    url: input.url,
    price: Number(input.price || 0),
    location: (input.location || "Unknown location").trim(),
    district: (input.district || "Unknown district").trim(),
    neighborhood: (input.neighborhood || "Unknown neighborhood").trim(),
    propertyType: (input.propertyType || "Unknown property").trim(),
    roomCount: (input.roomCount || "Unknown").trim(),
    buildingAge: input.buildingAge,
    floorInfo: input.floorInfo,
    squareMeters: Number(input.squareMeters || 0),
    listingAgeDays: Number(input.listingAgeDays || 0),
    description: (input.description || "").trim(),
    comparableMedianPricePerM2: input.comparableMedianPricePerM2,
    previousPrice: input.previousPrice,
    sellerType: input.sellerType || "UNKNOWN",
    comparables: input.comparables || []
  };
}

export function analyzeListing(input: NormalizedListingInput): AnalysisOutput {
  const baseScore = 50;
  const helpedSignals: string[] = [];
  const hurtSignals: string[] = [];

  const age = ageFactor(input.listingAgeDays);
  if (age.helped) helpedSignals.push(age.helped);
  if (age.hurt) hurtSignals.push(age.hurt);

  const market = priceVsMarketFactor(input);
  if (market.factor.helped) helpedSignals.push(market.factor.helped);
  if (market.factor.hurt) hurtSignals.push(market.factor.hurt);
  helpedSignals.push(...market.insight.diagnostics.strongestSignals.slice(0, 1));
  hurtSignals.push(...market.insight.diagnostics.weakestSignals.slice(0, 1));

  const priceChange = priceChangeFactor(input.price, input.previousPrice);
  if (priceChange.helped) helpedSignals.push(priceChange.helped);

  const desc = descriptionFactors(input.description);
  if (desc.weaknessHits > 0) helpedSignals.push("Weak seller positioning language was detected.");
  if (desc.hypeHits > 0) hurtSignals.push("Polished hype language reduced inefficiency edge.");
  if (desc.riskHits > 0) hurtSignals.push("Risk signals detected in listing description.");

  const seller = sellerTypeFactor(input.sellerType);
  if (seller.helped) helpedSignals.push(seller.helped);
  if (seller.hurt) hurtSignals.push(seller.hurt);

  const mismatch = marketMismatchFactor(input.location, input.squareMeters);
  if (mismatch.helped) helpedSignals.push(mismatch.helped);

  const preConfidenceScore =
    baseScore + age.delta + market.factor.delta + priceChange.delta + desc.weaknessScore + desc.hypePenalty + desc.riskPenalty + seller.delta + mismatch.delta;

  const missingPenalty = missingFieldsCount(input);
  const confidenceScore = clamp(Math.round(92 - missingPenalty * 11 - desc.riskHits * 4 + market.confidenceImpact));
  const confidenceAdjustment = Math.round((confidenceScore - 75) / 6);

  const score = clamp(Math.round(preConfidenceScore + confidenceAdjustment));
  const sellerFatigueIndex = clamp(Math.round(input.listingAgeDays * 0.7 + (input.previousPrice && input.previousPrice > input.price ? 15 : 0)));
  const negotiationEdge = clamp(Math.round(score * 0.55 + sellerFatigueIndex * 0.45 - desc.riskHits * 10));

  let classification: AnalysisOutput["classification"] = "Fair";
  let classificationReason = "Signals are mixed; opportunity exists but edge is moderate.";
  if (score < 45 || desc.riskHits >= 2) {
    classification = "Trap";
    classificationReason = "Score is low or risk density is high, which outweighs negotiation upside.";
  } else if (score >= 70 && input.listingAgeDays >= 60) {
    classification = "Tired Alpha";
    classificationReason = "High score plus clear fatigue profile indicates strong mispricing potential.";
  } else if (score >= 65) {
    classification = "Fresh";
    classificationReason = "Strong raw quality with less fatigue; attractive but less distressed.";
  }

  let action: AnalysisOutput["action"] = "NEGOTIATE";
  if (score < 50) action = "IGNORE";
  else if (score > 70 && classification === "Tired Alpha") action = "BUY";

  const negotiationMin = Math.round(input.price * (0.82 - sellerFatigueIndex / 1000));
  const negotiationMax = Math.round(input.price * (0.93 - negotiationEdge / 1500));

  return {
    score,
    classification,
    explanation: [helpedSignals[0], hurtSignals[0]].filter(Boolean).join(" "),
    negotiationMin: Math.max(0, Math.min(negotiationMin, input.price)),
    negotiationMax: Math.max(0, Math.min(negotiationMax, input.price)),
    action,
    sellerFatigueIndex,
    negotiationEdge,
    confidenceScore,
    signals: [...helpedSignals, ...hurtSignals],
    helpedSignals,
    hurtSignals,
    classificationReason,
    scoreBreakdown: {
      baseScore,
      ageScore: age.delta,
      priceVsMarketScore: market.factor.delta,
      priceChangeScore: priceChange.delta,
      descriptionWeaknessScore: desc.weaknessScore + desc.hypePenalty,
      sellerTypeScore: seller.delta,
      marketMismatchScore: mismatch.delta,
      riskPenalty: desc.riskPenalty,
      confidenceAdjustment,
      finalScore: score
    },
    comparableInsight: market.insight,
    parserStatus: "unsupported",
    parserProvider: "unknown",
    parserMetadata: {
      provider: "unknown",
      status: "unsupported",
      extractedFields: [],
      missingFields: [],
      manualFallbackUsed: false,
      usedMockData: false,
      warnings: []
    },
    isPartial: false,
    urlIngestionNotes: []
  };
}
