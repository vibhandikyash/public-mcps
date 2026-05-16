import type { Detector, Match } from "../core/types.js";

const MONTHS = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
// Patterns:
//   "DOB: 01/02/1990", "Date of birth: 1990-02-01", "born March 4, 1985"
const PREFIX = String.raw`(?:DOB|D\.O\.B\.|Date of [Bb]irth|[Bb]orn(?:\s+on)?)\s*[:\-]?\s*`;
const NUMERIC = String.raw`\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}`;
const ISO = String.raw`\d{4}-\d{2}-\d{2}`;
const VERBOSE = String.raw`${MONTHS}\s+\d{1,2},?\s+\d{4}`;
const RE = new RegExp(`${PREFIX}(?:${NUMERIC}|${ISO}|${VERBOSE})`, "g");

export const dobDetector: Detector = {
  type: "dob",
  confidence: 0.9,
  token: "DOB",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const start = m.index ?? 0;
      out.push({
        type: "dob",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.9,
        token: "DOB",
      });
    }
    return out;
  },
};
