import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { ICA_SEARCH_PAGE_URL, ICA_REQUIRED_HEADERS } from "../const/icaConstants";
import { IcaCompany } from "../interfaces/interfaces";
import { formatCompanyNumber } from "../data/companyUtils";

const TIMEOUT_MS = parseInt(process.env.ICA_REQUEST_TIMEOUT_MS ?? "10000", 10);

/**
 * Best-effort HTML scraper fallback for ICA company search.
 * Used when the JSON API returns empty results or a non-200 response.
 *
 * NOTE: The scraped fields are a subset of the full IcaCompany interface.
 * Fields not found in the HTML are returned as empty strings.
 */
export async function scrapeByName(name: string): Promise<IcaCompany[]> {
  try {
    const url = `${ICA_SEARCH_PAGE_URL}&corporationType=3&corporationName=${encodeURIComponent(name)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      headers: {
        ...ICA_REQUIRED_HEADERS,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal as Parameters<typeof fetch>[1] extends { signal?: infer S } ? S : never,
    });

    clearTimeout(timeout);

    if (res.status !== 200) {
      console.error(`[icaScraper] HTTP ${res.status} from ICA search page`);
      return [];
    }

    const html = await res.text();
    return parseSearchResults(html);
  } catch (err) {
    console.error("[icaScraper] Scrape failed:", (err as Error).message);
    return [];
  }
}

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseSearchResults(html: string): IcaCompany[] {
  const $ = cheerio.load(html);
  const results: IcaCompany[] = [];

  // The ICA search results page renders each company in a results container.
  // This selector targets the typical row structure — may need adjustment if
  // the page layout changes (see ISSUES.md #7).
  $(".corporation-result, .search-result-row, tr[data-id]").each((_, el) => {
    const row = $(el);

    const companyNumber = formatCompanyNumber(
      row.find("[data-company-id], .company-id").text().trim() ||
      row.attr("data-id") ||
      ""
    );

    const hebrewName =
      row.find(".company-name-he, .heb-name").text().trim() || "";

    const englishName =
      row.find(".company-name-en, .eng-name").text().trim() || "";

    const status = row.find(".company-status, .status").text().trim() || "";

    const address = row.find(".company-address, .address").text().trim() || "";

    if (companyNumber || hebrewName) {
      results.push({
        companyNumber,
        hebrewName,
        englishName,
        status,
        companyType: "",
        limitType: "",
        registrationDate: "",
        address,
        city: "",
        violationStatus: null,
      });
    }
  });

  return results;
}
