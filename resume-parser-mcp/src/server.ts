import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parseResumeTool, parseResumeInputShape } from "./tools/parseResume.js";
import { extractKeywordsTool, extractKeywordsInputShape } from "./tools/extractKeywords.js";
import { scoreAgainstJobTool, scoreAgainstJobInputShape } from "./tools/scoreAgainstJob.js";
import { summarizeResumeTool, summarizeResumeInputShape } from "./tools/summarizeResume.js";
import { logError } from "./utils/log.js";

export const SERVER_NAME = "resume-parser-mcp";
export const SERVER_VERSION = "0.1.0";

export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "parse_resume",
    {
      title: "Parse Resume",
      description:
        "Parse a PDF, DOCX or plain-text resume into structured JSON: contact info, summary, skills, experience, education, projects, certifications. Provide the file via path, base64, or raw text.",
      inputSchema: parseResumeInputShape,
    },
    async (args) => {
      try {
        const result = await parseResumeTool(args as any);
        return jsonResponse(result);
      } catch (err) {
        return errorResponse(err);
      }
    }
  );

  server.registerTool(
    "extract_keywords",
    {
      title: "Extract Keywords",
      description:
        "Extract technical skills, tools, and high-signal generic keywords from a chunk of text (resume or job description).",
      inputSchema: extractKeywordsInputShape,
    },
    async (args) => {
      try {
        const result = extractKeywordsTool(args as any);
        return jsonResponse(result);
      } catch (err) {
        return errorResponse(err);
      }
    }
  );

  server.registerTool(
    "score_against_job",
    {
      title: "Score Resume Against Job",
      description:
        "Score a resume against a job description by matching extracted skills. Returns a 0-100 score, matched skills, missing skills, bonus skills, and a short rationale.",
      inputSchema: scoreAgainstJobInputShape,
    },
    async (args) => {
      try {
        const result = scoreAgainstJobTool(args as any);
        return jsonResponse(result);
      } catch (err) {
        return errorResponse(err);
      }
    }
  );

  server.registerTool(
    "summarize_resume",
    {
      title: "Summarize Resume",
      description:
        "Produce a short candidate summary (headline, years of experience, top stack, education) from resume text.",
      inputSchema: summarizeResumeInputShape,
    },
    async (args) => {
      try {
        const result = summarizeResumeTool(args as any);
        return jsonResponse(result);
      } catch (err) {
        return errorResponse(err);
      }
    }
  );

  return server;
}

function jsonResponse(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  logError("[resume-parser-mcp] tool error:", message);
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Error: ${message}` }],
  };
}
