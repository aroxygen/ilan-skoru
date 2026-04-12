import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sub = await prisma.alertSubscription.findFirst({ where: { watchlistItemId: id } });
  return NextResponse.json(sub);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    enabled?: boolean;
    enabledEvents?: string[];
    channels?: string[];
    minimumSeverity?: number | null;
    quietHoursStart?: number | null;
    quietHoursEnd?: number | null;
    dedupeWindowMinutes?: number | null;
  };

  const existing = await prisma.alertSubscription.findFirst({ where: { watchlistItemId: id } });
  if (!existing) {
    const created = await prisma.alertSubscription.create({
      data: {
        watchlistItemId: id,
        enabled: body.enabled ?? true,
        enabledEvents: body.enabledEvents ?? [],
        channels: body.channels ?? ["email"],
        minimumSeverity: body.minimumSeverity ?? null,
        quietHoursStart: body.quietHoursStart ?? null,
        quietHoursEnd: body.quietHoursEnd ?? null,
        dedupeWindowMinutes: body.dedupeWindowMinutes ?? null
      }
    });
    return NextResponse.json(created);
  }

  const updated = await prisma.alertSubscription.update({
    where: { id: existing.id },
    data: {
      enabled: body.enabled ?? existing.enabled,
      enabledEvents: body.enabledEvents ?? existing.enabledEvents,
      channels: body.channels ?? existing.channels,
      minimumSeverity: body.minimumSeverity ?? existing.minimumSeverity,
      quietHoursStart: body.quietHoursStart ?? existing.quietHoursStart,
      quietHoursEnd: body.quietHoursEnd ?? existing.quietHoursEnd,
      dedupeWindowMinutes: body.dedupeWindowMinutes ?? existing.dedupeWindowMinutes
    }
  });

  return NextResponse.json(updated);
}
