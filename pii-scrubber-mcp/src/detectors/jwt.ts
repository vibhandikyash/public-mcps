import type { Detector, Match } from "../core/types.js";

const RE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

export const jwtDetector: Detector = {
  type: "jwt",
  confidence: 0.98,
  token: "JWT",
  detect(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const start = m.index ?? 0;
      matches.push({
        type: "jwt",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.98,
        token: "JWT",
      });
    }
    return matches;
  },
};
