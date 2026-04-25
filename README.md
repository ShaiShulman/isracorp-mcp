<p align="center">
  <h1 align="center">🏛️ IsraCorp MCP</h1>
  <p align="center">
    <strong>שרת MCP לחיפוש ואימות פרטי רישום חברות ישראליות מרשם החברות הישראלי.</strong>
  </p>
  <p align="center">
  <strong>MCP server for looking up and validating company registration details from the Israeli Companies Registrar.</strong></p>
  <p align="center">
</p>
[License: MIT](https://opensource.org/licenses/MIT)

**עברית**

## מה כלול

| רכיב                                | מטרה                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| **שרת MCP** (קובץ `.mcpb`)          | חושף את מאגר רשם החברות כשני כלי Claude: `search_company` ו-`get_company`             |
| **סקיל: `validate-companies`**      | מאתר ומאמת אזכורי חברות בטקסט שיחה או בתוכן שהועתק                                    |
| **סקיל: `validate-companies-docx`** | מאתר ומאמת אזכורי חברות בקבצי Word מסוג `.docx`; מוסיף הערות ותיקונים עם מעקב שינויים |

---

## התקנה

### שרת MCP — Claude Desktop

1. הורידו את `mcp-server.mcpb` מ[דף הגרסאות](../../releases/latest)
2. פתחו **Settings > Extensions** ב-Claude Desktop
3. גררו את הקובץ `mcp-server.mcpb` לקלוד ואשרו את ההתקנה

הכלים `search_company` ו-`get_company` יהיו זמינים מיד.

### שרת MCP — Claude Code

הוסיפו להגדרות MCP של Claude Code (`.claude/settings.json` בפרויקט שלכם, או בקובץ ההגדרות הגלובלי):

```json
{
  "mcpServers": {
    "isracorp": {
      "command": "node",
      "args": ["C:/Tools/mcp-server.mcpb"]
    }
  }
}
```

### סקילים — Claude Code (אופציונלי)

הסקילים () עוזרים לקלוד להשתמש בשרת ה MCP כאשר עורכים קבצים קיימים

1. הורידו את `skills.zip` מ[דף הגרסאות](../../releases/latest)
2. פתחו **Customize > Skills** ב-Claude Desktop
3. לחצו על לחצן ה"פלוס" ואז על **Create skill > Upload a skill**
4. בחרו את הקובץ שהורדכם

## כלי MCP

| כלי              | קלט              | תיאור                                                                                |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `search_company` | `name: string`   | חיפוש לפי שם חברה (עברית או אנגלית). מחזיר עד 10 תוצאות עם מספר רישום, סטטוס וכתובת. |
| `get_company`    | `number: string` | חיפוש לפי מספר רישום בן 9 ספרות (ח.פ. / ח.צ.), בפורמט רצוף או עם מקפים.              |

**שדות מוחזרים:** `companyNumber`, `hebrewName`, `englishName`, `status`, `companyType`, `limitType`, `registrationDate`, `address`, `city`, `violationStatus`

---

## סקילים

`**validate-companies`\*\* — מאמת אזכורי חברות ישראליות בטקסט שיחה או תוכן שהועתק (PDF, תמונות, טקסט חוזה) ומחזיר ציטוטים משפטיים מלאים.

`**validate-companies-docx**` — מאמת אזכורי חברות בקובץ Word ומוסיף תוצאות ישירות למסמך: פרטים חסרים נכנסים כשינוי עם מעקב, חברות שלא נמצאו או עם אי-התאמה מקבלות הערת בלון.

---

## איך זה עובד

```
סקיל / קריאת כלי ישירה
          │
          ▼
   שרת MCP isracorp
          │
 ┌────────┴────────┐
 ▼                 ▼
ICA JSON API   HTML scraping
(ראשי)         (גיבוי)
          │
          ▼
  רשם החברות הישראלי
  ica.justice.gov.il
```

1. הסקיל מחלץ שמות חברות ו/או מספרי ח.פ. מהקלט.
2. שרת MCP מחפש כל חברה לפי שם או מספר מול רשם החברות.
3. התוצאות מוחזרות עם פרטי הרישום ומוכנסות לתשובה במקום הנכון.
4. לקבצי `.docx`, פרטים חסרים מוכנסים כשינויים עם מעקב; אי-התאמות ושגיאות מקבלות הערות בלון.

---

## מחבר

**שי שולמן** · [linkedin.com/in/shai-shulman](https://www.linkedin.com/in/shai-shulman/)

## רשיון

הכלי מופץ תחת רשיון [MIT](https://opensource.org/licenses/MIT)

## דיסקליימר

.כלי זה הוא פרויקט קוד פתוח עצמאי ואינו מפותח בשיתוף פעולה עם רשם החברות, רשות התאגידים, או משרד המשפטים , ואינו מאושר על ידם.
המחבר לא ישא בכל אחריות לזמינות ותקינות הכלי, וכן לנזקים שעשויים להגרם מהשימוש בכלי.

---

**English version**

## What's included

| Component                            | Purpose                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **MCP Server** (`.mcpb` file)        | Exposes the רשם החברות registry as two Claude tools: `search_company` and `get_company`         |
| **Skill: `validate-companies`**      | Looks up and validates company references in conversation text or pasted document content       |
| **Skill: `validate-companies-docx`** | Looks up and validates company references in Word `.docx` files; annotates with tracked changes |

---

## Installation

### MCP Server — Claude Desktop

1. Download `mcp-server.mcpb` from the [Releases page](../../releases/latest)
2. Open **Settings > Extensions** in Claude Desktop
3. Drag the `mcp-server.mcpb` file onto Claude and confirm the installation

The `search_company` and `get_company` tools are available immediately.

### MCP Server — Claude Code

Add to your Claude Code MCP settings (`.claude/settings.json` in your project, or the global settings file):

```json
{
  "mcpServers": {
    "isracorp": {
      "command": "node",
      "args": ["C:/Tools/mcp-server.mcpb"]
    }
  }
}
```

### Skills (optional)

Skills help Claude use the MCP server when working with existing documents.

1. Download `skills.zip` from the [Releases page](../../releases/latest)
2. Open **Customize > Skills** in Claude Desktop
3. Click the **+** button, then **Create skill > Upload a skill**
4. Select the downloaded file

---

## MCP Tools

| Tool             | Input            | Description                                                                                                         |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `search_company` | `name: string`   | Search by company name (Hebrew or English). Returns up to 10 matches with registration number, status, and address. |
| `get_company`    | `number: string` | Look up by 9-digit registration number (ח.פ. / ח.צ.), raw or dashed format.                                         |

**Returned fields:** `companyNumber`, `hebrewName`, `englishName`, `status`, `companyType`, `limitType`, `registrationDate`, `address`, `city`, `violationStatus`

---

## Skills

`**validate-companies`\*\* — Validates Israeli company references in conversation text or pasted content (PDFs, images, agreement text) and returns complete legal citations.

`**validate-companies-docx**` — Validates company references in a Word `.docx` file and writes results back: missing details inserted as tracked changes, unresolved companies and discrepancies get comment balloons. Fully Hebrew/RTL-aware.

---

## How it works

```
Skill / direct tool call
          │
          ▼
   isracorp MCP Server
          │
 ┌────────┴────────┐
 ▼                 ▼
ICA JSON API   HTML scraper
(primary)      (fallback)
          │
          ▼
 Israeli Companies Registrar
     ica.justice.gov.il
```

1. The skill extracts company names and/or registration numbers from the input.
2. The MCP server looks up each company by name (`search_company`) or number (`get_company`).
3. Results are returned with full registration details and the correct information is inserted into the response in the correct place.
4. For `.docx` files, missing details are inserted as tracked changes; discrepancies and not-found companies get comment balloons.

---

## Configuration

The server works out of the box. Behaviour can be tuned via environment variables:

| Variable                 | Default | Description                                                              |
| ------------------------ | ------- | ------------------------------------------------------------------------ |
| `ICA_REQUEST_TIMEOUT_MS` | `10000` | HTTP timeout for ICA API requests (ms)                                   |
| `ICA_MAX_RETRIES`        | `2`     | Retries before falling back to the HTML scraper                          |
| `ICA_ENCODING`           | `utf8`  | `utf8` or `windows1255` (switch if Hebrew searches return empty results) |

---

## Development

```bash
git clone https://github.com/your-username/isracorp-mcp.git
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

Distributed under the [MIT](https://opensource.org/licenses/MIT) license.

## Disclaimer

This project is an independent, open-source tool and is not developed in cooperation with, affiliated with, or endorsed by the Israeli Companies Registrar, the Israeli Companies Authority, or the Israeli Ministry of Justice. The author bears no responsibility for the availability, operations or accuracy of the tool and its output, nor for any damages that may result from its use.
