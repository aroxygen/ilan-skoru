import { NotificationAdapter } from "@/lib/notifications/types";

export const emailAdapter: NotificationAdapter = {
  channel: "email",
  send: async (_payload, mockMode) => {
    if (mockMode) return { status: "sent" };
    return { status: "failed", error: "Live email adapter not configured." };
  }
};
