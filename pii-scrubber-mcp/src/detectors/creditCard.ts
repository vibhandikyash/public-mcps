import type { Detector, Match } from "../core/types.js";

// 13-19 digits, optionally separated by spaces or hyphens.
const RE = /(?:\d[ -]?){12,18}\d/g;

export function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return digits.length >= 13 && digits.length <= 19 && sum % 10 === 0;
}

export const creditCardDetector: Detector = {
  type: "credit_card",
  confidence: 0.99,
  token: "CREDIT_CARD",
  detect(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const value = m[0];
      const digits = value.replace(/\D/g, "");
      if (!luhn(digits)) continue;
      const start = m.index ?? 0;
      matches.push({
        type: "credit_card",
        value,
        start,
        end: start + value.length,
        confidence: 0.99,
        token: "CREDIT_CARD",
      });
    }
    return matches;
  },
};
