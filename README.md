<p align="center">
  <h1 align="center">🏛️ IsraCorp MCP</h1>
  <p align="center">
    <strong>שרת MCP לחיפוש ואימות פרטי רישום חברות ישראליות מרשם החברות הישראלי.</strong>
  </p>
  <p align="center">
  <strong>MCP server for looking up and validating company registration details from the Israeli Companies Registrar.</strong></p>
  <p align="center">
    <a href="https://github.com/ShaiShulman/isracorp-mcp/releases/latest"><img src="https://img.shields.io/github/v/release/ShaiShulman/isracorp-mcp?style=flat-square&color=brightgreen" alt="Latest Release"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="License"></a>
    <img src="https://img.shields.io/badge/MCP-server-green?style=flat-square" alt="MCP Server">
    <img src="https://img.shields.io/badge/Claude-Desktop-cc785c?style=flat-square&logo=anthropic&logoColor=white" alt="Claude Desktop">
    <img src="https://img.shields.io/badge/Claude-Code-cc785c?style=flat-square&logo=anthropic&logoColor=white" alt="Claude Code">
  </p>
</p>

> [English version below](#english-version) · [גרסה עברית למעלה](#)

---

## מה זה עושה

עורכים חוזים, מסמכים משפטיים, או דוחות הכוללים שמות חברות ישראליות? IsraCorp MCP מאפשר לקלוד לאמת ולהשלים פרטי רישום — שם רשמי, ח.פ., כתובת, סטטוס — ישירות מרשם החברות הישראלי, מבלי לצאת מהשיחה.

**כל העיבוד מתבצע על המחשב שלכם. אין טלמטריה, אין שרת צד שלישי, אין שמירת נתונים.**

---

## איך זה עובד

השרת רץ **מקומית על המחשב שלכם** ומדמה את פעולת החיפוש של אתר רשם החברות (`ica.justice.gov.il`) — בדיוק כפי שהייתם מבצעים חיפוש ידני באתר, אך באופן אוטומטי. קלוד מזהה שמות חברות ו/או מספרי ח.פ. בטקסט שסופק, ושרת MCP שולח את אותה בקשת חיפוש שהדפדפן היה שולח ומחלץ את התוצאות.

אם ה-API הפנימי של האתר אינו זמין, השרת עובר אוטומטית למצב גיבוי — פותח את עמוד החיפוש באתר ברקע וגורד את תוצאותיו ישירות מה-HTML.

פרטי הרישום המלאים מוחזרים לקלוד ומוכנסים לתשובה במקום הנכון. בקבצי `.docx` — פרטים חסרים מוכנסים כשינויים עם מעקב; אי-התאמות ושגיאות מקבלות הערות בלון.

---

## מה כלול

|                                                                                                                       |                             |     |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------- | --- |
| מחבר את קלוד לרשם החברות הישראלי ומאפשר לו לבצע חיפושים לפי שם חברה או מספר ח.פ.                                      | **שרת MCP**                 | 🔌  |
| הדביקו טקסט מחוזה, PDF או כל מסמך אחר וקלוד ימצא וישלים את פרטי כל החברות הישראליות הנזכרות בו.                       | **אימות וחיפוש בצ'ט**       | 💬  |
| הפנו קלוד לקובץ `.docx` והוא יכניס את פרטי הרישום החסרים ישירות למסמך עם מעקב שינויים, ויוסיף הערות לחברות שלא נמצאו. | **אימות וחיפוש בקובץ Word** | 📄  |

---

## התקנה

### שרת MCP - Claude Desktop

1. הורידו את [isracorp-mcp.mcpb](https://github.com/ShaiShulman/isracorp-mcp/releases/latest/download/isracorp-mcp.mcpb)
2. פתחו **Settings > Extensions** ב-Claude Desktop
3. גררו את הקובץ לקלוד ואשרו את ההתקנה

הכלים `search_company` ו-`get_company` יהיו זמינים מיד.

### סקילים — Claude Desktop (אופציונלי)

הסקילים עוזרים לקלוד להשתמש בשרת ה-MCP כאשר עורכים קבצים קיימים.

1. הורידו את הסקילים:
   - [validate-companies.zip](https://github.com/ShaiShulman/isracorp-mcp/releases/latest/download/validate-companies.zip)
   - [validate-companies-docx.zip](https://github.com/ShaiShulman/isracorp-mcp/releases/latest/download/validate-companies-docx.zip)
2. פתחו **Customize > Skills** ב-Claude Desktop
3. לכל סקיל: לחצו על לחצן ה-**+** ואז על **Create skill > Upload a skill** ובחרו את הקובץ

---

## כלי MCP

| כלי              | קלט              | תיאור                                                                                |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `search_company` | `name: string`   | חיפוש לפי שם חברה (עברית או אנגלית). מחזיר עד 10 תוצאות עם מספר רישום, סטטוס וכתובת. |
| `get_company`    | `number: string` | חיפוש לפי מספר רישום בן 9 ספרות (ח.פ. / ח.צ.), בפורמט רצוף או עם מקפים.              |

**שדות מוחזרים:** `companyNumber`, `hebrewName`, `englishName`, `status`, `companyType`, `limitType`, `registrationDate`, `address`, `city`, `violationStatus`

---

## סקילים

**`validate-companies`** — מאמת אזכורי חברות ישראליות בטקסט שיחה או תוכן שהועתק (PDF, תמונות, טקסט חוזה) ומחזיר ציטוטים משפטיים מלאים.

**`validate-companies-docx`** — מאמת אזכורי חברות בקובץ Word ומוסיף תוצאות ישירות למסמך: פרטים חסרים נכנסים כשינוי עם מעקב, חברות שלא נמצאו או עם אי-התאמה מקבלות הערת בלון.

---

## מחבר

**שי שולמן** · [linkedin.com/in/shai-shulman](https://www.linkedin.com/in/shai-shulman/)

## רשיון

הכלי מופץ תחת [רשיון Apache 2.0](LICENSE).

## דיסקליימר

כלי זה הוא פרויקט קוד פתוח עצמאי ואינו מפותח בשיתוף פעולה עם רשם החברות, רשות התאגידים, או משרד המשפטים, ואינו מאושר על ידם.
המחבר לא ישא בכל אחריות לזמינות ותקינות הכלי, וכן לנזקים שעשויים להגרם מהשימוש בכלי.

---

<h2 id="english-version">🇬🇧 English Version</h2>

<p align="center">
  <strong>Validate Israeli company registration details from the Israeli Companies Registrar — without leaving Claude.</strong>
</p>

---

## What it does

Working on contracts, legal documents, or reports that reference Israeli companies? IsraCorp MCP lets Claude validate and complete registration details — official name, registration number, address, status — directly from the Israeli Companies Registrar, without leaving the conversation.

**All processing runs on your local machine. No telemetry, no third-party server, no data retention.**

---

## How it works

The server runs **locally on your machine** and emulates the search action of the Israeli Companies Registrar website (`ica.justice.gov.il`) — exactly as if you were performing a manual search on the site, but automatically. Claude identifies company names and/or registration numbers in the provided text, and the MCP server sends the same search request a browser would send, then extracts the results.

If the site's internal API is unavailable, the server automatically switches to a fallback mode — it opens the search page in the background and scrapes the results directly from the HTML.

Full registration details are returned to Claude and inserted in the correct place in the response. For `.docx` files — missing details are inserted as tracked changes; discrepancies and not-found companies get comment balloons.

---

## What's included

|     |                                         |                                                                                                                                                                                                  |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🔌  | **MCP Server**                          | Connects Claude to the Israeli Companies Registrar, letting it search by company name or registration number.                                                                                    |
| 💬  | **Validate and search in conversation** | Paste text from a contract, PDF, or any document and Claude will find and complete the registration details for every Israeli company mentioned.                                                 |
| 📄  | **Validate and search in a Word file**  | Point Claude at a `.docx` file and it will insert the missing registration details directly into the document as tracked changes, adding comment balloons for any companies it couldn't resolve. |

---

## Installation

### MCP Server - Claude Desktop

1. Download [isracorp-mcp.mcpb](https://github.com/ShaiShulman/isracorp-mcp/releases/latest/download/isracorp-mcp.mcpb)
2. Open **Settings > Extensions** in Claude Desktop
3. Drag the file onto Claude and confirm the installation

The `search_company` and `get_company` tools are available immediately.

### Skills - Claude Desktop (optional)

Skills help Claude use the MCP server when working with existing documents.

1. Download both skill files:
   - [validate-companies.zip](https://github.com/ShaiShulman/isracorp-mcp/releases/latest/download/validate-companies.zip)
   - [validate-companies-docx.zip](https://github.com/ShaiShulman/isracorp-mcp/releases/latest/download/validate-companies-docx.zip)
2. Open **Customize > Skills** in Claude Desktop
3. For each file: click the **+** button, then **Create skill > Upload a skill** and select the file

---

## MCP Tools

| Tool             | Input            | Description                                                                                                         |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `search_company` | `name: string`   | Search by company name (Hebrew or English). Returns up to 10 matches with registration number, status, and address. |
| `get_company`    | `number: string` | Look up by 9-digit registration number (ח.פ. / ח.צ.), raw or dashed format.                                         |

**Returned fields:** `companyNumber`, `hebrewName`, `englishName`, `status`, `companyType`, `limitType`, `registrationDate`, `address`, `city`, `violationStatus`

---

## Skills

**`validate-companies`** — Validates Israeli company references in conversation text or pasted content (PDFs, images, agreement text) and returns complete legal citations.

**`validate-companies-docx`** — Validates company references in a Word `.docx` file and writes results back: missing details inserted as tracked changes, unresolved companies and discrepancies get comment balloons. Fully Hebrew/RTL-aware.

---

## Development

```bash
git clone https://github.com/ShaiShulman/isracorp-mcp.git
cd isracorp-mcp/mcp-server
npm install
npm run build             # compile TypeScript → dist/
npm run devstart          # watch mode
npm test                  # unit tests (no network)
npm run test:integration  # live ICA API tests
```

---

## Author

**Shai Shulman** · [linkedin.com/in/shai-shulman](https://www.linkedin.com/in/shai-shulman/)

## License

Distributed under the [Apache License 2.0](LICENSE).

## Disclaimer

This project is an independent, open-source tool and is not developed in cooperation with, affiliated with, or endorsed by the Israeli Companies Registrar, the Israeli Companies Authority, or the Israeli Ministry of Justice. The author bears no responsibility for the availability, operations or accuracy of the tool and its output, nor for any damages that may result from its use.
