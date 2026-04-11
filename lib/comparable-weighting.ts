import { ComparableInsight, ComparableListingInput, NormalizedListingInput } from "@/lib/types";

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function parseRoomCount(roomCount: string) {
  const base = Number(roomCount.split("+")[0]);
  return Number.isFinite(base) ? base : 0;
}

function parseFloor(floorInfo?: string) {
  if (!floorInfo) return undefined;
  const first = Number(floorInfo.split("/")[0]);
  return Number.isFinite(first) ? first : undefined;
}

function metricScores(listing: NormalizedListingInput, comp: ComparableListingInput) {
  const district = comp.district.toLowerCase() === listing.district.toLowerCase() ? 1 : 0.55;

  const neighborhood = comp.neighborhood.toLowerCase() === listing.neighborhood.toLowerCase()
    ? 1
    : comp.district.toLowerCase() === listing.district.toLowerCase()
      ? 0.65
      : 0.45;

  const propertyType = comp.propertyType.toLowerCase() === listing.propertyType.toLowerCase() ? 1 : 0.65;

  const listingRooms = parseRoomCount(listing.roomCount);
  const compRooms = parseRoomCount(comp.roomCount);
  const roomDiff = Math.abs(listingRooms - compRooms);
  const room = listingRooms > 0 && compRooms > 0 ? clamp(1 - roomDiff * 0.25, 0.4, 1) : 0.65;

  const sizeDiffPct = Math.abs(comp.grossSquareMeters - listing.squareMeters) / Math.max(1, listing.squareMeters);
  const size = clamp(1 - sizeDiffPct * 1.2, 0.35, 1);

  const building = listing.buildingAge != null && comp.buildingAge != null
    ? clamp(1 - Math.abs(comp.buildingAge - listing.buildingAge) / 30, 0.45, 1)
    : 0.72;

  const listingFloor = parseFloor(listing.floorInfo);
  const compFloor = parseFloor(comp.floorInfo);
  const floor = listingFloor != null && compFloor != null
    ? clamp(1 - Math.abs(compFloor - listingFloor) / 15, 0.45, 1)
    : 0.72;

  const recency = clamp(1 - comp.listingAgeDays / 180, 0.4, 1);

  return { district, neighborhood, propertyType, room, size, building, floor, recency };
}

function compositeWeight(scores: ReturnType<typeof metricScores>) {
  return (
    scores.district * 0.18 +
    scores.neighborhood * 0.18 +
    scores.propertyType * 0.14 +
    scores.room * 0.12 +
    scores.size * 0.14 +
    scores.building * 0.08 +
    scores.floor * 0.06 +
    scores.recency * 0.1
  );
}

