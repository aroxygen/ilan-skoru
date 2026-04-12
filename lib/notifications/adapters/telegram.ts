import { NotificationAdapter } from "@/lib/notifications/types";

export const telegramAdapter: NotificationAdapter = {
  channel: "telegram",
  send: async (_payload, mockMode) => {
    if (mockMode) return { status: "sent" };
    return { status: "failed", error: "Live Telegram adapter not configured." };
  }
};
