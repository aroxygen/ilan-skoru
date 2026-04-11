import { NotificationAdapter } from "@/lib/notifications/types";

export const pushAdapter: NotificationAdapter = {
  channel: "push",
  send: async (_payload, mockMode) => {
    if (mockMode) return { status: "sent" };
    return { status: "failed", error: "Live push adapter not configured." };
  }
};
