import { NextResponse } from "next/server";
import { normalizeParsedListing, parseListing } from "@/lib/parsers";

const REQUEST_TIMEOUT_MS = 10000;
const BROWSER_LIKE_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache"
};

async function safeFetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: BROWSER_LIKE_HEADERS,
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        html: undefined,
        warning: `HTML fetch failed with HTTP ${response.status}.`
      };
    }

    const html = await response.text();
    return { html, warning: undefined };
  } catch (error) {
    return {
      html: undefined,
      warning: error instanceof Error ? `HTML fetch failed: ${error.message}` : "HTML fetch failed."
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; rawHtml?: string };

    if (!body.url) {
      return NextResponse.json(
        {
          provider: "unknown",
          status: "failed",
          extracted: {},
          extractedFields: [],
          missingFields: ["url"],
          warnings: ["URL is required."]
        },
        { status: 400 }
      );
    }

    const fetched = body.rawHtml ? { html: body.rawHtml, warning: undefined } : await safeFetchHtml(body.url);
    const parsed = await parseListing(body.url, { rawHtml: fetched.html });
    const normalized = normalizeParsedListing(parsed.extracted);

    const warnings = fetched.warning ? [fetched.warning, ...parsed.warnings] : parsed.warnings;

    return NextResponse.json({
      provider: parsed.provider,
      status: parsed.status,
      extracted: normalized,
      extractedFields: Object.entries(normalized)
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key]) => key),
      missingFields: parsed.missingFields,
      warnings
    });
  } catch (error) {
    return NextResponse.json(
      {
        provider: "unknown",
        status: "failed",
        extracted: {},
        extractedFields: [],
        missingFields: [],
        warnings: [error instanceof Error ? error.message : "Failed to parse URL."]
      },
      { status: 200 }
    );
  }
}
