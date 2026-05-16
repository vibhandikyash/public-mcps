import type { Detector, Match } from "../core/types.js";

const RE = /\b(?:[0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}\b/g;

export const macDetector: Detector = {
  type: "mac_address",
  confidence: 0.97,
  token: "MAC",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const start = m.index ?? 0;
      out.push({
        type: "mac_address",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.97,
        token: "MAC",
      });
    }
    return out;
  },
};
