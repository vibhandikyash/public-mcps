import { normalizeText } from "./text.js";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const mod: any = await import("pdf-parse");
  const pdfParse = mod.default ?? mod;
  const data = await pdfParse(buffer);
  return normalizeText(String(data.text ?? ""));
}
