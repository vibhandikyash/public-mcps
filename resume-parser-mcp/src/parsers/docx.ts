import { normalizeText } from "./text.js";

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const mod: any = await import("mammoth");
  const mammoth = mod.default ?? mod;
  const result = await mammoth.extractRawText({ buffer });
  return normalizeText(String(result.value ?? ""));
}
