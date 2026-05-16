import type { Detector, Match } from "../core/types.js";

const RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g;

export const emailDetector: Detector = {
  type: "email",
  confidence: 0.98,
  token: "EMAIL",
  detect(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const value = m[0];
      const start = m.index ?? 0;
      matches.push({
        type: "email",
        value,
        start,
        end: start + value.length,
        confidence: 0.98,
        token: "EMAIL",
      });
    }
    return matches;
  },
};
