export type PiiType =
  | "email"
  | "phone"
  | "credit_card"
  | "ssn"
  | "iban"
  | "ipv4"
  | "ipv6"
  | "aws_access_key"
  | "github_token"
  | "openai_key"
  | "generic_secret"
  | "jwt"
  | "private_key"
  | "address"
  | "dob"
  | "mac_address";

export interface Match {
  type: PiiType;
  value: string;
  start: number;
  end: number;
  confidence: number; // 0..1
  /** Detector-supplied display token for redaction (e.g. "EMAIL", "AWS_KEY"). */
  token: string;
}

export interface Detector {
  type: PiiType;
  /** Default confidence (0..1) for matches this detector emits. */
  confidence: number;
  /** Display token used by `replace` / `fake` strategies. */
  token: string;
  detect(text: string): Match[];
}

export type RedactionStrategy =
  | "mask"
  | "replace"
  | "hash"
  | "fake"
  | "remove";

export interface ScanOptions {
  /** Restrict scanning to these types. Empty / undefined means all detectors. */
  types?: PiiType[];
  /** Minimum confidence (0..1) for a match to be reported. Default 0.5. */
  minConfidence?: number;
}

export interface RedactOptions extends ScanOptions {
  strategy?: RedactionStrategy;
  /** Salt used by the `hash` strategy. */
  hashSalt?: string;
  /** Per-type strategy overrides (wins over `strategy`). */
  perType?: Partial<Record<PiiType, RedactionStrategy>>;
}

export interface ScanResult {
  text: string;
  matches: Match[];
}

export interface RedactResult {
  redactedText: string;
  matches: Match[];
}
