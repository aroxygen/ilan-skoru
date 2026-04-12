import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultPreference } from "@/lib/notifications/pipeline";

export async function GET() {
  const pref = await ensureDefaultPreference();
  return NextResponse.json(pref);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    enabledEvents?: string[];
    channels?: string[];
    minimumSeverity?: number;
    quietHoursStart?: number | null;
    quietHoursEnd?: number | null;
    dedupeWindowMinutes?: number;
  };

  const pref = await ensureDefaultPreference();

  const updated = await prisma.notificationPreference.update({
    where: { id: pref.id },
    data: {
      enabledEvents: body.enabledEvents ?? pref.enabledEvents,
      channels: body.channels ?? pref.channels,
      minimumSeverity: body.minimumSeverity ?? pref.minimumSeverity,
      quietHoursStart: body.quietHoursStart ?? pref.quietHoursStart,
      quietHoursEnd: body.quietHoursEnd ?? pref.quietHoursEnd,
      dedupeWindowMinutes: body.dedupeWindowMinutes ?? pref.dedupeWindowMinutes
    }
  });

  return NextResponse.json(updated);
}
