import type { Detector, Match } from "../core/types.js";

const RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;

export function ibanCheck(raw: string): boolean {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (compact.length < 15 || compact.length > 34) return false;
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  let remainder = 0n;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    let v: number;
    if (code >= 48 && code <= 57) v = code - 48;
    else if (code >= 65 && code <= 90) v = code - 55;
    else return false;
    remainder = (remainder * (v < 10 ? 10n : 100n) + BigInt(v)) % 97n;
  }
  return remainder === 1n;
}

export const ibanDetector: Detector = {
  type: "iban",
  confidence: 0.99,
  token: "IBAN",
  detect(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const value = m[0];
      if (!ibanCheck(value)) continue;
      const start = m.index ?? 0;
      matches.push({
        type: "iban",
        value,
        start,
        end: start + value.length,
        confidence: 0.99,
        token: "IBAN",
      });
    }
    return matches;
  },
};
