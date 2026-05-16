import type { Detector, Match } from "../core/types.js";

// US SSN: AAA-GG-SSSS — excludes obvious invalids (area 000, 666, 9xx; group 00; serial 0000).
const RE = /\b(?!000|666|9\d\d)(\d{3})[-\s](?!00)(\d{2})[-\s](?!0000)(\d{4})\b/g;

export const ssnDetector: Detector = {
  type: "ssn",
  confidence: 0.92,
  token: "SSN",
  detect(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const value = m[0];
      const start = m.index ?? 0;
      matches.push({
        type: "ssn",
        value,
        start,
        end: start + value.length,
        confidence: 0.92,
        token: "SSN",
      });
    }
    return matches;
  },
};
