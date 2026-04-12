import { readFile } from "node:fs/promises";
import path from "node:path";
import { ParserResult, ProviderParser } from "@/lib/parsers/types";

const FIXTURE_BY_PATH: Record<string, string> = {
  "/ilan/ornek-1": "listing-1.html",
  "/ilan/ornek-2": "listing-2.html"
};

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim();
}

function stripTags(html: string) {
  return cleanText(html.replace(/<[^>]+>/g, " "));
}

function matchFirst(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }
  return undefined;
}

function parsePrice(raw?: string) {
  if (!raw) return undefined;
  const normalized = raw.replace(/[^\d]/g, "");
  const num = Number(normalized);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function parseSquareMeters(raw?: string) {
  if (!raw) return undefined;
  const match = raw.match(/(\d+[\.,]?\d*)/);
  if (!match?.[1]) return undefined;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? Math.round(value) : undefined;
}

function parseBuildingAge(raw?: string) {
  if (!raw) return undefined;
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

export const sahibindenParser: ProviderParser = {
  provider: "sahibinden",
  canHandle: (url) => url.hostname.includes("sahibinden.com"),
  parseListing: async (url, options) => {
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
      usedMockData: true
    };
  }
};
