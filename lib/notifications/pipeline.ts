import { prisma } from "@/lib/prisma";
import { getAdapter } from "@/lib/notifications/adapters";
import { NotificationChannel } from "@/lib/notifications/types";

const EVENT_SEVERITY: Record<string, number> = {
  price_dropped: 2,
  score_improved: 2,
  fatigue_increased: 1,
  action_upgraded: 3,
  parser_failed: 3,
  confidence_dropped: 1
};

export async function ensureDefaultPreference() {
  let pref = await prisma.notificationPreference.findFirst();
  if (!pref) {
    pref = await prisma.notificationPreference.create({
      data: {
        enabledEvents: Object.keys(EVENT_SEVERITY),
        channels: ["email"],
        minimumSeverity: 1,
        quietHoursStart: 23,
        quietHoursEnd: 7,
        dedupeWindowMinutes: 180
      }
    });
  }
  return pref;
}

function isQuietHour(start: number | null, end: number | null) {
  if (start == null || end == null) return false;
  const hour = new Date().getUTCHours();
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export async function createAndDeliverNotifications(params: {
  watchlistItemId: string;
  snapshotId: string;
  eventFlags: string[];
  title: string;
}) {
  if (params.eventFlags.length === 0) return;

  const globalPref = await ensureDefaultPreference();
  const subscription = await prisma.alertSubscription.findFirst({
    where: { watchlistItemId: params.watchlistItemId, enabled: true }
  });

  const enabledEvents = subscription?.enabledEvents.length ? subscription.enabledEvents : globalPref.enabledEvents;
  const channels = (subscription?.channels.length ? subscription.channels : globalPref.channels) as NotificationChannel[];
  const minimumSeverity = subscription?.minimumSeverity ?? globalPref.minimumSeverity;
  const dedupeWindowMinutes = subscription?.dedupeWindowMinutes ?? globalPref.dedupeWindowMinutes;
  const quietHoursStart = subscription?.quietHoursStart ?? globalPref.quietHoursStart;
  const quietHoursEnd = subscription?.quietHoursEnd ?? globalPref.quietHoursEnd;

  for (const eventType of params.eventFlags) {
    const severity = EVENT_SEVERITY[eventType] ?? 1;
    if (!enabledEvents.includes(eventType)) continue;
    if (severity < minimumSeverity) continue;

    const dedupeKey = `${params.watchlistItemId}:${eventType}`;
    const dedupeSince = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: { dedupeKey, createdAt: { gte: dedupeSince } }
    });
    if (existing) continue;

    const notification = await prisma.notification.create({
      data: {
        watchlistItemId: params.watchlistItemId,
        snapshotId: params.snapshotId,
        eventType,
        severity,
        title: `${params.title} • ${eventType}`,
        message: `Watchlist event triggered: ${eventType}`,
        dedupeKey
      }
    });

    const quiet = isQuietHour(quietHoursStart, quietHoursEnd);
    for (const channel of channels) {
      if (quiet) {
        await prisma.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel,
            status: "skipped_quiet_hours",
            mode: "mock"
          }
        });
        continue;
      }

      const adapter = getAdapter(channel);
      const result = await adapter.send(
        { title: notification.title, message: notification.message, eventType, severity },
        true
      );

      await prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel,
          status: result.status,
          mode: "mock",
          error: result.error,
          deliveredAt: result.status === "sent" ? new Date() : null
        }
      });
    }
  }
}
