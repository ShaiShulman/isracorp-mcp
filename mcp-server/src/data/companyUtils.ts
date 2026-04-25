import { IcaCompany } from "../interfaces/interfaces";
import { ALL_LEGAL_SUFFIXES } from "../const/icaConstants";

/**
 * Strips common Israeli/English legal suffixes and normalises whitespace.
 * Used to improve name-match rates against the ICA API.
 */
export function normaliseCompanyName(name: string): string {
  let result = name.trim();

  // Strip suffixes — order matters (longer first, already sorted in icaConstants)
  for (const suffix of ALL_LEGAL_SUFFIXES) {
    // Case-insensitive suffix removal, with optional trailing period or whitespace
    const pattern = new RegExp(
      `\\s*${escapeRegex(suffix)}\\s*\\.?\\s*$`,
      "i"
    );
    if (pattern.test(result)) {
      result = result.replace(pattern, "").trim();
      break; // strip one suffix at most
    }
  }

  return result.trim();
}

/**
 * Strips dashes from a company number string and returns the 9-digit raw form.
 * Accepts both "511234561" and "51-123456-1" formats.
 */
export function normaliseCompanyNumber(number: string): string {
  return number.replace(/-/g, "");
}

/**
 * Formats a 9-digit company number in the display format: XX-XXXXXX-X
 * e.g. "511234561" → "51-123456-1"
 */
export function formatCompanyNumber(number: string): string {
  const n = normaliseCompanyNumber(number);
  if (n.length !== 9) return number; // return as-is if not 9 digits
  return `${n.slice(0, 2)}-${n.slice(2, 8)}-${n.slice(8)}`;
}

/**
 * Validates an Israeli company registration number (9 digits, check digit).
 * Accepts both raw ("511234561") and dashed ("51-123456-1") formats.
 *
 * Algorithm (modulo-10 / Luhn-like):
 *   For each of the first 8 digits, multiply alternately by 1 and 2.
 *   If the product > 9, sum its digits.
 *   Sum all values. The 9th digit is valid if (total % 10 === 0).
 */
export function validateCompanyNumber(number: string): boolean {
  const raw = normaliseCompanyNumber(number);
  if (!/^\d{9}$/.test(raw)) return false;

  const digits = raw.split("").map(Number);
  let total = 0;

  for (let i = 0; i < 8; i++) {
    let val = digits[i] * (i % 2 === 0 ? 1 : 2);
    if (val > 9) val = Math.floor(val / 10) + (val % 10);
    total += val;
  }

  return (total + digits[8]) % 10 === 0;
}

/**
 * Picks the best matching company from a list of candidates for a given mention.
 *
 * Returns:
 *  - A single IcaCompany if one clear winner
 *  - An array of 2 companies if two candidates are within 10% of each other (caller must ask user)
 *  - null if no candidates
 */
export function pickBestMatch(
  mention: string,
  candidates: IcaCompany[]
): IcaCompany | IcaCompany[] | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const normMention = normaliseCompanyName(mention).toLowerCase();

  // Score each candidate by Jaccard token overlap
  const scored = candidates.map((c) => {
    const normHe = normaliseCompanyName(c.hebrewName).toLowerCase();
    const normEn = normaliseCompanyName(c.englishName).toLowerCase();
    const score = Math.max(
      jaccardScore(normMention, normHe),
      jaccardScore(normMention, normEn)
    );
    return { company: c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];

  // If the top two are within 10% of each other, return both for user disambiguation
  if (best.score > 0 && second.score / best.score >= 0.9) {
    return [best.company, second.company];
  }

  return best.company;
}

/**
 * Returns the appropriate registration number label for a company.
 *
 * Hebrew:
 *   - "ח.צ." for public companies (number starts with "52", name contains "ציבורית",
 *     or limitType contains "ציבורית")
 *   - "ח.פ." for all other companies
 * English:
 *   - "Company Number"
 *
 * When inserting into a document that already has a label (ח.פ., ח.צ., Company Number),
 * the caller should preserve the existing label rather than using this function's output.
 */
export function getNumberLabel(company: IcaCompany, lang: "he" | "en"): string {
  if (lang === "en") return "Company Number";

  const isPublic =
    company.companyNumber.startsWith("52") ||
    company.hebrewName.includes("ציבורית") ||
    (!!company.limitType && company.limitType.includes("ציבורית"));

  return isPublic ? "ח.צ." : "ח.פ.";
}

/**
 * Formats a company citation in the standard legal format.
 * Company number is displayed in dashed format: XX-XXXXXX-X
 * Uses ח.פ. / ח.צ. in Hebrew and "Company Number" in English.
 */
export function formatCitation(company: IcaCompany, lang: "he" | "en"): string {
  const displayNumber = formatCompanyNumber(company.companyNumber);
  const label = getNumberLabel(company, lang);

  if (lang === "he") {
    const address = company.address || company.city || "ישראל";
    return `${company.hebrewName}, ${label} ${displayNumber}, עם כתובת רשומה ב${address}`;
  } else {
    const name = company.englishName || company.hebrewName;
    const address = company.address || company.city || "Israel";
    return `${name}, ${label} ${displayNumber}, with registered address at ${address}`;
  }
}

/**
 * Returns a warning string if the company has a non-active status or violation flag.
 * Returns null if the company is in good standing.
 */
export function getWarning(company: IcaCompany): string | null {
  const warnings: string[] = [];

  if (company.status && company.status !== "פעילה") {
    warnings.push(`Company status: ${company.status}`);
  }

  if (company.violationStatus) {
    warnings.push(`Violation flag: ${company.violationStatus}`);
  }

  return warnings.length > 0 ? warnings.join("; ") : null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tokenise(text: string): Set<string> {
  return new Set(text.split(/\s+/).filter((t) => t.length > 0));
}

function jaccardScore(a: string, b: string): number {
  const setA = tokenise(a);
  const setB = tokenise(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
