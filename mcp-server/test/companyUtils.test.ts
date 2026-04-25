import {
  normaliseCompanyName,
  normaliseCompanyNumber,
  formatCompanyNumber,
  validateCompanyNumber,
  pickBestMatch,
  formatCitation,
  getNumberLabel,
  getWarning,
} from "../src/data/companyUtils";
import { IcaCompany } from "../src/interfaces/interfaces";

// ── Fixtures (made-up companies) ──────────────────────────────────────────────

// Made-up company: "טכנוגל בע"מ" / TECHNOgel LTD, number 51-234567-9
const technoGel: IcaCompany = {
  companyNumber: "512345679",
  hebrewName: 'טכנוגל בע"מ',
  englishName: "TECHNOgel LTD",
  status: "פעילה",
  companyType: "ישראלית",
  limitType: "מוגבלת",
  registrationDate: "15/03/2010",
  address: "חיפה, רחוב הנמל 12",
  city: "חיפה",
  violationStatus: null,
};

// Made-up public company: number starts with 52
const technoGelPublic: IcaCompany = {
  ...technoGel,
  companyNumber: "520000001",
  hebrewName: 'טכנוגל ציבורית בע"מ',
  englishName: "TECHNOgel PUBLIC LTD",
  limitType: "מוגבלת",
};

const dissolved: IcaCompany = {
  ...technoGel,
  companyNumber: "511111110",
  hebrewName: "חברה מחוקה בע\"מ",
  englishName: "DISSOLVED CO LTD",
  status: "מחוקה",
  violationStatus: null,
};

const violating: IcaCompany = {
  ...technoGel,
  companyNumber: "511111128",
  hebrewName: "חברה מפרה בע\"מ",
  englishName: "VIOLATING CO LTD",
  status: "פעילה",
  violationStatus: "מפרה",
};

// ── normaliseCompanyName ───────────────────────────────────────────────────────

describe("normaliseCompanyName", () => {
  test("strips בע\"מ suffix", () => {
    expect(normaliseCompanyName('טכנוגל בע"מ')).toBe("טכנוגל");
  });

  test("strips בעמ suffix (no quotes)", () => {
    expect(normaliseCompanyName("טכנוגל בעמ")).toBe("טכנוגל");
  });

  test("strips Ltd suffix", () => {
    expect(normaliseCompanyName("TECHNOCEL LTD")).toBe("TECHNOCEL");
  });

  test("strips Limited suffix", () => {
    expect(normaliseCompanyName("Acme Limited")).toBe("Acme");
  });

  test("strips Ltd. with period", () => {
    expect(normaliseCompanyName("Acme Ltd.")).toBe("Acme");
  });

  test("strips ציבורית suffix", () => {
    expect(normaliseCompanyName('חברה ציבורית בע"מ ציבורית')).toBe("חברה ציבורית");
  });

  test("leaves name without suffix unchanged", () => {
    expect(normaliseCompanyName("טכנוגל")).toBe("טכנוגל");
  });

  test("trims surrounding whitespace", () => {
    expect(normaliseCompanyName("  טכנוגל  ")).toBe("טכנוגל");
  });

  test("strips only one suffix", () => {
    expect(normaliseCompanyName("ACME LTD")).toBe("ACME");
  });
});

// ── normaliseCompanyNumber / formatCompanyNumber ───────────────────────────────

describe("normaliseCompanyNumber", () => {
  test("strips dashes from dashed format", () => {
    expect(normaliseCompanyNumber("51-234567-9")).toBe("512345679");
  });

  test("leaves raw 9-digit number unchanged", () => {
    expect(normaliseCompanyNumber("512345679")).toBe("512345679");
  });
});

describe("formatCompanyNumber", () => {
  test("formats 9-digit number as XX-XXXXXX-X", () => {
    expect(formatCompanyNumber("512345679")).toBe("51-234567-9");
  });

  test("normalises dashed input then reformats", () => {
    expect(formatCompanyNumber("51-234567-9")).toBe("51-234567-9");
  });

  test("returns input unchanged if not 9 digits", () => {
    expect(formatCompanyNumber("12345")).toBe("12345");
  });
});

// ── validateCompanyNumber ─────────────────────────────────────────────────────

describe("validateCompanyNumber", () => {
  test("rejects non-9-digit strings", () => {
    expect(validateCompanyNumber("12345678")).toBe(false);   // 8 digits
    expect(validateCompanyNumber("1234567890")).toBe(false); // 10 digits
    expect(validateCompanyNumber("")).toBe(false);
    expect(validateCompanyNumber("ABC123456")).toBe(false);
  });

  test("accepts valid number 512345679 (sum 31+9=40)", () => {
    expect(validateCompanyNumber("512345679")).toBe(true);
  });

  test("accepts dashed form of the same valid number", () => {
    expect(validateCompanyNumber("51-234567-9")).toBe(true);
  });

  test("rejects number with wrong last digit", () => {
    expect(validateCompanyNumber("512345678")).toBe(false); // sum would be 39
    expect(validateCompanyNumber("512345670")).toBe(false); // sum would be 31
  });
});

