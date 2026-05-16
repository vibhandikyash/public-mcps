import type { Detector, Match } from "../core/types.js";

const AWS_RE = /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g;
const GITHUB_RE = /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g;
const OPENAI_RE = /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g;
// Generic high-entropy: 32+ chars of base64-ish.
const GENERIC_RE = /(?<![A-Za-z0-9])[A-Za-z0-9+/_-]{32,}(?![A-Za-z0-9])/g;

function shannon(s: string): number {
  const counts = new Map<string, number>();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const len = s.length;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / len;
    h -= p * Math.log2(p);
  }
  return h;
}

export const awsKeyDetector: Detector = {
  type: "aws_access_key",
  confidence: 0.99,
  token: "AWS_ACCESS_KEY",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(AWS_RE)) {
      const start = m.index ?? 0;
      out.push({
        type: "aws_access_key",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.99,
        token: "AWS_ACCESS_KEY",
      });
    }
    return out;
  },
};

export const githubTokenDetector: Detector = {
  type: "github_token",
  confidence: 0.99,
  token: "GITHUB_TOKEN",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(GITHUB_RE)) {
      const start = m.index ?? 0;
      out.push({
        type: "github_token",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.99,
        token: "GITHUB_TOKEN",
      });
    }
    return out;
  },
};

export const openaiKeyDetector: Detector = {
  type: "openai_key",
  confidence: 0.99,
  token: "OPENAI_KEY",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(OPENAI_RE)) {
      const start = m.index ?? 0;
      out.push({
        type: "openai_key",
        value: m[0],
        start,
        end: start + m[0].length,
        confidence: 0.99,
        token: "OPENAI_KEY",
      });
    }
    return out;
  },
};

export const genericSecretDetector: Detector = {
  type: "generic_secret",
  confidence: 0.4,
  token: "SECRET",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(GENERIC_RE)) {
      const value = m[0];
      // Entropy gate to avoid flagging plain hex hashes / IDs that aren't secrets.
      const h = shannon(value);
      if (h < 3.5) continue;
      const start = m.index ?? 0;
      // Confidence rises with entropy.
      const confidence = Math.min(0.9, 0.4 + (h - 3.5) * 0.2);
      out.push({
        type: "generic_secret",
        value,
        start,
        end: start + value.length,
        confidence,
        token: "SECRET",
      });
    }
    return out;
  },
};
