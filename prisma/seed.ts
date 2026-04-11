import { PrismaClient } from "@prisma/client";
import { analyzeListing, normalizeListingInput } from "../lib/scoring";
import { upsertWatchlistFromAnalysis } from "../lib/watchlist";

const prisma = new PrismaClient();

async function main() {
  const seedInputs = [
    {
      title: "Levent owner sale with recent cut",
      url: "https://example.com/listing/fresh",
      location: "Levent",
      district: "Besiktas",
      neighborhood: "Levent",
      propertyType: "Apartment",
      roomCount: "3+1",
      buildingAge: 10,
      floorInfo: "5/12",
      price: 6400000,
      squareMeters: 120,
      listingAgeDays: 50,
      description: "owner sale, clean documents, ready to close",
      previousPrice: 7000000,
      sellerType: "OWNER" as const,
      comparables: [
        { district: "Besiktas", neighborhood: "Levent", propertyType: "Apartment", grossSquareMeters: 118, netSquareMeters: 98, roomCount: "2+1", buildingAge: 9, floorInfo: "6/12", listingAgeDays: 32, askingPrice: 8100000, pricePerSquareMeter: 68644 },
        { district: "Besiktas", neighborhood: "Levent", propertyType: "Apartment", grossSquareMeters: 125, netSquareMeters: 104, roomCount: "3+1", buildingAge: 11, floorInfo: "4/10", listingAgeDays: 40, askingPrice: 8600000, pricePerSquareMeter: 68800 },
        { district: "Besiktas", neighborhood: "Levent", propertyType: "Apartment", grossSquareMeters: 120, netSquareMeters: 100, roomCount: "2+1", buildingAge: 8, floorInfo: "7/14", listingAgeDays: 26, askingPrice: 8340000, pricePerSquareMeter: 69500 }
      ]
    },
    {
      title: "Levent owner sale with recent cut",
      url: "https://example.com/listing/fresh",
      location: "Levent",
      district: "Besiktas",
      neighborhood: "Levent",
      propertyType: "Apartment",
      roomCount: "3+1",
      buildingAge: 10,
      floorInfo: "5/12",
      price: 6150000,
      squareMeters: 120,
      listingAgeDays: 67,
      description: "owner sale, urgent close, negotiable",
      previousPrice: 6400000,
      sellerType: "OWNER" as const,
      comparables: [
        { district: "Besiktas", neighborhood: "Levent", propertyType: "Apartment", grossSquareMeters: 118, netSquareMeters: 98, roomCount: "2+1", buildingAge: 9, floorInfo: "6/12", listingAgeDays: 28, askingPrice: 8000000, pricePerSquareMeter: 67796 },
        { district: "Besiktas", neighborhood: "Levent", propertyType: "Apartment", grossSquareMeters: 125, netSquareMeters: 104, roomCount: "3+1", buildingAge: 11, floorInfo: "4/10", listingAgeDays: 30, askingPrice: 8450000, pricePerSquareMeter: 67600 },
        { district: "Besiktas", neighborhood: "Etiler", propertyType: "Apartment", grossSquareMeters: 150, netSquareMeters: 124, roomCount: "4+1", buildingAge: 5, floorInfo: "10/20", listingAgeDays: 92, askingPrice: 11000000, pricePerSquareMeter: 73333 }
      ]
    },
    {
      title: "Kadıköy central oversized unit",
      url: "https://example.com/listing/tired-alpha",
      location: "Kadikoy Central",
      district: "Kadikoy",
      neighborhood: "Moda",
      propertyType: "Apartment",
      roomCount: "4+1",
      buildingAge: 22,
      floorInfo: "3/7",
      price: 6200000,
      squareMeters: 190,
      listingAgeDays: 138,
      description: "urgent sale, need to sell, price dropped, owner motivated",
      previousPrice: 7300000,
      sellerType: "OWNER" as const,
      comparables: [
        { district: "Kadikoy", neighborhood: "Moda", propertyType: "Apartment", grossSquareMeters: 180, netSquareMeters: 150, roomCount: "4+1", buildingAge: 21, floorInfo: "2/5", listingAgeDays: 57, askingPrice: 8400000, pricePerSquareMeter: 46666 },
        { district: "Kadikoy", neighborhood: "Moda", propertyType: "Apartment", grossSquareMeters: 195, netSquareMeters: 162, roomCount: "4+1", buildingAge: 25, floorInfo: "1/4", listingAgeDays: 63, askingPrice: 9300000, pricePerSquareMeter: 47692 }
      ]
    }
  ];

  await prisma.notificationDelivery.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.alertSubscription.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.watchlistSnapshot.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.comparableListing.deleteMany();
  await prisma.listingAnalysis.deleteMany();

  const createdIds: string[] = [];

  for (const input of seedInputs) {
    const normalized = normalizeListingInput(input);
    const output = analyzeListing(normalized);
    const created = await prisma.listingAnalysis.create({
      data: {
        ...normalized,
        ...output,
        parserProvider: "unknown",
        parserStatus: "unsupported",
        parserMetadata: {
          provider: "unknown",
          status: "unsupported",
          extractedFields: [],
          missingFields: [],
          manualFallbackUsed: false,
          usedMockData: true,
          warnings: ["Seed data inserted manually."]
        },
        isPartial: false,
        urlIngestionNotes: ["Seeded listing with manual input and comparable snapshot."],
        comparables: { create: normalized.comparables.map((item) => ({ ...item })) }
      }
    });

    createdIds.push(created.id);
  }

  // Create watchlist history snapshots across multiple analyses of same canonical URL.
  await upsertWatchlistFromAnalysis(createdIds[0]);
  await upsertWatchlistFromAnalysis(createdIds[1]);
  await upsertWatchlistFromAnalysis(createdIds[2]);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
