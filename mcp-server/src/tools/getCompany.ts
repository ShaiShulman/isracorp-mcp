import { z } from "zod";
import { validateCompanyNumber, normaliseCompanyNumber } from "../data/companyUtils";
import { getByNumber } from "../handlers/icaClient";
import { ApiError } from "../const/ApiError";
import { GetCompanyResult } from "../interfaces/interfaces";

export const getCompanySchema = z.object({
  number: z
    .string()
    // Accept both raw (511234561) and dashed (51-123456-1) formats
    .regex(/^\d{2}-?\d{6}-?\d{1}$|^\d{9}$/, "Company number must be 9 digits, optionally formatted as XX-XXXXXX-X")
    .describe("Israeli company registration number (ח.פ. / ח.צ.) — 9 digits, optionally formatted as XX-XXXXXX-X"),
});

export type GetCompanyInput = z.infer<typeof getCompanySchema>;

/**
 * get_company tool handler.
 *
 * Accepts both raw ("511234561") and dashed ("51-123456-1") number formats.
 *
 * Flow:
 *   1. Normalise number (strip dashes)
 *   2. Validate check digit
 *   3. Query the ICA JSON API by company number
 *   4. Return the company or a 404 error
 */
export async function handleGetCompany(
  input: GetCompanyInput
): Promise<GetCompanyResult> {
  const number = normaliseCompanyNumber(input.number);

  if (!validateCompanyNumber(number)) {
    throw new ApiError(
      `"${input.number}" is not a valid Israeli company number (check digit validation failed)`,
      400
    );
  }

  const company = await getByNumber(number);

  if (!company) {
    throw new ApiError(
      `Company number ${number} was not found in the Israeli Companies Registrar`,
      404
    );
  }

  return { company, source: "api" };
}
