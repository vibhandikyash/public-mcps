import { z } from "zod";
import { scan } from "../core/scanner.js";
import { piiTypeEnum } from "./shared.js";

export const scanTextInputShape = {
  text: z.string().min(1).describe("Text to scan for PII"),
  types: z.array(piiTypeEnum).optional().describe("Restrict to these PII types; omit for all"),
  minConfidence: z.number().min(0).max(1).default(0.5).describe("Drop matches with confidence below this"),
};

const InputSchema = z.object(scanTextInputShape);

export function scanTextTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const matches = scan(input.text, { types: input.types, minConfidence: input.minConfidence });
  return {
    matches,
    summary: summarise(matches),
  };
}

function summarise(matches: { type: string }[]) {
  const counts: Record<string, number> = {};
  for (const m of matches) counts[m.type] = (counts[m.type] ?? 0) + 1;
  return { total: matches.length, byType: counts };
}
