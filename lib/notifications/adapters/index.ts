import { emailAdapter } from "@/lib/notifications/adapters/email";
import { pushAdapter } from "@/lib/notifications/adapters/push";
import { telegramAdapter } from "@/lib/notifications/adapters/telegram";
import { NotificationAdapter, NotificationChannel } from "@/lib/notifications/types";

const registry: Record<NotificationChannel, NotificationAdapter> = {
  email: emailAdapter,
  telegram: telegramAdapter,
  push: pushAdapter
};

export function getAdapter(channel: NotificationChannel) {
  return registry[channel];
}
