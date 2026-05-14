import { readFile } from "node:fs/promises";
import { z } from "zod";
import { extractPdfText } from "../parsers/pdf.js";
import { extractDocxText } from "../parsers/docx.js";
import { normalizeText } from "../parsers/text.js";
import { parseResumeText } from "../parsers/resume.js";

export const parseResumeInputShape = {
  source: z.enum(["path", "base64", "text"]).describe("Where the resume comes from"),
  value: z.string().describe("File path, base64-encoded bytes, or plain text"),
  format: z.enum(["pdf", "docx", "text", "auto"]).default("auto").describe("File format; ignored when source is text"),
};

const InputSchema = z.object(parseResumeInputShape);

export async function parseResumeTool(input: z.infer<typeof InputSchema>): Promise<unknown> {
  const text = await loadText(input);
  return parseResumeText(text);
}

async function loadText(input: z.infer<typeof InputSchema>): Promise<string> {
  if (input.source === "text") return normalizeText(input.value);
  let buffer: Buffer;
  let format = input.format;
  if (input.source === "path") {
    buffer = await readFile(input.value);
    if (format === "auto") format = detectFormatFromPath(input.value);
  } else {
    buffer = Buffer.from(input.value, "base64");
    if (format === "auto") format = detectFormatFromBuffer(buffer);
  }
  if (format === "pdf") return extractPdfText(buffer);
  if (format === "docx") return extractDocxText(buffer);
  return normalizeText(buffer.toString("utf8"));
}

function detectFormatFromPath(p: string): "pdf" | "docx" | "text" {
  const lower = p.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  return "text";
}

function detectFormatFromBuffer(buf: Buffer): "pdf" | "docx" | "text" {
  if (buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF") return "pdf";
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b) return "docx";
  return "text";
}
