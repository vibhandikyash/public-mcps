import type { PiiType } from "../core/types.js";

export type PolicyName = "hipaa" | "gdpr" | "pci" | "strict" | "safe-share";

export interface Policy {
  name: PolicyName;
  description: string;
  /** Types that MUST be absent. Their presence is a violation. */
  forbid: PiiType[];
}

export const POLICIES: Record<PolicyName, Policy> = {
  hipaa: {
    name: "hipaa",
    description:
      "HIPAA Safe Harbor — flags identifiers commonly classified as Protected Health Information (PHI).",
    forbid: ["email", "phone", "ssn", "address", "dob", "credit_card", "ipv4", "ipv6", "mac_address"],
  },
  gdpr: {
    name: "gdpr",
    description:
      "GDPR personal data — direct identifiers and online identifiers that fall under Article 4.",
    forbid: ["email", "phone", "address", "ipv4", "ipv6", "mac_address", "dob", "iban"],
  },
  pci: {
    name: "pci",
    description:
      "PCI-DSS — cardholder data must not appear in shared documents (Luhn-validated).",
    forbid: ["credit_card"],
  },
  strict: {
    name: "strict",
    description: "Every detector enabled — any match is a violation.",
    forbid: [
      "email",
      "phone",
      "credit_card",
      "ssn",
      "iban",
      "ipv4",
      "ipv6",
      "aws_access_key",
      "github_token",
      "openai_key",
      "generic_secret",
      "jwt",
      "private_key",
      "address",
      "dob",
      "mac_address",
    ],
  },
  "safe-share": {
    name: "safe-share",
    description:
      "Minimal preset for sharing docs externally — contact info plus payment data must be absent.",
    forbid: ["email", "phone", "address", "credit_card", "iban", "ssn"],
  },
};

export function policyOrThrow(name: string): Policy {
  const p = (POLICIES as Record<string, Policy | undefined>)[name];
  if (!p) {
    throw new Error(`Unknown policy: ${name}. Valid policies: ${Object.keys(POLICIES).join(", ")}`);
  }
  return p;
}
