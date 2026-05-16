import { z } from "zod";
import { scan } from "../core/scanner.js";
import { POLICIES, policyOrThrow } from "../policies/presets.js";

export const policyCheckInputShape = {
  text: z.string().min(1).describe("Text to check"),
  policy: z
    .enum(Object.keys(POLICIES) as [keyof typeof POLICIES, ...Array<keyof typeof POLICIES>])
    .describe("Compliance preset to evaluate against"),
  minConfidence: z.number().min(0).max(1).default(0.5),
};

const InputSchema = z.object(policyCheckInputShape);

export function policyCheckTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const policy = policyOrThrow(input.policy);
  const forbidden = new Set(policy.forbid);

  const matches = scan(input.text, { types: policy.forbid, minConfidence: input.minConfidence })
    .filter((m) => forbidden.has(m.type));

  const violationsByType: Record<string, number> = {};
  for (const m of matches) violationsByType[m.type] = (violationsByType[m.type] ?? 0) + 1;

  const pass = matches.length === 0;
  return {
    policy: policy.name,
    description: policy.description,
    pass,
    violationCount: matches.length,
    violationsByType,
    violations: matches,
    recommendation: pass
      ? "Document complies with the selected policy."
      : "Redact the listed matches before sharing this document. Use `redact_text` with the same `policy` types.",
  };
}
