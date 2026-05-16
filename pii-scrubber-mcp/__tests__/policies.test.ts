import { describe, it, expect } from "vitest";
import { policyCheckTool } from "../src/tools/policyCheck.js";

describe("policy_check", () => {
  it("PCI flags any card, ignores other PII", () => {
    const text = "Card 4242 4242 4242 4242 (email alice@example.com).";
    const r = policyCheckTool({ text, policy: "pci" });
    expect(r.pass).toBe(false);
    expect(r.violationsByType.credit_card).toBe(1);
    expect(r.violationsByType.email).toBeUndefined();
  });

  it("HIPAA flags email + phone + DOB together", () => {
    const text = "Patient alice@example.com, +1 415 555 2671, DOB: 1990-02-01.";
    const r = policyCheckTool({ text, policy: "hipaa" });
    expect(r.pass).toBe(false);
    expect(r.violationsByType.email).toBe(1);
    expect(r.violationsByType.dob).toBe(1);
  });

  it("strict passes on a clean string", () => {
    const r = policyCheckTool({ text: "nothing of interest in this sentence", policy: "strict" });
    expect(r.pass).toBe(true);
    expect(r.violationCount).toBe(0);
  });

  it("safe-share blocks contact info", () => {
    const r = policyCheckTool({ text: "Call me on +1 415 555 2671", policy: "safe-share" });
    expect(r.pass).toBe(false);
    expect(r.violationsByType.phone).toBeGreaterThanOrEqual(1);
  });

  it("rejects unknown policy names", () => {
    expect(() => policyCheckTool({ text: "x", policy: "nope" as any })).toThrow();
  });
});
