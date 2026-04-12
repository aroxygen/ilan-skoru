import { prisma } from "@/lib/prisma";
import { computeAlertEvents } from "@/lib/alerts";
import { createAndDeliverNotifications, ensureDefaultPreference } from "@/lib/notifications/pipeline";

export async function upsertWatchlistFromAnalysis(analysisId: string) {
  const analysis = await prisma.listingAnalysis.findUnique({ where: { id: analysisId } });
  if (!analysis) throw new Error("Analysis not found");

  const canonicalUrl = analysis.url || null;
  const existing = await prisma.watchlistItem.findFirst({
    where: canonicalUrl ? { canonicalUrl } : { title: analysis.title, location: analysis.location },
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  const pricePerM2 = Math.round(analysis.price / Math.max(1, analysis.squareMeters));

  if (!existing) {
    const pref = await ensureDefaultPreference();
    const created = await prisma.watchlistItem.create({
      data: {
        title: analysis.title,
        canonicalUrl,
        location: analysis.location,
        currentScore: analysis.score,
        currentAction: analysis.action,
        currentClassification: analysis.classification,
        latestAskingPrice: analysis.price,
        latestPricePerM2: pricePerM2,
        sellerFatigueIndex: analysis.sellerFatigueIndex,
        negotiationEdge: analysis.negotiationEdge,
        parserProvider: analysis.parserProvider,
        parserStatus: analysis.parserStatus,
        confidenceScore: analysis.confidenceScore,
        lastAnalyzedAt: analysis.createdAt,
        latestAnalysisId: analysis.id,
        subscriptions: {
          create: {
            enabled: true,
            enabledEvents: pref.enabledEvents,
            channels: pref.channels,
            minimumSeverity: pref.minimumSeverity,
            quietHoursStart: pref.quietHoursStart,
            quietHoursEnd: pref.quietHoursEnd,
            dedupeWindowMinutes: pref.dedupeWindowMinutes
          }
        },
        snapshots: {
          create: {
            analysisId: analysis.id,
            score: analysis.score,
            action: analysis.action,
            classification: analysis.classification,
            askingPrice: analysis.price,
            pricePerM2,
            sellerFatigueIndex: analysis.sellerFatigueIndex,
            negotiationEdge: analysis.negotiationEdge,
            confidenceScore: analysis.confidenceScore,
            parserProvider: analysis.parserProvider,
            parserStatus: analysis.parserStatus,
            eventFlags: []
          }
        }
      },
      include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } }
    });

    const createdSnapshot = created.snapshots[0];
    if (createdSnapshot) {
      await createAndDeliverNotifications({
        watchlistItemId: created.id,
        snapshotId: createdSnapshot.id,
        eventFlags: [],
        title: created.title
      });
    }

    return created;
  }

  const last = existing.snapshots[0] || null;
  const eventFlags = computeAlertEvents(
    last
      ? {
          askingPrice: last.askingPrice,
          score: last.score,
          sellerFatigueIndex: last.sellerFatigueIndex,
          confidenceScore: last.confidenceScore,
          action: last.action,
          parserStatus: last.parserStatus
        }
      : null,
    {
      askingPrice: analysis.price,
      score: analysis.score,
      sellerFatigueIndex: analysis.sellerFatigueIndex,
      confidenceScore: analysis.confidenceScore,
      action: analysis.action,
      parserStatus: analysis.parserStatus
    }
  );

  const updated = await prisma.watchlistItem.update({
    where: { id: existing.id },
    data: {
      title: analysis.title,
      location: analysis.location,
      currentScore: analysis.score,
      currentAction: analysis.action,
      currentClassification: analysis.classification,
      latestAskingPrice: analysis.price,
      latestPricePerM2: pricePerM2,
      sellerFatigueIndex: analysis.sellerFatigueIndex,
      negotiationEdge: analysis.negotiationEdge,
      parserProvider: analysis.parserProvider,
      parserStatus: analysis.parserStatus,
      confidenceScore: analysis.confidenceScore,
      lastAnalyzedAt: analysis.createdAt,
      latestAnalysisId: analysis.id,
      snapshots: {
        create: {
          analysisId: analysis.id,
          score: analysis.score,
          action: analysis.action,
          classification: analysis.classification,
          askingPrice: analysis.price,
          pricePerM2,
          sellerFatigueIndex: analysis.sellerFatigueIndex,
          negotiationEdge: analysis.negotiationEdge,
          confidenceScore: analysis.confidenceScore,
          parserProvider: analysis.parserProvider,
          parserStatus: analysis.parserStatus,
          eventFlags
        }
      }
    },
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  const updatedSnapshot = updated.snapshots[0];
  if (updatedSnapshot) {
    await createAndDeliverNotifications({
      watchlistItemId: updated.id,
      snapshotId: updatedSnapshot.id,
      eventFlags,
      title: updated.title
    });
  }

  return updated;
}