export function buildWeightedComparableInsight(
  listing: NormalizedListingInput,
  fallbackMedian?: number
): ComparableInsight {
  const validComparables = listing.comparables.filter((item) => item.pricePerSquareMeter > 0);
  const listingPricePerM2 = listing.price / Math.max(1, listing.squareMeters);

  if (validComparables.length === 0 && (!fallbackMedian || fallbackMedian <= 0)) {
    return {
      weightedLocalAvgPricePerM2: 0,
      listingPricePerM2,
      deviationPct: 0,
      sampleSize: 0,
      effectiveComparableCount: 0,
      weightedSampleConfidence: 20,
      sampleQuality: "none",
      sampleQualityImpact: -16,
      source: "none",
      diagnostics: {
        neighborhoodCoverage: 0,
        roomMatchStrength: 0,
        sizeMatchStrength: 0,
        recencyStrength: 0,
        overallComparableReliability: 0,
        strongestSignals: ["No comparable dataset available."],
        weakestSignals: ["Missing comparable data forces neutral market benchmark."]
      }
    };
  }

  if (validComparables.length === 0 && fallbackMedian && fallbackMedian > 0) {
    return {
      weightedLocalAvgPricePerM2: fallbackMedian,
      listingPricePerM2,
      deviationPct: ((fallbackMedian - listingPricePerM2) / fallbackMedian) * 100,
      sampleSize: 0,
      effectiveComparableCount: 1,
      weightedSampleConfidence: 38,
      sampleQuality: "thin",
      sampleQualityImpact: -9,
      source: "fallback",
      diagnostics: {
        neighborhoodCoverage: 35,
        roomMatchStrength: 45,
        sizeMatchStrength: 45,
        recencyStrength: 35,
        overallComparableReliability: 38,
        strongestSignals: ["Fallback district median provided."],
        weakestSignals: ["No direct comparable records; fallback treated as low reliability."]
      }
    };
  }

  const evaluations = validComparables.map((comp) => {
    const scores = metricScores(listing, comp);
    const weight = compositeWeight(scores);
    return { comp, scores, weight };
  });

  const totalWeight = evaluations.reduce((sum, item) => sum + item.weight, 0);
  const weightedPriceSum = evaluations.reduce((sum, item) => sum + item.comp.pricePerSquareMeter * item.weight, 0);
  const weightedLocalAvgPricePerM2 = weightedPriceSum / Math.max(0.0001, totalWeight);
  const deviationPct = ((weightedLocalAvgPricePerM2 - listingPricePerM2) / weightedLocalAvgPricePerM2) * 100;

  const sumWeightsSq = evaluations.reduce((sum, item) => sum + item.weight * item.weight, 0);
  const effectiveComparableCount = (totalWeight * totalWeight) / Math.max(0.0001, sumWeightsSq);

  const weightedSignal = evaluations.reduce(
    (acc, item) => {
      acc.neighborhood += item.scores.neighborhood * item.weight;
      acc.room += item.scores.room * item.weight;
      acc.size += item.scores.size * item.weight;
      acc.recency += item.scores.recency * item.weight;
      acc.reliability += item.weight;
      return acc;
    },
    { neighborhood: 0, room: 0, size: 0, recency: 0, reliability: 0 }
  );

  const neighborhoodCoverage = Math.round((weightedSignal.neighborhood / Math.max(0.0001, weightedSignal.reliability)) * 100);
  const roomMatchStrength = Math.round((weightedSignal.room / Math.max(0.0001, weightedSignal.reliability)) * 100);
  const sizeMatchStrength = Math.round((weightedSignal.size / Math.max(0.0001, weightedSignal.reliability)) * 100);
  const recencyStrength = Math.round((weightedSignal.recency / Math.max(0.0001, weightedSignal.reliability)) * 100);

  const reliabilityBase = Math.round((0.5 * Math.min(1, effectiveComparableCount / 6) + 0.5 * totalWeight / evaluations.length) * 100);
  const overallComparableReliability = Math.round((reliabilityBase + neighborhoodCoverage + roomMatchStrength + sizeMatchStrength + recencyStrength) / 5);

  const sampleQuality = overallComparableReliability >= 75 ? "strong" : overallComparableReliability >= 55 ? "moderate" : "thin";
  const sampleQualityImpact = sampleQuality === "strong" ? 1 : sampleQuality === "moderate" ? -4 : -11;
  const weightedSampleConfidence = clamp(overallComparableReliability / 100, 0, 1) * 100;

  const strongestSignals: string[] = [];
  const weakestSignals: string[] = [];

  if (neighborhoodCoverage >= 75) strongestSignals.push("Strong neighborhood alignment across comparables.");
  if (roomMatchStrength >= 75) strongestSignals.push("Comparable room-count profile is closely aligned.");
  if (sizeMatchStrength >= 75) strongestSignals.push("Gross square meter proximity is strong.");
  if (recencyStrength >= 70) strongestSignals.push("Comparable listings are relatively recent.");

  if (neighborhoodCoverage < 60) weakestSignals.push("Neighborhood coverage is weak or mixed.");
  if (roomMatchStrength < 60) weakestSignals.push("Room-count similarity is limited.");
  if (sizeMatchStrength < 60) weakestSignals.push("Size matching is weak.");
  if (recencyStrength < 55) weakestSignals.push("Comparable listings are stale.");

  if (strongestSignals.length === 0) strongestSignals.push("No single matching dimension is dominant.");
  if (weakestSignals.length === 0) weakestSignals.push("No major quality weakness detected.");

  return {
    weightedLocalAvgPricePerM2,
    listingPricePerM2,
    deviationPct,
    sampleSize: validComparables.length,
    effectiveComparableCount,
    weightedSampleConfidence,
    sampleQuality,
    sampleQualityImpact,
    source: "weighted_snapshot",
    diagnostics: {
      neighborhoodCoverage,
      roomMatchStrength,
      sizeMatchStrength,
      recencyStrength,
      overallComparableReliability,
      strongestSignals,
      weakestSignals
    }
  };
}
