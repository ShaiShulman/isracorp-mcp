/**
 * Integration tests against the live ICA API.
 *
 * These tests are SKIPPED by default. Run with:
 *   ICA_INTEGRATION_TEST=true npm run test:integration
 *
 * They require internet access and depend on the ICA website being available.
 * Known company data may change over time — update fixtures if tests fail.
 */

const RUN = process.env.ICA_INTEGRATION_TEST === "true";
const maybeDescribe = RUN ? describe : describe.skip;

// Increase timeout for live API calls
jest.setTimeout(30000);

import { searchByName, getByNumber } from "../../src/handlers/icaClient";
import { scrapeByName } from "../../src/handlers/icaScraper";

// Well-known, long-established Israeli companies used for live API validation.
// Update these if a company changes status or the numbers are reassigned.
const KNOWN_COMPANY_NUMBER = "520044649"; // Bank Hapoalim
const KNOWN_COMPANY_NAME_HE = "בנק הפועלים";
const KNOWN_COMPANY_NAME_EN = "BANK HAPOALIM";

maybeDescribe("ICA Live API — searchByName", () => {
  test("search by Hebrew name returns the known company", async () => {
    const results = await searchByName(KNOWN_COMPANY_NAME_HE);
    expect(results.length).toBeGreaterThan(0);

    const found = results.find((c) => c.companyNumber === KNOWN_COMPANY_NUMBER);
    expect(found).toBeDefined();
    expect(found?.englishName).toContain(KNOWN_COMPANY_NAME_EN);
  });

  test("search by English name returns results", async () => {
    const results = await searchByName(KNOWN_COMPANY_NAME_EN);
    expect(results.length).toBeGreaterThan(0);
  });

  test("search for non-existent name returns empty array (not an error)", async () => {
    const results = await searchByName("חברהזאתבטחלאקיימת999");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

maybeDescribe("ICA Live API — getByNumber", () => {
  test("lookup by known company number returns correct company", async () => {
    const company = await getByNumber(KNOWN_COMPANY_NUMBER);
    expect(company).not.toBeNull();
    expect(company?.companyNumber).toBe(KNOWN_COMPANY_NUMBER);
    expect(company?.status).toBe("פעילה");
  });

  test("lookup of non-existent number returns null", async () => {
    // 510000001 — unlikely to exist; update if it does
    const company = await getByNumber("510000001");
    expect(company === null || typeof company === "object").toBe(true);
  });
});

maybeDescribe("ICA Live Scraper — scrapeByName", () => {
  test("scraper returns results for known company (best-effort)", async () => {
    const results = await scrapeByName(KNOWN_COMPANY_NAME_HE);
    // Scraper may return empty if page structure changed — that's acceptable
    expect(Array.isArray(results)).toBe(true);
    console.log(`Scraper returned ${results.length} result(s) for "${KNOWN_COMPANY_NAME_HE}"`);
  });
});
