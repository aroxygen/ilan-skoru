export type NotificationChannel = "email" | "telegram" | "push";

export type DeliveryResult = {
  status: "sent" | "failed" | "skipped";
  error?: string;
};

export type NotificationPayload = {
  title: string;
  message: string;
  eventType: string;
  severity: number;
};

export type NotificationAdapter = {
  channel: NotificationChannel;
  send: (payload: NotificationPayload, mockMode: boolean) => Promise<DeliveryResult>;
};
