import type { Match } from "../core/types.js";

/**
 * Mask preserves visible structure but blanks out characters:
 *   "alice.doe@example.com" → "a***********@example.com"
 *   "4111 1111 1111 1111"   → "4************1111"
 *   "+91 98765 43210"        → "+91*********10"
 * Type-specific rules keep the result recognisable when that matters.
 */
export function maskValue(m: Match): string {
  switch (m.type) {
    case "email":
      return maskEmail(m.value);
    case "credit_card":
      return maskKeepTail(m.value, 4);
    case "iban":
      return maskKeepEdges(m.value, 4, 2);
    case "phone":
      return maskKeepEdges(m.value, 2, 2);
    default:
      return maskKeepEdges(m.value, 1, 1);
  }
}

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at <= 0) return maskKeepEdges(value, 1, 1);
  const local = value.slice(0, at);
  const domain = value.slice(at);
  const masked = local[0] + "*".repeat(Math.max(1, local.length - 1));
  return masked + domain;
}

function maskKeepTail(value: string, tail: number): string {
  if (value.length <= tail) return "*".repeat(value.length);
  const head = value.slice(0, value.length - tail);
  return maskChars(head, head.length) + value.slice(value.length - tail);
}

function maskKeepEdges(value: string, head: number, tail: number): string {
  if (value.length <= head + tail) return "*".repeat(value.length);
  const mid = value.slice(head, value.length - tail);
  return value.slice(0, head) + maskChars(mid, mid.length) + value.slice(value.length - tail);
}

function maskChars(s: string, total: number): string {
  // Preserve non-alphanumeric punctuation so structure stays readable.
  let out = "";
  let masked = 0;
  for (const ch of s) {
    if (masked < total && /[A-Za-z0-9]/.test(ch)) {
      out += "*";
      masked++;
    } else {
      out += ch;
    }
  }
  return out;
}
