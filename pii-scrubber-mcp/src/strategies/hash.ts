import { createHash } from "node:crypto";
import type { Match } from "../core/types.js";

/**
 * Deterministic SHA-256 with optional salt. Same input + same salt → same hash,
 * so downstream pipelines can join across redacted documents without seeing PII.
 */
export function hashValue(m: Match, salt = ""): string {
  const digest = createHash("sha256").update(salt + m.value).digest("hex").slice(0, 16);
  return `[${m.token}:${digest}]`;
}
