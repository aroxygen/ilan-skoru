import { NextResponse } from "next/server";

const BACKEND_URL = process.env.AROX_BACKEND_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string };

  if (!body.url) {
    return NextResponse.json({ error: "url zorunludur" }, { status: 400 });
  }

  const response = await fetch(`${BACKEND_URL}/analiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: body.url })
  });

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