// ── pickBestMatch ─────────────────────────────────────────────────────────────

describe("pickBestMatch", () => {
  test("returns null for empty candidate list", () => {
    expect(pickBestMatch("טכנוגל", [])).toBeNull();
  });

  test("returns the single candidate regardless of score", () => {
    const result = pickBestMatch("טכנוגל", [technoGel]);
    expect(result).toEqual(technoGel);
  });

  test("picks best match by Hebrew name", () => {
    const other: IcaCompany = { ...technoGel, hebrewName: "חברה אחרת", englishName: "OTHER CO" };
    const result = pickBestMatch("טכנוגל", [technoGel, other]);
    expect(result).toEqual(technoGel);
  });

  test("picks best match by English name", () => {
    const other: IcaCompany = { ...technoGel, hebrewName: "חברה אחרת", englishName: "OTHER CO" };
    const result = pickBestMatch("TECHNOCEL", [technoGel, other]);
    expect(result).toEqual(technoGel);
  });

  test("returns array of two when candidates are very similar", () => {
    // Both candidates score equally: each contributes 1 out of 2 mention tokens
    // mention "טכנוגל טכנולוגיות" → {טכנוגל, טכנולוגיות}
    // candidate1 normalised "טכנוגל" → jaccard = 1/2
    // candidate2 normalised "טכנולוגיות" → jaccard = 1/2
    // ratio = 1.0 ≥ 0.9 → ambiguous → array returned
    const candidate1: IcaCompany = {
      ...technoGel,
      companyNumber: "511111110",
      hebrewName: 'טכנוגל בע"מ',
      englishName: "TECHNOCEL LTD",
    };
    const candidate2: IcaCompany = {
      ...technoGel,
      companyNumber: "511111128",
      hebrewName: 'טכנולוגיות בע"מ',
      englishName: "TECHNOLOGIES LTD",
    };
    const result = pickBestMatch("טכנוגל טכנולוגיות", [candidate1, candidate2]);
    expect(Array.isArray(result)).toBe(true);
    expect((result as IcaCompany[]).length).toBe(2);
  });
});

// ── getNumberLabel ─────────────────────────────────────────────────────────────

describe("getNumberLabel", () => {
  test('returns "ח.פ." for a private company (number starts with 51)', () => {
    expect(getNumberLabel(technoGel, "he")).toBe("ח.פ.");
  });

  test('returns "ח.צ." for a company whose number starts with 52', () => {
    const pub: IcaCompany = { ...technoGel, companyNumber: "520000001" };
    expect(getNumberLabel(pub, "he")).toBe("ח.צ.");
  });

  test('returns "ח.צ." when hebrewName contains ציבורית', () => {
    const pub: IcaCompany = { ...technoGel, hebrewName: 'טכנוגל ציבורית בע"מ' };
    expect(getNumberLabel(pub, "he")).toBe("ח.צ.");
  });

  test('returns "ח.צ." when limitType contains ציבורית', () => {
    const pub: IcaCompany = { ...technoGel, limitType: "ציבורית" };
    expect(getNumberLabel(pub, "he")).toBe("ח.צ.");
  });

  test('returns "Company Number" for English regardless of company type', () => {
    expect(getNumberLabel(technoGel, "en")).toBe("Company Number");
    expect(getNumberLabel(technoGelPublic, "en")).toBe("Company Number");
  });
});

// ── formatCitation ────────────────────────────────────────────────────────────

describe("formatCitation", () => {
  test("formats Hebrew citation for private company using ח.פ.", () => {
    const result = formatCitation(technoGel, "he");
    expect(result).toContain("51-234567-9");
    expect(result).toContain("ח.פ.");
    expect(result).not.toContain("ח.צ.");
    expect(result).toContain("כתובת רשומה");
  });

  test("formats Hebrew citation for public company using ח.צ.", () => {
    const result = formatCitation(technoGelPublic, "he");
    expect(result).toContain("ח.צ.");
    expect(result).not.toContain("ח.פ.");
  });

  test("formats English citation using Company Number", () => {
    const result = formatCitation(technoGel, "en");
    expect(result).toContain("51-234567-9");
    expect(result).toContain("Company Number");
    expect(result).not.toContain("No.");
    expect(result).toContain("registered address");
    expect(result).toContain("TECHNOgel LTD");
  });
});

// ── getWarning ────────────────────────────────────────────────────────────────

describe("getWarning", () => {
  test("returns null for active company with no violations", () => {
    expect(getWarning(technoGel)).toBeNull();
  });

  test("returns warning for dissolved company", () => {
    const warning = getWarning(dissolved);
    expect(warning).not.toBeNull();
    expect(warning).toContain("מחוקה");
  });

  test("returns warning for violating company", () => {
    const warning = getWarning(violating);
    expect(warning).not.toBeNull();
    expect(warning).toContain("מפרה");
  });

  test("returns combined warning for dissolved AND violating", () => {
    const both: IcaCompany = { ...dissolved, violationStatus: "מפרה" };
    const warning = getWarning(both);
    expect(warning).toContain("מחוקה");
    expect(warning).toContain("מפרה");
  });
});
