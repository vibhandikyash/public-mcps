import type { Detector, Match } from "../core/types.js";

const V4_RE = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
// IPv6 — broad but bounded; accepts compressed (::) and full forms with 2+ groups.
const V6_RE = /\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b|::(?:[0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4}\b|\b(?:[0-9A-Fa-f]{1,4}:){1,7}:/g;

export const ipv4Detector: Detector = {
  type: "ipv4",
  confidence: 0.95,
  token: "IPV4",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(V4_RE)) {
      const start = m.index ?? 0;
      out.push({
        type: "ipv4",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.95,
        token: "IPV4",
      });
    }
    return out;
  },
};

export const ipv6Detector: Detector = {
  type: "ipv6",
  confidence: 0.9,
  token: "IPV6",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(V6_RE)) {
      const value = m[0];
      if (value.length < 3) continue;
      const start = m.index ?? 0;
      out.push({
        type: "ipv6",
        value,
        start,
        end: start + value.length,
        confidence: 0.9,
        token: "IPV6",
      });
    }
    return out;
  },
};
