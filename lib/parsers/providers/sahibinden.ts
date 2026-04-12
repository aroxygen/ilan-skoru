import { readFile } from "node:fs/promises";
import path from "node:path";
import { ParserResult, ProviderParser } from "@/lib/parsers/types";

type ExtractedSahibinden = ParserResult["extracted"];

type ExtractionOutcome = {
  extracted: ExtractedSahibinden;
  missingFields: string[];
  warnings: string[];
};

const REQUIRED_FIELDS: Array<keyof ExtractedSahibinden> = [
  "title",
  "price",
  "location",
  "district",
  "neighborhood",
  "roomCount",
  "squareMeters",
  "buildingAge",
  "description"
];

const FIXTURE_BY_PATH: Record<string, string> = {
  "/ilan/ornek-1": "listing-1.html",
  "/ilan/ornek-2": "listing-2.html",
  "/ilan/sahibinden-istanbul-kadikoy-3-1": "listing-real-1.html",
  "/ilan/sahibinden-istanbul-kartal-2-1": "listing-real-2.html"
const FIXTURE_BY_PATH: Record<string, string> = {
  "/ilan/ornek-1": "listing-1.html",
  "/ilan/ornek-2": "listing-2.html"
};

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&Ccedil;/gi, "Ç")
    .replace(/&uuml;/gi, "ü")
    .replace(/&Uuml;/gi, "Ü")
    .replace(/&ouml;/gi, "ö")
    .replace(/&Ouml;/gi, "Ö")
    .replace(/&scedil;/gi, "ş")
    .replace(/&Scedil;/gi, "Ş")
    .replace(/&iacute;/gi, "i")
    .replace(/&#304;/gi, "İ")
    .replace(/&#305;/gi, "ı");
}

function stripTags(html: string) {
  return cleanText(decodeEntities(html.replace(/<[^>]+>/g, " ")));
function stripTags(html: string) {
  return cleanText(html.replace(/<[^>]+>/g, " "));
}

function matchFirst(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanText(decodeEntities(stripTags(match[1]) ?? ""));
    }
    if (match?.[1]) return cleanText(match[1]);
  }
  return undefined;
}

