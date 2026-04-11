import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { deliveries: true, watchlistItem: true }
  });

  return NextResponse.json(notifications);
}
