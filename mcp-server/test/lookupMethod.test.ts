/**
 * Tests for ICA_LOOKUP_METHOD routing.
 *
 * LOOKUP_METHOD is a module-level constant evaluated at import time, so each
 * describe block resets modules, sets the env var, then re-requires the handler
 * via jest.doMock() + require() to get a fresh evaluation.
 */

import { IcaCompany } from "../src/interfaces/interfaces";

type SearchResult = { source: string; results: IcaCompany[] };
type GetCompanyResult = { company: IcaCompany; source: string };

// Real company: הבורסה לניירות ערך בתל-אביב בע"מ, ח.פ. 520020033
const tase: IcaCompany = {
  companyNumber: "520020033",
  hebrewName: 'הבורסה לניירות ערך בתל - אביב בע"מ',
  englishName: "THE TEL-AVIV STOCK EXCHANGE LTD",
  status: "פעילה",
  companyType: "ישראלית",
  limitType: "מוגבלת",
  registrationDate: "28/09/1953",
  address: "תל אביב - יפו  אחוזת בית  2",
  city: "תל אביב - יפו",
  violationStatus: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadSearchCompany(
  mockedSearchByName: jest.Mock,
  mockedScrapeByName: jest.Mock,
  mockedGetByNumber: jest.Mock = jest.fn()
): (input: { name: string }) => Promise<SearchResult> {
  jest.doMock("../src/handlers/icaClient", () => ({
    searchByName: mockedSearchByName,
    getByNumber: mockedGetByNumber,
  }));
  jest.doMock("../src/handlers/icaScraper", () => ({
    scrapeByName: mockedScrapeByName,
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../src/tools/searchCompany").handleSearchCompany;
}

function loadGetCompany(
  mockedGetByNumber: jest.Mock
): (input: { number: string }) => Promise<GetCompanyResult> {
  jest.doMock("../src/handlers/icaClient", () => ({
    searchByName: jest.fn(),
    getByNumber: mockedGetByNumber,
  }));
  jest.doMock("../src/handlers/icaScraper", () => ({
    scrapeByName: jest.fn(),
  }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../src/tools/getCompany").handleGetCompany;
}

// ── ICA_LOOKUP_METHOD=json — handleSearchCompany ──────────────────────────────

describe('ICA_LOOKUP_METHOD=json — handleSearchCompany', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleSearchCompany: any;
  let mockedSearchByName: jest.Mock;
  let mockedScrapeByName: jest.Mock;

  beforeAll(() => {
    jest.resetModules();
    process.env.ICA_LOOKUP_METHOD = "json";
    mockedSearchByName = jest.fn();
    mockedScrapeByName = jest.fn();
    handleSearchCompany = loadSearchCompany(mockedSearchByName, mockedScrapeByName);
  });

  afterAll(() => {
    jest.resetModules();
    delete process.env.ICA_LOOKUP_METHOD;
  });

  beforeEach(() => jest.clearAllMocks());

  test("calls JSON API", async () => {
    mockedSearchByName.mockResolvedValue([tase]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(mockedSearchByName).toHaveBeenCalled();
    expect(result.source).toBe("api");
  });

  test("does NOT fall back to scraper when API returns empty", async () => {
    mockedSearchByName.mockResolvedValue([]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(mockedScrapeByName).not.toHaveBeenCalled();
    expect(result.source).toBe("empty");
  });

  test("returns zero results with empty source when API finds nothing", async () => {
    mockedSearchByName.mockResolvedValue([]);
    const result: SearchResult = await handleSearchCompany({ name: "חברה לא קיימת" });
    expect(result.results).toHaveLength(0);
    expect(result.source).toBe("empty");
  });
});

// ── ICA_LOOKUP_METHOD=scraper — handleSearchCompany ───────────────────────────

describe('ICA_LOOKUP_METHOD=scraper — handleSearchCompany', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleSearchCompany: any;
  let mockedSearchByName: jest.Mock;
  let mockedScrapeByName: jest.Mock;

  beforeAll(() => {
    jest.resetModules();
    process.env.ICA_LOOKUP_METHOD = "scraper";
    mockedSearchByName = jest.fn();
    mockedScrapeByName = jest.fn();
    handleSearchCompany = loadSearchCompany(mockedSearchByName, mockedScrapeByName);
  });

  afterAll(() => {
    jest.resetModules();
    delete process.env.ICA_LOOKUP_METHOD;
  });

  beforeEach(() => jest.clearAllMocks());

  test("calls scraper directly without touching the JSON API", async () => {
    mockedScrapeByName.mockResolvedValue([tase]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(mockedSearchByName).not.toHaveBeenCalled();
    expect(mockedScrapeByName).toHaveBeenCalled();
    expect(result.source).toBe("scraper");
  });

  test("returns scraper results", async () => {
    mockedScrapeByName.mockResolvedValue([tase]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].companyNumber).toBe("520020033");
  });

  test("returns empty source when scraper finds nothing", async () => {
    mockedScrapeByName.mockResolvedValue([]);
    const result: SearchResult = await handleSearchCompany({ name: "חברה לא קיימת" });
    expect(result.source).toBe("empty");
    expect(result.results).toHaveLength(0);
    expect(mockedSearchByName).not.toHaveBeenCalled();
  });
});

// ── ICA_LOOKUP_METHOD=both — handleSearchCompany ──────────────────────────────

describe('ICA_LOOKUP_METHOD=both — handleSearchCompany', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleSearchCompany: any;
  let mockedSearchByName: jest.Mock;
  let mockedScrapeByName: jest.Mock;

  beforeAll(() => {
    jest.resetModules();
    process.env.ICA_LOOKUP_METHOD = "both";
    mockedSearchByName = jest.fn();
    mockedScrapeByName = jest.fn();
    handleSearchCompany = loadSearchCompany(mockedSearchByName, mockedScrapeByName);
  });

  afterAll(() => {
    jest.resetModules();
    delete process.env.ICA_LOOKUP_METHOD;
  });

  beforeEach(() => jest.clearAllMocks());

  test("returns API result when found, without touching scraper", async () => {
    mockedSearchByName.mockResolvedValue([tase]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(result.source).toBe("api");
    expect(mockedScrapeByName).not.toHaveBeenCalled();
  });

  test("falls back to scraper when API returns empty", async () => {
    mockedSearchByName.mockResolvedValue([]);
    mockedScrapeByName.mockResolvedValue([tase]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(mockedScrapeByName).toHaveBeenCalled();
    expect(result.source).toBe("scraper");
  });

  test("returns empty when both API and scraper find nothing", async () => {
    mockedSearchByName.mockResolvedValue([]);
    mockedScrapeByName.mockResolvedValue([]);
    const result: SearchResult = await handleSearchCompany({ name: "חברה לא קיימת" });
    expect(result.source).toBe("empty");
  });
});

// ── ICA_LOOKUP_METHOD=scraper — handleGetCompany ──────────────────────────────

describe('ICA_LOOKUP_METHOD=scraper — handleGetCompany', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleGetCompany: any;
  let mockedGetByNumber: jest.Mock;

  beforeAll(() => {
    jest.resetModules();
    process.env.ICA_LOOKUP_METHOD = "scraper";
    mockedGetByNumber = jest.fn();
    handleGetCompany = loadGetCompany(mockedGetByNumber);
  });

  afterAll(() => {
    jest.resetModules();
    delete process.env.ICA_LOOKUP_METHOD;
  });

  beforeEach(() => jest.clearAllMocks());

  test("throws ApiError(501) — scraper has no number-lookup capability", async () => {
    // Use message check instead of constructor check — jest.resetModules() creates
    // a new ApiError class instance, making instanceof comparisons unreliable.
    await expect(handleGetCompany({ number: "512345679" })).rejects.toThrow(
      /ICA_LOOKUP_METHOD/
    );
    await expect(handleGetCompany({ number: "512345679" })).rejects.toMatchObject({ statusCode: 501 });
  });

  test("does not call the JSON API", async () => {
    await expect(handleGetCompany({ number: "512345679" })).rejects.toThrow();
    expect(mockedGetByNumber).not.toHaveBeenCalled();
  });
});

// ── ICA_LOOKUP_METHOD=json — handleGetCompany ─────────────────────────────────

describe('ICA_LOOKUP_METHOD=json — handleGetCompany', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleGetCompany: any;
  let mockedGetByNumber: jest.Mock;

  beforeAll(() => {
    jest.resetModules();
    process.env.ICA_LOOKUP_METHOD = "json";
    mockedGetByNumber = jest.fn();
    handleGetCompany = loadGetCompany(mockedGetByNumber);
  });

  afterAll(() => {
    jest.resetModules();
    delete process.env.ICA_LOOKUP_METHOD;
  });

  beforeEach(() => jest.clearAllMocks());

  test("calls JSON API and returns company", async () => {
    mockedGetByNumber.mockResolvedValue(tase);
    const result: GetCompanyResult = await handleGetCompany({ number: "512345679" });
    expect(mockedGetByNumber).toHaveBeenCalledWith("512345679");
    expect(result.company).toEqual(tase);
    expect(result.source).toBe("api");
  });

  test("throws ApiError(404) when company not found", async () => {
    mockedGetByNumber.mockResolvedValue(null);
    await expect(handleGetCompany({ number: "512345679" })).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ── ICA_LOOKUP_METHOD=both — handleGetCompany ─────────────────────────────────

describe('ICA_LOOKUP_METHOD=both — handleGetCompany', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleGetCompany: any;
  let mockedGetByNumber: jest.Mock;

  beforeAll(() => {
    jest.resetModules();
    process.env.ICA_LOOKUP_METHOD = "both";
    mockedGetByNumber = jest.fn();
    handleGetCompany = loadGetCompany(mockedGetByNumber);
  });

  afterAll(() => {
    jest.resetModules();
    delete process.env.ICA_LOOKUP_METHOD;
  });

  beforeEach(() => jest.clearAllMocks());

  test("calls JSON API and returns company", async () => {
    mockedGetByNumber.mockResolvedValue(tase);
    const result: GetCompanyResult = await handleGetCompany({ number: "512345679" });
    expect(mockedGetByNumber).toHaveBeenCalledWith("512345679");
    expect(result.source).toBe("api");
  });

  test("throws ApiError(404) when company not found", async () => {
    mockedGetByNumber.mockResolvedValue(null);
    await expect(handleGetCompany({ number: "512345679" })).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ── Unknown ICA_LOOKUP_METHOD — falls back to "both" ─────────────────────────

describe('ICA_LOOKUP_METHOD=invalid — falls back to "both" behaviour', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handleSearchCompany: any;
  let mockedSearchByName: jest.Mock;
  let mockedScrapeByName: jest.Mock;

  beforeAll(() => {
    jest.resetModules();
    process.env.ICA_LOOKUP_METHOD = "nonsense";
    mockedSearchByName = jest.fn();
    mockedScrapeByName = jest.fn();
    handleSearchCompany = loadSearchCompany(mockedSearchByName, mockedScrapeByName);
  });

  afterAll(() => {
    jest.resetModules();
    delete process.env.ICA_LOOKUP_METHOD;
  });

  beforeEach(() => jest.clearAllMocks());

  test("still calls JSON API (defaults to both)", async () => {
    mockedSearchByName.mockResolvedValue([tase]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(mockedSearchByName).toHaveBeenCalled();
    expect(result.source).toBe("api");
  });

  test("falls back to scraper when API empty (defaults to both)", async () => {
    mockedSearchByName.mockResolvedValue([]);
    mockedScrapeByName.mockResolvedValue([tase]);
    const result: SearchResult = await handleSearchCompany({ name: "טכנוגל" });
    expect(mockedScrapeByName).toHaveBeenCalled();
    expect(result.source).toBe("scraper");
  });
});
