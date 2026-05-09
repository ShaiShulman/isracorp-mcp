// Israeli Companies Registrar ("רשם החברות") (ICA) endpoints and configuration

// Lookup method: "json" = API only, "scraper" = scraper only, "both" = API with scraper fallback
export type LookupMethod = "json" | "scraper" | "both";
export const LOOKUP_METHOD: LookupMethod = (() => {
  const v = (process.env.ICA_LOOKUP_METHOD ?? "both").toLowerCase();
  if (v === "json" || v === "scraper" || v === "both") return v;
  console.error(`[icaConstants] Unknown ICA_LOOKUP_METHOD "${v}", defaulting to "both"`);
  return "both";
})();

export const ICA_API_URL =
  "https://ica.justice.gov.il/GenericCorporarionInfo/SearchGenericCorporation";

export const ICA_SEARCH_PAGE_URL =
  "https://ica.justice.gov.il/GenericCorporarionInfo/SearchCorporation?unit=8";

// corporationType=3 = Israeli companies (עמותות = 1, חברה = 3)
export const ICA_CORPORATION_TYPE = "3";

// Headers required to mimic a browser XHR request.
// The ICA endpoint is designed for web browser use and may reject requests
// that don't include these headers.
export const ICA_REQUIRED_HEADERS: Record<string, string> = {
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://ica.justice.gov.il/",
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
  "X-Requested-With": "XMLHttpRequest",
};

// Legal suffixes to strip from company names before searching.
// Order matters: longer suffixes first to avoid partial stripping.
// Longer/compound suffixes must come before their shorter components so they match first
export const LEGAL_SUFFIXES_HE = ['בע"מ', 'בע"מ', "בעמ", "בע״מ", "ב.מ.", "חברה ציבורית", "חברת פרטית"];

export const LEGAL_SUFFIXES_EN = [
  "Limited",
  "Ltd.",
  "Ltd",
  "B.M.",
  "BM",
  "LLC",
  "LP",
  "LLP",
];

export const ALL_LEGAL_SUFFIXES = [...LEGAL_SUFFIXES_HE, ...LEGAL_SUFFIXES_EN];
