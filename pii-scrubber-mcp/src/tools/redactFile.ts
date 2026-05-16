import { z } from "zod";
import { readFile } from "node:fs/promises";
import { scan } from "../core/scanner.js";
import { applyRedactions } from "../core/apply.js";
import { extractPdfText } from "../parsers/pdf.js";
import { extractDocxText } from "../parsers/docx.js";
import { normalizeText } from "../parsers/text.js";
import { piiTypeEnum, strategyEnum } from "./shared.js";

export const redactFileInputShape = {
  source: z.enum(["path", "base64"]).describe("Where the file comes from"),
  value: z.string().min(1).describe("Filesystem path or base64-encoded bytes"),
  format: z.enum(["pdf", "docx", "text", "auto"]).default("auto"),
  strategy: strategyEnum.default("replace"),
  types: z.array(piiTypeEnum).optional(),
  perType: z.record(piiTypeEnum, strategyEnum).optional(),
  minConfidence: z.number().min(0).max(1).default(0.5),
  hashSalt: z.string().optional(),
};

const InputSchema = z.object(redactFileInputShape);

export async function redactFileTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const text = await loadText(input);
  const matches = scan(text, { types: input.types, minConfidence: input.minConfidence });
  const redactedText = applyRedactions(text, matches, {
    strategy: input.strategy,
    perType: input.perType,
    hashSalt: input.hashSalt,
  });
  return { redactedText, matches, originalLength: text.length };
}

async function loadText(input: z.infer<typeof InputSchema>): Promise<string> {
  let buffer: Buffer;
  let format = input.format;
  if (input.source === "path") {
    buffer = await readFile(input.value);
    if (format === "auto") format = detectFromPath(input.value);
  } else {
    buffer = Buffer.from(input.value, "base64");
    if (format === "auto") format = detectFromBuffer(buffer);
  }
  if (format === "pdf") return extractPdfText(buffer);
  if (format === "docx") return extractDocxText(buffer);
  return normalizeText(buffer.toString("utf8"));
}

function detectFromPath(p: string): "pdf" | "docx" | "text" {
  const lower = p.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  return "text";
}

function detectFromBuffer(buf: Buffer): "pdf" | "docx" | "text" {
  if (buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF") return "pdf";
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b) return "docx";
  return "text";
}
