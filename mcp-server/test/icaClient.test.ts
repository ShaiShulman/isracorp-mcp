// Mock node-fetch before any imports
jest.mock("node-fetch");
import fetch from "node-fetch";
const { Response } = jest.requireActual("node-fetch");

import { searchByName, getByNumber } from "../src/handlers/icaClient";

const fixtureResponse = require("./fixtures/ica-response.json");
const emptyResponse = require("./fixtures/ica-response-empty.json");

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

function makeResponse(body: object, status = 200): ReturnType<typeof fetch> {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status })
  ) as ReturnType<typeof fetch>;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ICA_MAX_RETRIES = "2";
  process.env.ICA_REQUEST_TIMEOUT_MS = "5000";
});

// ── searchByName ──────────────────────────────────────────────────────────────

describe("searchByName", () => {
  test("returns mapped companies on successful response", async () => {
    mockedFetch.mockReturnValue(makeResponse(fixtureResponse));

    const results = await searchByName("טכנוגל");

    expect(results).toHaveLength(1);
    expect(results[0].companyNumber).toBe("512345679");
    expect(results[0].hebrewName).toBe('טכנוגל בע"מ');
    expect(results[0].englishName).toBe("TECHNOgel LTD");
  });

  test("sends correct Content-Type header", async () => {
    mockedFetch.mockReturnValue(makeResponse(fixtureResponse));

    await searchByName("טכנוגל");

    const callArgs = mockedFetch.mock.calls[0];
    const options = callArgs[1] as { headers: Record<string, string> };
    expect(options.headers["Content-Type"]).toContain(
      "application/x-www-form-urlencoded"
    );
  });

  test("URL-encodes Hebrew name in form body", async () => {
    mockedFetch.mockReturnValue(makeResponse(fixtureResponse));

    await searchByName("טכנוגל");

    const callArgs = mockedFetch.mock.calls[0];
    const body = callArgs[1]?.body as string;
    // Hebrew "טכנוגל" URL-encodes to %D7%98%D7%9B%D7%A0%D7%95%D7%92%D7%9C
    expect(body).toContain("corporationName=%D7%98%D7%9B%D7%A0%D7%95%D7%92%D7%9C");
  });

  test("includes corporationType=3 in form body", async () => {
    mockedFetch.mockReturnValue(makeResponse(fixtureResponse));

    await searchByName("test");

    const body = mockedFetch.mock.calls[0][1]?.body as string;
    expect(body).toContain("corporationType=3");
  });

  test("returns empty array when API returns empty Data", async () => {
    mockedFetch.mockReturnValue(makeResponse(emptyResponse));

    const results = await searchByName("חברה לא קיימת");
    expect(results).toHaveLength(0);
  });

  test("retries on non-200 response, then throws", async () => {
    mockedFetch.mockReturnValue(
      makeResponse({ error: "server error" }, 500)
    );

    await expect(searchByName("טכנוגל")).rejects.toThrow("500");
    // Should have retried MAX_RETRIES (2) times
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  test("throws ApiError on timeout", async () => {
    // Simulate abort by rejecting with AbortError
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    mockedFetch.mockRejectedValue(abortError);

    await expect(searchByName("טכנוגל")).rejects.toThrow("timed out");
  });
});

// ── getByNumber ───────────────────────────────────────────────────────────────

describe("getByNumber", () => {
  test("returns mapped company for valid number", async () => {
    mockedFetch.mockReturnValue(makeResponse(fixtureResponse));

    const company = await getByNumber("512345679");

    expect(company).not.toBeNull();
    expect(company!.companyNumber).toBe("512345679");
    expect(company!.englishName).toBe("TECHNOgel LTD");
  });

  test("returns null when API returns empty Data", async () => {
    mockedFetch.mockReturnValue(makeResponse(emptyResponse));

    const company = await getByNumber("000000000");
    expect(company).toBeNull();
  });

  test("sends number in form body with empty name", async () => {
    mockedFetch.mockReturnValue(makeResponse(fixtureResponse));

    await getByNumber("512345679");

    const body = mockedFetch.mock.calls[0][1]?.body as string;
    expect(body).toContain("corporationNumber=512345679");
    expect(body).toContain("corporationName=");
    // Name should be empty
    const nameParam = body.split("&").find((p) => p.startsWith("corporationName="));
    expect(nameParam).toBe("corporationName=");
  });
});
