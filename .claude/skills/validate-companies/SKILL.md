---
name: validate-companies
description: 'Use this skill when the user wants to validate, look up, or fill in details about Israeli companies mentioned in conversation text or pasted document content (NOT a .docx file — for .docx files use validate-companies-docx instead). Triggers on: Hebrew company names ending in בע"מ or similar legal suffixes; 9-digit Israeli company numbers (ח.פ/ח.צ.); phrases like ''validate company'', ''find company number'', ''check registration'', ''fill in company details'', ''complete company information''; any request to produce a legal citation for an Israeli company in the format ''Company Ltd, No. ___, incorporated in ___'', ''company with registered address at ___''. Also triggers when legal agreement text is pasted that contains company names without registration numbers, or with placeholder blanks like ח.פ. ___ or ח.צ. ___ or No. ___. Also triggers on Hebrew legal incorporation phrases such as ''חברה המאוגדת בישראל'', ''חברה הרשומה בישראל'', ''חברת שמשרדה הרשום בכתובת ___ ישראל'', or any sentence describing a company as incorporated, registered, or having a registered office in Israel — with or without a company name preceding the phrase. Also triggers when the user uploads or pastes content from any non-docx document (PDF, image, text file) that contains Israeli company references. IMPORTANT: If the user references or provides a path to a .docx file, do NOT use this skill — use validate-companies-docx instead.'
---

# validate-companies

Validates Israeli company references in text by looking them up in the Israeli Companies Registrar (ICA) via the `isracorp` MCP server.

## Required MCP Server

This skill requires the `isracorp` MCP server to be running and registered. The server exposes two tools:

- `search_company(name)` — search by partial name (Hebrew or English)
- `get_company(number)` — lookup by 9-digit registration number

## Workflow

### Step 1: Extract Company References

Scan the text for company mentions:

1. **Hebrew names with legal suffixes**: patterns matching `<name> בע"מ`, `<name> בעמ`, `<name> בע״מ`, `<name> חברה ציבורית`, `<name> בערבון מוגבל`
2. **English names with legal suffixes**: `<NAME> Ltd`, `<NAME> Limited`, `<NAME> Inc`, `<NAME> LLC`
3. **Company numbers already present**: `ח.פ. XXXXXXXXX`, `ח"פ XXXXXXXXX`, `ח.צ. XXXXXXXXX`, `ח"צ XXXXXXXXX`, `No. XXXXXXXXX` (9-digit sequences, with or without dashes in XX-XXXXXX-X format)
4. **Placeholder patterns** indicating missing details: `ח.פ. ___`, `ח.צ. ___`, `No. ___`, `incorporated in ___`, `registered in ___`, `with registered address at ____`
5. **Hebrew incorporation/registration phrases** — these signal a company reference even without a name immediately preceding them:
   - `חברה המאוגדת בישראל` — "a company incorporated in Israel"
   - `חברה הרשומה בישראל` — "a company registered in Israel"
   - `חברת שמשרדה הרשום ב[כתובת]` — "a company whose registered office is at [address]"
   - `שמשרדה הרשום בכתובת ___` — registered office address placeholder
   - `חברה ישראלית` — generic "Israeli company" label
   - Any variant of the above with blanks (`___`) in place of a name, number, or address

   When such a phrase appears **with a name before it**, treat the name + phrase as a single company reference and attempt to validate the name. When it appears **with only blanks**, flag it as an incomplete reference and prompt the user to supply the company name or number.

For each mention, note:

- The company name (Hebrew and/or English), if present
- The registration number if already present
- Which details are missing (number, city/address, status)
- Whether the mention uses an incorporation phrase (affects the citation format)

### Step 2: Validate Each Mention

For each extracted mention:

**If a company number is already present:**

```
→ call get_company({ number: "XXXXXXXXX" })
→ verify it matches the name in the text
→ if mismatch: flag as discrepancy
```

**If only a name is present (no number):**

```
→ strip legal suffix from the name
→ call search_company({ name: "<stripped name>" })
→ if no results AND name contains parentheses: strip the parenthetical and retry
  (e.g. "שירותי בריאות (ירושלים)" → retry as "שירותי בריאות")
→ if multiple results: use pickBestMatch logic (see below)
→ if still no results: mark as "not found"
```

**pickBestMatch logic:**

- If one result clearly matches (name is a close match) → use it
- If 2 results are nearly equally close → present both to the user and ask them to select
- If no results match well → mark as "not found"

### Step 3: Format and Present Results

For each **confirmed match** with missing details, produce the completed citation.

**Determining the number label:**

| Situation | Hebrew label | English label |
|---|---|---|
| Company number starts with `52` | `ח.צ.` | `Company Number` |
| Hebrew name or type contains `ציבורית` | `ח.צ.` | `Company Number` |
| All other companies (default) | `ח.פ.` | `Company Number` |

