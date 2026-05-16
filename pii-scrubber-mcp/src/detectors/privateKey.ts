import type { Detector, Match } from "../core/types.js";

const RE = /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g;

export const privateKeyDetector: Detector = {
  type: "private_key",
  confidence: 1,
  token: "PRIVATE_KEY",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(RE)) {
      const start = m.index ?? 0;
      out.push({
        type: "private_key",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 1,
        token: "PRIVATE_KEY",
      });
    }
    return out;
  },
};
