import * as dotenv from "dotenv";
import * as path from "path";

//*
// This is the main access point for the MCP server for the Israeli Companies Registrar (ICA)
// It exposes two tools: search_company and get_company
// The search_company tool searches the ICA by partial or full company name (Hebrew or English)
// The get_company tool looks up a company by its 9-digit registration number (ח.פ.)
//*

// Load .env from mcp-server directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  searchCompanySchema,
  handleSearchCompany,
} from "./tools/searchCompany";
import { getCompanySchema, handleGetCompany } from "./tools/getCompany";
import { ApiError } from "./const/ApiError";

const server = new McpServer({
  name: "isracorp",
  version: "1.0.0",
});

server.tool(
  "search_company",
  "Search the Israeli Companies Registrar (ICA) by partial or full company name (Hebrew or English). Returns up to 10 matching companies, each with Hebrew name, English name (if registered), registration number, address, and status.",
  searchCompanySchema.shape,
  async (input) => {
    try {
      const result = await handleSearchCompany(input as { name: string });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `Error (${err.statusCode}): ${err.message}`
          : `Unexpected error: ${(err as Error).message}`;
      return {
        content: [{ type: "text", text: msg }],
        isError: true,
      };
    }
  },
);

server.tool(
  "get_company",
  "Look up a specific Israeli company by its 9-digit registration number (ח.פ.). Returns full company details including name (Hebrew and English), address, status, and registration date.",
  getCompanySchema.shape,
  async (input) => {
    try {
      const result = await handleGetCompany(input as { number: string });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `Error (${err.statusCode}): ${err.message}`
          : `Unexpected error: ${(err as Error).message}`;
      return {
        content: [{ type: "text", text: msg }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Note: don't console.log here — stdout is reserved for MCP JSON-RPC
  console.error("[isracorp-mcp] Server started");
}

main().catch((err) => {
  console.error("[isracorp-mcp] Fatal error:", err);
  process.exit(1);
});
