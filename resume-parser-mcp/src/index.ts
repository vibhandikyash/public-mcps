import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { logError } from "./utils/log.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  logError("[resume-parser-mcp] fatal:", err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
