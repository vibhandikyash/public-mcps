import type { Detector, Match } from "../core/types.js";

// Permissive phone matcher: optional country code, then 7+ digits with common separators.
const RE = /\+?\d[\d\s.\-()]{6,18}\d/g;

export const phoneDetector: Detector = {
  type: "phone",
  confidence: 0.7,
  token: "PHONE",
  detect(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const value = m[0];
      const digits = value.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) continue;
      const start = m.index ?? 0;
      const confidence = digits.length >= 10 ? 0.85 : 0.6;
      matches.push({
        type: "phone",
        value,
        start,
        end: start + value.length,
        confidence,
        token: "PHONE",
      });
    }
    return matches;
  },
};
