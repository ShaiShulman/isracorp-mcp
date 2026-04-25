import { z } from "zod";
import { normaliseCompanyName } from "../data/companyUtils";
import { searchByName } from "../handlers/icaClient";
import { scrapeByName } from "../handlers/icaScraper";
import { SearchResult } from "../interfaces/interfaces";

export const searchCompanySchema = z.object({
  name: z
    .string()
    .min(1)
    .describe("Partial or full Hebrew or English company name"),
});

export type SearchCompanyInput = z.infer<typeof searchCompanySchema>;

/**
 * search_company tool handler.
 *
 * Flow:
 *   1. Normalise the name (strip legal suffixes)
 *   2. Query the ICA JSON API with the normalised name
 *   3. If empty AND normalised ≠ original, retry with original name
 *   4. If still empty, fall back to HTML scraper
 *   5. Return up to 10 results
 */
export async function handleSearchCompany(
  input: SearchCompanyInput
): Promise<SearchResult> {
  const { name } = input;
  const normalisedName = normaliseCompanyName(name);

  // Primary: try normalised name
  let results = await searchByName(normalisedName);

  // Retry with original if normalised returned nothing and names differ
  if (results.length === 0 && normalisedName !== name.trim()) {
    results = await searchByName(name.trim());
  }

  if (results.length > 0) {
    return { results: results.slice(0, 10), source: "api" };
  }

  // Fallback: HTML scraper
  console.error(
    `[searchCompany] API returned empty for "${normalisedName}", using scraper fallback`
  );
  const scraped = await scrapeByName(normalisedName);

  if (scraped.length > 0) {
    return { results: scraped.slice(0, 10), source: "scraper" };
  }

  return { results: [], source: "empty" };
}
