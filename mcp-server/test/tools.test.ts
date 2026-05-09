// Mock the ICA client and scraper before imports
jest.mock("../src/handlers/icaClient");
jest.mock("../src/handlers/icaScraper");

import { handleSearchCompany } from "../src/tools/searchCompany";
import { handleGetCompany } from "../src/tools/getCompany";
import * as icaClient from "../src/handlers/icaClient";
import * as icaScraper from "../src/handlers/icaScraper";
import { ApiError } from "../src/const/ApiError";
import { IcaCompany } from "../src/interfaces/interfaces";

const mockedSearchByName = icaClient.searchByName as jest.MockedFunction<typeof icaClient.searchByName>;
const mockedGetByNumber = icaClient.getByNumber as jest.MockedFunction<typeof icaClient.getByNumber>;
const mockedScrapeByName = icaScraper.scrapeByName as jest.MockedFunction<typeof icaScraper.scrapeByName>;

// Made-up company: טכנוגל בע"מ / TECHNOgel LTD, number 51-234567-9
const technoGel: IcaCompany = {
  companyNumber: "512345679",
  hebrewName: 'טכנוגל בע"מ',
  englishName: "TECHNOgel LTD",
  status: "פעילה",
  companyType: "ישראלית",
  limitType: "מוגבלת",
  registrationDate: "15/03/2010",
  address: "חיפה  הנמל  12",
  city: "חיפה",
  violationStatus: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── handleSearchCompany ───────────────────────────────────────────────────────

describe("handleSearchCompany", () => {
  test("strips legal suffix before calling API", async () => {
    mockedSearchByName.mockResolvedValue([technoGel]);

    await handleSearchCompany({ name: 'טכנוגל בע"מ' });

    // Should be called with stripped name "טכנוגל"
    expect(mockedSearchByName).toHaveBeenCalledWith("טכנוגל");
  });

  test("returns api source on success", async () => {
    mockedSearchByName.mockResolvedValue([technoGel]);

    const result = await handleSearchCompany({ name: "טכנוגל" });
    expect(result.source).toBe("api");
    expect(result.results).toHaveLength(1);
    expect(result.results[0].companyNumber).toBe("512345679");
  });

  test("retries with original name when normalised returns empty", async () => {
    // First call (normalised "טכנוגל") returns empty
    // Second call (original 'טכנוגל בע"מ') returns result
    mockedSearchByName
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([technoGel]);

    const result = await handleSearchCompany({ name: 'טכנוגל בע"מ' });

    expect(mockedSearchByName).toHaveBeenCalledTimes(2);
    expect(result.results).toHaveLength(1);
    expect(result.source).toBe("api");
  });

  test("falls back to scraper when API returns empty after both attempts", async () => {
    mockedSearchByName.mockResolvedValue([]);
    mockedScrapeByName.mockResolvedValue([technoGel]);

    const result = await handleSearchCompany({ name: "טכנוגל" });

    expect(mockedScrapeByName).toHaveBeenCalledWith("טכנוגל");
    expect(result.source).toBe("scraper");
    expect(result.results).toHaveLength(1);
  });

  test("returns empty result when both API and scraper return nothing", async () => {
    mockedSearchByName.mockResolvedValue([]);
    mockedScrapeByName.mockResolvedValue([]);

    const result = await handleSearchCompany({ name: "חברה שלא קיימת" });

    expect(result.source).toBe("empty");
    expect(result.results).toHaveLength(0);
  });

  test("limits results to 10", async () => {
    const manyResults = Array.from({ length: 15 }, (_, i) => ({
      ...technoGel,
      companyNumber: `51234567${i}`,
    }));
    mockedSearchByName.mockResolvedValue(manyResults);

    const result = await handleSearchCompany({ name: "חברה" });
    expect(result.results.length).toBeLessThanOrEqual(10);
  });
});

// ── handleGetCompany ──────────────────────────────────────────────────────────

describe("handleGetCompany", () => {
  test("returns company for valid 9-digit number", async () => {
    mockedGetByNumber.mockResolvedValue(technoGel);

    const result = await handleGetCompany({ number: "512345679" });

    expect(result.company).toEqual(technoGel);
    expect(result.source).toBe("api");
  });

  test("accepts dashed format XX-XXXXXX-X and normalises before lookup", async () => {
    mockedGetByNumber.mockResolvedValue(technoGel);

    const result = await handleGetCompany({ number: "51-234567-9" });

    // Should call getByNumber with the raw 9-digit form
    expect(mockedGetByNumber).toHaveBeenCalledWith("512345679");
    expect(result.company).toEqual(technoGel);
  });

  test("throws ApiError(400) for number with invalid check digit", async () => {
    // Flip last digit to create invalid check digit
    await expect(
      handleGetCompany({ number: "512345670" })
    ).rejects.toThrow(ApiError);

    await expect(
      handleGetCompany({ number: "512345670" })
    ).rejects.toMatchObject({ statusCode: 400 });

    // API should NOT have been called
    expect(mockedGetByNumber).not.toHaveBeenCalled();
  });

  test("throws ApiError(404) when company not found", async () => {
    mockedGetByNumber.mockResolvedValue(null);

    await expect(
      handleGetCompany({ number: "512345679" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("does not call API for invalid number", async () => {
    await expect(
      handleGetCompany({ number: "512345670" })
    ).rejects.toThrow();

    expect(mockedGetByNumber).not.toHaveBeenCalled();
  });
});
