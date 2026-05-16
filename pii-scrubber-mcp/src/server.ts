import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { scanTextTool, scanTextInputShape } from "./tools/scanText.js";
import { redactTextTool, redactTextInputShape } from "./tools/redactText.js";
import { redactFileTool, redactFileInputShape } from "./tools/redactFile.js";
import { policyCheckTool, policyCheckInputShape } from "./tools/policyCheck.js";
import { listDetectorsTool, listDetectorsInputShape } from "./tools/listDetectors.js";
import { logError } from "./utils/log.js";

export const SERVER_NAME = "pii-scrubber-mcp";
export const SERVER_VERSION = "0.1.0";

export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "scan_text",
    {
      title: "Scan Text for PII",
      description:
        "Detect PII in a string. Returns every match with type, value, character offsets, confidence, and a display token. Filter with `types` and `minConfidence`.",
      inputSchema: scanTextInputShape,
    },
    async (args) => safe(() => scanTextTool(args as any))
  );

  server.registerTool(
    "redact_text",
    {
      title: "Redact PII in Text",
      description:
        "Detect and redact PII in a string under a chosen strategy (mask / replace / hash / fake / remove). Use `perType` to mix strategies (e.g. hash emails but replace phones).",
      inputSchema: redactTextInputShape,
    },
    async (args) => safe(() => redactTextTool(args as any))
  );

  server.registerTool(
    "redact_file",
    {
      title: "Redact PII in a File",
      description:
        "Extract text from a PDF, DOCX or plain-text file (via path or base64) and return the redacted text plus the matches that were redacted.",
      inputSchema: redactFileInputShape,
    },
    async (args) => safe(() => redactFileTool(args as any))
  );

  server.registerTool(
    "policy_check",
    {
      title: "Check Against a Compliance Policy",
      description:
        "Evaluate text against a compliance preset (HIPAA / GDPR / PCI / strict / safe-share). Returns pass/fail, every violation, and a remediation hint.",
      inputSchema: policyCheckInputShape,
    },
    async (args) => safe(() => policyCheckTool(args as any))
  );

  server.registerTool(
    "list_detectors",
    {
      title: "List Detectors, Strategies, and Policies",
      description:
        "Introspection — returns every PII detector, the available redaction strategies, and the bundled policy presets.",
      inputSchema: listDetectorsInputShape,
    },
    async () => safe(() => listDetectorsTool())
  );

  return server;
}

async function safe<T>(fn: () => Promise<T> | T) {
  try {
    const value = await fn();
    return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("[pii-scrubber-mcp] tool error:", message);
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Error: ${message}` }],
    };
  }
}