function parsePrice(raw?: string) {
  if (!raw) return undefined;
  const normalized = raw.replace(/[^\d]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : undefined;
  const num = Number(normalized);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function parseSquareMeters(raw?: string) {
  if (!raw) return undefined;
  const match = raw.match(/(\d+[\.,]?\d*)/);
  if (!match?.[1]) return undefined;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
  return Number.isFinite(value) ? Math.round(value) : undefined;
}

function parseBuildingAge(raw?: string) {
  if (!raw) return undefined;
  if (/yeni|s[ıi]f[ıi]r|0\s*ya[şs]/i.test(raw)) return 0;
  const match = raw.match(/\d+/);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : undefined;
}

function parseLocationParts(location?: string) {
  if (!location) return { district: undefined, neighborhood: undefined };
  const segments = location
    .split("/")
    .map((segment) => cleanText(segment))
    .filter(Boolean) as string[];

  const district = segments.length >= 2 ? segments[1] : undefined;
  const neighborhood = segments.length >= 3 ? segments[2] : undefined;

  return {
    district,
    neighborhood
  };
}

function extractJsonLd(html: string) {
  const scriptMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch?.[1]) return undefined;

  try {
    const parsed = JSON.parse(scriptMatch[1]);
    return Array.isArray(parsed) ? parsed.find((item) => item && typeof item === "object") : parsed;
  } catch {
    return undefined;
  }
}

function extractFromHtml(html: string): ExtractionOutcome {
  const warnings: string[] = [];
  const jsonLd = extractJsonLd(html) as Record<string, unknown> | undefined;

  const title =
    matchFirst(html, [
      /<h1[^>]*class=["'][^"']*(?:classifiedDetailTitle|classified-title)[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    ]) ??
    (typeof jsonLd?.name === "string" ? cleanText(String(jsonLd.name)) : undefined);

  const priceRaw =
    matchFirst(html, [
      /<h3[^>]*>([\s\S]*?TL[\s\S]*?)<\/h3>/i,
      /<span[^>]*class=["'][^"']*(?:classified-price-wrapper|classified-price)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
      /data-testid=["']price["'][^>]*>([\s\S]*?)<\//i,
      /"price"\s*:\s*"([\d\.,\s]+)"/i,
      /(\d[\d\.,\s]+\s*TL)/i
    ]) ??
    (typeof jsonLd?.offers === "object" && jsonLd?.offers && "price" in jsonLd.offers
      ? String((jsonLd.offers as Record<string, unknown>).price)
      : undefined);

  const location =
    matchFirst(html, [
      /<span[^>]*class=["'][^"']*(?:classifiedInfo|location|location-text|classifiedDetailLocation)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
      /<meta[^>]+property=["']og:locality["'][^>]+content=["']([^"']+)["']/i,
      /(İstanbul\s*\/\s*[^<\n]+\/\s*[^<\n]+)/i
    ]) ??
    (typeof jsonLd?.address === "object" && jsonLd?.address && "addressLocality" in jsonLd.address
      ? `İstanbul / ${String((jsonLd.address as Record<string, unknown>).addressLocality)}`
      : undefined);

  const roomCount =
    matchFirst(html, [
      /Oda\s*Say[ıi]s[ıi][\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
      /Oda\s*Say[ıi]s[ıi]<\/td>\s*<td>([\s\S]*?)<\/td>/i,
      /"roomCount"\s*:\s*"([^"']+)"/i,
      /(\d\s*\+\s*\d)/
    ]) || undefined;

  const squareMetersRaw =
    matchFirst(html, [
      /Br[üu]t\s*(?:Metrekare|m2|m²)[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
      /Br[üu]t\s*(?:Metrekare|m2|m²)<\/td>\s*<td>([\s\S]*?)<\/td>/i,
      /"gross_square_meters"\s*:\s*"([^"']+)"/i,
      /"squareMeters"\s*:\s*"([^"']+)"/i
    ]) || undefined;

  const buildingAgeRaw =
    matchFirst(html, [
      /Bina\s*Ya[şs][ıi][\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
      /Bina\s*Ya[şs][ıi]<\/td>\s*<td>([\s\S]*?)<\/td>/i,
      /"buildingAge"\s*:\s*"([^"']+)"/i
    ]) || undefined;

  const descriptionRaw =
    matchFirst(html, [
      /<div[^>]*class=["'][^"']*(?:classifiedDescription|description)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*id=["']description["'][^>]*>([\s\S]*?)<\/section>/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /"description"\s*:\s*"([\s\S]*?)"\s*[\},]/i
    ]) ??
    (typeof jsonLd?.description === "string" ? cleanText(String(jsonLd.description)) : undefined);

  const squareMeters = parseSquareMeters(squareMetersRaw);
  const buildingAge = parseBuildingAge(buildingAgeRaw);
  const parsedRoomCount = roomCount ? roomCount.replace(/\s+/g, "") : undefined;
  const parsedLocation = location ? cleanText(location) : undefined;
  const { district, neighborhood } = parseLocationParts(parsedLocation);

  const extracted: ExtractedSahibinden = {
    title,
    price: parsePrice(priceRaw),
    location: parsedLocation,
    district,
    neighborhood,
    roomCount: parsedRoomCount,
    squareMeters,
    buildingAge,
    description: descriptionRaw ? cleanText(descriptionRaw) : undefined
  };

  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = extracted[field];
    return value === undefined || value === "";
  }).map((field) => String(field));

  for (const field of missingFields) {
    warnings.push(`Selector/regex did not yield a reliable value for: ${field}.`);
  }

  return {
    extracted,
    missingFields,
    warnings
  };
  if (/yeni|sifir|0/i.test(raw)) return 0;
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

async function loadFixtureHtml(url: URL) {
  const fixture = FIXTURE_BY_PATH[url.pathname];
  if (!fixture) return undefined;

  const filePath = path.join(process.cwd(), "lib/parsers/fixtures/sahibinden", fixture);
  return readFile(filePath, "utf8");
}

async function safeFetchHtml(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IlanSkoruParser/1.0)",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return {
        html: undefined,
        warning: `Live fetch failed with HTTP ${response.status}.`
      };
    }

    const html = await response.text();
    return { html, warning: undefined };
  } catch (error) {
    return {
      html: undefined,
      warning: error instanceof Error ? `Live fetch error: ${error.message}` : "Live fetch error."
    };
  } finally {
    clearTimeout(timeout);
  }
}
function extractFromHtml(html: string) {
  const title = matchFirst(html, [
    /<h1[^>]*class=["'][^"']*classifiedDetailTitle[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i,
    /<h1[^>]*>([\s\S]*?)<\/h1>/i
  ]);

  const priceRaw = matchFirst(html, [
    /<h3[^>]*>([\s\S]*?TL[\s\S]*?)<\/h3>/i,
    /data-testid=["']price["'][^>]*>([\s\S]*?)<\//i,
    /(\d[\d\.,\s]+\s*TL)/i
  ]);

  const location = matchFirst(html, [
    /<span[^>]*class=["'][^"']*location[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /(İstanbul\s*\/\s*[^<\n]+\/\s*[^<\n]+)/i
  ]);

  const grossSquareRaw = matchFirst(html, [
    /Br[üu]t\s*(?:Metrekare|m2)[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
    /Br[üu]t\s*m2<\/td>\s*<td>([\s\S]*?)<\/td>/i
  ]);

  const roomCount = matchFirst(html, [
    /Oda\s*Say[ıi]s[ıi][\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
    /Oda\s*Say[ıi]s[ıi]<\/td>\s*<td>([\s\S]*?)<\/td>/i,
    /(\d\s*\+\s*\d)/
  ]);

  const buildingAgeRaw = matchFirst(html, [
    /Bina\s*Ya[şs][ıi][\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
    /Bina\s*Ya[şs][ıi]<\/td>\s*<td>([\s\S]*?)<\/td>/i
  ]);

  const descriptionRaw = matchFirst(html, [
    /<div[^>]*class=["'][^"']*classifiedDescription[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*id=["']description["'][^>]*>([\s\S]*?)<\/section>/i
  ]);

  return {
    title,
    price: parsePrice(priceRaw),
    location,
    squareMeters: parseSquareMeters(grossSquareRaw),
    roomCount: roomCount ? roomCount.replace(/\s+/g, "") : undefined,
    buildingAge: parseBuildingAge(buildingAgeRaw),
    description: descriptionRaw ? stripTags(descriptionRaw) : undefined
  };
}
import { ParserResult, ProviderParser } from "@/lib/parsers/types";

const MOCK_FIXTURES: Record<string, ParserResult["extracted"]> = {
  "https://www.sahibinden.com/ilan/ornek-1": {
    title: "Sahibinden Örnek Daire",
    price: 5750000,
    location: "Kadikoy",
    district: "Kadikoy",
    neighborhood: "Fenerbahce",
    propertyType: "Apartment",
    roomCount: "3+1",
    squareMeters: 125,
    listingAgeDays: 46,
    description: "Owner listing. Price updated recently."
  }
};

export const sahibindenParser: ProviderParser = {
  provider: "sahibinden",
  canHandle: (url) => url.hostname.includes("sahibinden.com"),
  parseListing: async (url, options) => {
    const warnings: string[] = [];

    let html = options?.rawHtml;
    let usedMockData = false;

    if (!html) {
      const live = await safeFetchHtml(url);
      html = live.html;
      if (live.warning) warnings.push(live.warning);
    }

    if (!html) {
      html = await loadFixtureHtml(url);
      if (html) {
        usedMockData = true;
        warnings.push("Fixture HTML fallback used for Sahibinden parsing.");
      }
    let html = options?.rawHtml;
    let warningPrefix = "";

    if (!html) {
      html = await loadFixtureHtml(url);
      warningPrefix = "Fixture HTML used. ";
    }

    if (!html) {
      return {
        provider: "sahibinden",
        status: "failed",
        extracted: {},
        missingFields: REQUIRED_FIELDS.map(String),
        warnings: [...warnings, "No rawHtml provided and both live fetch + fixture lookup failed."],
        usedMockData
      };
    }

    const extraction = extractFromHtml(html);

    return {
      provider: "sahibinden",
      status: extraction.missingFields.length === 0 ? "supported" : "partial",
      extracted: extraction.extracted,
      missingFields: extraction.missingFields,
      warnings: [...warnings, ...extraction.warnings],
      usedMockData
        missingFields: ["title", "price", "location", "squareMeters", "roomCount", "description"],
        warnings: ["No raw HTML or fixture HTML available for this Sahibinden URL."],
        usedMockData: true
      };
    }

    const extracted = extractFromHtml(html);
    const requiredFields = ["title", "price", "location", "squareMeters", "roomCount", "description"];
    const missingFields = requiredFields.filter((field) => !(extracted as Record<string, unknown>)[field]);

    const warnings: string[] = [];
    if (warningPrefix) warnings.push(`${warningPrefix}No network scraping executed.`);
    if (missingFields.length > 0) warnings.push(`Missing or uncertain fields: ${missingFields.join(", ")}.`);
    if (!extracted.buildingAge) warnings.push("Building age not reliably detected.");

    return {
      provider: "sahibinden",
      status: missingFields.length === 0 ? "supported" : "partial",
      extracted,
      missingFields,
      warnings,
  parseListing: async (url) => {
    const key = `${url.origin}${url.pathname}`;
    const extracted = MOCK_FIXTURES[key] || {};
    const missingFields = ["title", "price", "location", "squareMeters", "description"].filter((f) => !(f in extracted));

    return {
      provider: "sahibinden",
      status: extracted.title ? (missingFields.length > 0 ? "partial" : "supported") : "failed",
      extracted,
      missingFields,
      warnings: extracted.title
        ? ["Parsed via mock sahibinden provider fixture."]
        : ["Provider supported, but no mock fixture exists for this URL yet."],
      usedMockData: true
    };
  }
};
