import type { Detector, Match } from "../core/types.js";

const STREET_TYPES =
  "(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Plaza|Plz|Terrace|Ter|Place|Pl|Way|Parkway|Pkwy|Highway|Hwy)";
// e.g. "1600 Pennsylvania Avenue NW" or "221B Baker Street"
const RE = new RegExp(
  String.raw`\b\d{1,6}[A-Z]?\s+(?:[A-Z][a-zA-Z'.\-]+\s+){1,4}` + STREET_TYPES + String.raw`\b(?:\s+(?:N|S|E|W|NE|NW|SE|SW))?`,
  "g"
);

export const addressDetector: Detector = {
  type: "address",
  confidence: 0.75,
  token: "ADDRESS",
  detect(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const start = m.index ?? 0;
      matches.push({
        type: "address",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.75,
        token: "ADDRESS",
      });
    }
    return matches;
  },
};
