import { z } from "zod";
import { scan } from "../core/scanner.js";
import { applyRedactions } from "../core/apply.js";
import { piiTypeEnum, strategyEnum } from "./shared.js";

export const redactTextInputShape = {
  text: z.string().min(1).describe("Text to redact"),
  strategy: strategyEnum.default("replace").describe("Default strategy applied to every match"),
  types: z.array(piiTypeEnum).optional().describe("Restrict to these PII types; omit for all"),
  perType: z
    .record(piiTypeEnum, strategyEnum)
    .optional()
    .describe("Per-type strategy override (wins over `strategy`)"),
  minConfidence: z.number().min(0).max(1).default(0.5).describe("Drop matches with confidence below this"),
  hashSalt: z.string().optional().describe("Salt for the `hash` and `fake` strategies (deterministic)"),
};

const InputSchema = z.object(redactTextInputShape);

export function redactTextTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const matches = scan(input.text, { types: input.types, minConfidence: input.minConfidence });
  const redactedText = applyRedactions(input.text, matches, {
    strategy: input.strategy,
    perType: input.perType,
    hashSalt: input.hashSalt,
  });
  return { redactedText, matches };
}
