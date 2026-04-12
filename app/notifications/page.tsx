import { prisma } from "@/lib/prisma";
import { ensureDefaultPreference } from "@/lib/notifications/pipeline";
import { NotificationSettingsForm } from "@/components/notification-settings-form";

export default async function NotificationsPage() {
  const preference = await ensureDefaultPreference();
  const history = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { deliveries: true, watchlistItem: true },
    take: 50
  });

  return (
    <section className="space-y-5">
      <NotificationSettingsForm
        initial={{
          enabledEvents: preference.enabledEvents,
          channels: preference.channels,
          minimumSeverity: preference.minimumSeverity,
          quietHoursStart: preference.quietHoursStart,
          quietHoursEnd: preference.quietHoursEnd,
          dedupeWindowMinutes: preference.dedupeWindowMinutes
        }}
      />

      <div className="panel space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-slate-400">Notification History</h2>
        <div className="grid gap-3">
          {history.map((item) => (
            <article key={item.id} className="metric space-y-1 text-sm">
              <p className="font-semibold text-terminal-300">{item.title}</p>
              <p className="text-slate-300">{item.message}</p>
              <p className="text-xs text-slate-400">{item.watchlistItem?.title || "No watchlist item"} • severity {item.severity}</p>
              <div className="flex flex-wrap gap-2">
                {item.deliveries.map((delivery) => (
                  <span key={delivery.id} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                    {delivery.channel}: {delivery.status}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
