import { z } from "zod";
import { describeDetectors } from "../detectors/index.js";
import { POLICIES } from "../policies/presets.js";

export const listDetectorsInputShape = {} as const;
const _InputSchema = z.object(listDetectorsInputShape);

export function listDetectorsTool(_input?: z.input<typeof _InputSchema>) {
  return {
    detectors: describeDetectors(),
    strategies: ["mask", "replace", "hash", "fake", "remove"],
    policies: Object.values(POLICIES).map((p) => ({
      name: p.name,
      description: p.description,
      forbid: p.forbid,
    })),
  };
}
