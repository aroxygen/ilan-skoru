export type SnapshotLike = {
  askingPrice: number;
  score: number;
  sellerFatigueIndex: number;
  confidenceScore: number;
  action: string;
  parserStatus: string;
};

export type AlertEvent =
  | "price_dropped"
  | "score_improved"
  | "fatigue_increased"
  | "action_upgraded"
  | "parser_failed"
  | "confidence_dropped";

const ACTION_RANK: Record<string, number> = {
  IGNORE: 0,
  NEGOTIATE: 1,
  BUY: 2
};

export function computeAlertEvents(previous: SnapshotLike | null, current: SnapshotLike): AlertEvent[] {
  const events: AlertEvent[] = [];

  if (!previous) {
    if (current.parserStatus === "failed") events.push("parser_failed");
    return events;
  }

  if (current.askingPrice < previous.askingPrice) events.push("price_dropped");
  if (current.score > previous.score) events.push("score_improved");
  if (current.sellerFatigueIndex > previous.sellerFatigueIndex) events.push("fatigue_increased");
  if ((ACTION_RANK[current.action] ?? 0) > (ACTION_RANK[previous.action] ?? 0)) events.push("action_upgraded");
  if (current.parserStatus === "failed") events.push("parser_failed");
  if (current.confidenceScore < previous.confidenceScore) events.push("confidence_dropped");

  return events;
}
