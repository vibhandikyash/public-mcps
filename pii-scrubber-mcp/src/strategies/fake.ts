import { createHash } from "node:crypto";
import type { Match, PiiType } from "../core/types.js";

/**
 * Stable, deterministic fake replacements. Same input → same fake (within a salt).
 * No external Faker dependency — small built-in pools per type.
 */
export function fakeValue(m: Match, salt = ""): string {
  const seed = createHash("sha256").update(salt + m.type + m.value).digest();
  const pick = <T>(arr: readonly T[], offset = 0): T =>
    arr[seed[offset % seed.length] % arr.length];

  switch (m.type) {
    case "email": {
      const local = pick(FAKE_FIRSTS).toLowerCase() + "." + pick(FAKE_LASTS, 1).toLowerCase();
      const domain = pick(FAKE_DOMAINS, 2);
      return `${local}@${domain}`;
    }
    case "phone":
      return `+1 555 ${digits(seed, 3, 3)} ${digits(seed, 6, 4)}`;
    case "credit_card":
      return `4111 ${digits(seed, 2, 4)} ${digits(seed, 6, 4)} ${digits(seed, 10, 4)}`;
    case "ssn":
      return `123-45-${digits(seed, 4, 4)}`;
    case "iban":
      return `DE89 ${digits(seed, 2, 4)} ${digits(seed, 6, 4)} ${digits(seed, 10, 4)} ${digits(seed, 14, 4)}`;
    case "ipv4":
      return `${10 + (seed[0] % 200)}.${seed[1] % 256}.${seed[2] % 256}.${seed[3] % 256}`;
    case "ipv6":
      return "2001:db8:" + [4, 6, 8, 10, 12].map((o) => seed.subarray(o, o + 2).toString("hex")).join(":");
    case "aws_access_key":
      return "AKIA" + hex16(seed);
    case "github_token":
      return "ghp_" + base36(seed, 36);
    case "openai_key":
      return "sk-" + base36(seed, 40);
    case "jwt":
      return "eyJhbGciOiJIUzI1NiJ9." + base36(seed, 16) + "." + base36(seed.subarray(8), 16);
    case "private_key":
      return "-----BEGIN PRIVATE KEY-----\n[REDACTED]\n-----END PRIVATE KEY-----";
    case "address":
      return `${100 + (seed[0] % 900)} ${pick(FAKE_STREETS, 3)} ${pick(FAKE_STREET_TYPES, 4)}`;
    case "dob":
      return `DOB: ${1950 + (seed[0] % 60)}-${pad2(1 + (seed[1] % 12))}-${pad2(1 + (seed[2] % 28))}`;
    case "mac_address":
      return [0, 2, 4, 6, 8, 10].map((o) => seed.subarray(o, o + 1).toString("hex")).join(":");
    case "generic_secret":
      return base36(seed, m.value.length);
    default:
      return `[${(m as unknown as { token: string }).token ?? "REDACTED"}]`;
  }
}

function digits(buf: Buffer, offset: number, n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += String(buf[(offset + i) % buf.length] % 10);
  return s;
}
function pad2(n: number): string { return n < 10 ? "0" + n : String(n); }
function hex16(buf: Buffer): string { return buf.subarray(0, 8).toString("hex").toUpperCase(); }
function base36(buf: Buffer, len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += (buf[i % buf.length] % 36).toString(36);
  return s;
}

const FAKE_FIRSTS = ["Alex", "Sam", "Jordan", "Casey", "Riley", "Taylor", "Morgan", "Robin"] as const;
const FAKE_LASTS = ["Stone", "Reed", "Lane", "Park", "Quinn", "Vega", "Holt", "Marsh"] as const;
const FAKE_DOMAINS = ["example.com", "example.org", "example.net", "test.invalid"] as const;
const FAKE_STREETS = ["Maple", "Cedar", "Elm", "Pine", "Birch", "Oak", "Walnut"] as const;
const FAKE_STREET_TYPES = ["Street", "Avenue", "Road", "Lane", "Drive"] as const;

// Suppress unused PiiType import for downstream type-narrowing readers.
void (null as unknown as PiiType);