**Preserving existing labels:** If the source text already contains a label (`ח.פ.`, `ח.צ.`, or `Company Number`) next to a placeholder blank, keep that label exactly as written — do not replace it even if the company type would suggest a different label.

**Hebrew context — standard citation:**

```
[שם בעברית], [ח.פ.|ח.צ.] [מספר], עם כתובת רשומה ב[כתובת]
```

Example (private): `חברת בע"מ, ח.פ. 51-123456-1, עם כתובת רשומה ברחוב ביאליק 46, תל אביב-יפו`
Example (public): `חברה בע"מ, ח.צ. 52-123456-1, עם כתובת רשומה ברחוב הרצל 12, תל אביב-יפו`

**Hebrew context — incorporation phrase** (when the original text uses `חברה המאוגדת בישראל` / `חברה הרשומה בישראל` / `שמשרדה הרשום ב`): preserve the original phrasing and insert the missing details inline:

```
[שם בעברית], [ח.פ.|ח.צ.] [מספר], חברה המאוגדת בישראל, שמשרדה הרשום ב[כתובת]
```

Example: `טכנוגל בע"מ, ח.פ. 51-234567-9, חברה הרשומה בישראל, שמשרדה הרשום ברחוב הנמל 12, חיפה`

**English context:**

```
[English Name], Company Number [XX-XXXXXX-X], with registered address at [number] [street], [city]
```

Example: `Commercial LTD, Company Number 51-123456-1, with registered address at 54 Bialik Street, Tel Aviv-Yafo`

For **not found** companies, clearly state:

```
"[Name]" was not found in the Israeli Companies Registrar. Please verify the name before using.
```

For **dissolved or violating** companies, include a warning:

```
⚠ WARNING: [Name] ([ח.פ.|ח.צ.] XXXXXXXXX) — Status: מחוקה / violation: מפרה. Verify current status before signing.
```

### Step 4: Report Summary

Present a structured summary:

```
Found X company reference(s):

✓ Validated: [Hebrew name] / [English name]
  [ח.פ.|ח.צ.] [number] | Status: [status] | [address]
  Citation: [formatted citation]

⚠ Warning: [Hebrew name] / [English name]
  [ח.פ.|ח.צ.] [number] | Status: מחוקה — company is dissolved

✗ Not found: [company name as mentioned]
  Could not find this company in the Israeli Companies Registrar.
  Suggestions: [top 2 candidates if any, for manual verification]
```

Always show both Hebrew and English names in the summary when the registry has both. If the English name is absent from the registry, omit the ` / [English name]` part.

## Examples

### Example 1: Fill in missing number

**Input:** "הסכם בין טכנוגל בע"מ, ח.פ. \_\_\_, לבין צד ב"

**Process:**

1. Extract: `טכנוגל בע"מ` with placeholder number
2. `search_company({ name: "טכנוגל" })` → returns TECHNOgel LTD, 51-234567-9
3. Confirm single clear match

**Output:** `טכנוגל בע"מ, ח.פ. 51-234567-9, עם כתובת רשומה ברחוב הנמל 12, חיפה`

### Example 2: Incorporation phrase with blank address

**Input:** "טכנוגל בע"מ, חברה הרשומה בישראל, שמשרדה הרשום בכתובת ___, ח.פ. ___"

**Process:**

1. Extract: `טכנוגל בע"מ` — name known; number and address are placeholders; incorporation phrase `חברה הרשומה בישראל / שמשרדה הרשום ב` detected
2. `search_company({ name: "טכנוגל" })` → returns TECHNOgel LTD, 51-234567-9, registered address: רחוב הנמל 12, חיפה
3. Fill all placeholders, preserving original phrasing

**Output:** `טכנוגל בע"מ, ח.פ. 51-234567-9, חברה הרשומה בישראל, שמשרדה הרשום ברחוב הנמל 12, חיפה`

### Example 3: Verify existing number

**Input:** "BUILDWISE LTD, Company Number 51-234567-9, with registered address at 12 HaNamal Street, Haifa"

**Process:**

1. Extract: BUILDWISE LTD with number 51-234567-9
2. `get_company({ number: "51-234567-9" })` → returns TECHNOgel LTD (different name)
3. Flag mismatch

**Output:** ⚠ Discrepancy: Number 51-234567-9 belongs to TECHNOgel LTD, not BUILDWISE LTD. Please check.

## Notes

- Always verify: company number check digit is validated before any API call
- Language detection: if the surrounding text is Hebrew (majority of characters in Hebrew Unicode range `\u0590–\u05FF`), use Hebrew citation format; otherwise use English
- If the `isracorp` MCP server is not available, inform the user and suggest checking ica.justice.gov.il manually
