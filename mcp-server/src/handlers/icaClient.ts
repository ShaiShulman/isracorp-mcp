import fetch from "node-fetch";
import {
  ICA_API_URL,
  ICA_CORPORATION_TYPE,
  ICA_REQUIRED_HEADERS,
} from "../const/icaConstants";
import { ApiError } from "../const/ApiError";
import { mapCompany } from "../data/companyFields";
import { IcaCompany, RawIcaResponse } from "../interfaces/interfaces";

const TIMEOUT_MS = parseInt(process.env.ICA_REQUEST_TIMEOUT_MS ?? "10000", 10);
const MAX_RETRIES = parseInt(process.env.ICA_MAX_RETRIES ?? "2", 10);

/**
 * Searches for companies by name via the ICA JSON API.
 * Returns up to 10 matching companies, or an empty array.
 */
export async function searchByName(name: string): Promise<IcaCompany[]> {
  const body = buildFormBody({ name });
  const raw = await postWithRetry(body);
  return raw.Data.map(mapCompany);
}

/**
 * Looks up a single company by its 9-digit registration number.
 * Returns the company, or null if not found.
 */
export async function getByNumber(number: string): Promise<IcaCompany | null> {
  const body = buildFormBody({ number });
  const raw = await postWithRetry(body);
  if (raw.Data.length === 0) return null;
  return mapCompany(raw.Data[0]);
}

// ── Internal ─────────────────────────────────────────────────────────────────

function buildFormBody(params: { name?: string; number?: string }): string {
  const nameEncoded = encodeURIComponent(params.name ?? "");
  const numberEncoded = encodeURIComponent(params.number ?? "");
  return [
    `corporationType=${ICA_CORPORATION_TYPE}`,
    `corporationNumber=${numberEncoded}`,
    `corporationName=${nameEncoded}`,
  ].join("&");
}

async function postWithRetry(body: string): Promise<RawIcaResponse> {
  let lastError: Error = new ApiError("ICA API: no attempts made");

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      timeout.unref();

      const res = await fetch(ICA_API_URL, {
        method: "POST",
        headers: ICA_REQUIRED_HEADERS,
        body,
        signal: controller.signal as Parameters<typeof fetch>[1] extends { signal?: infer S } ? S : never,
      });

      clearTimeout(timeout);

      if (res.status === 200) {
        const json = (await res.json()) as RawIcaResponse;
        return json;
      }

      lastError = new ApiError(
        `ICA API returned HTTP ${res.status}`,
        res.status
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        lastError = new ApiError(
          `ICA API timed out after ${TIMEOUT_MS}ms`,
          408
        );
      } else {
        lastError = err as Error;
      }
    }
  }

  throw lastError;
}
