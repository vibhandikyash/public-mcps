import { describe, it, expect } from "vitest";
import { scan } from "../src/core/scanner.js";
import { applyRedactions } from "../src/core/apply.js";

const TEXT = "Email alice@example.com, card 4242 4242 4242 4242, IP 10.0.0.1.";

describe("strategy: replace", () => {
  it("substitutes type tokens", () => {
    const m = scan(TEXT);
    const out = applyRedactions(TEXT, m, { strategy: "replace" });
    expect(out).toContain("[EMAIL]");
    expect(out).toContain("[CREDIT_CARD]");
    expect(out).toContain("[IPV4]");
    expect(out).not.toContain("alice@example.com");
    expect(out).not.toContain("4242 4242 4242 4242");
  });
});

describe("strategy: mask", () => {
  it("preserves email shape and credit card last 4", () => {
    const m = scan(TEXT);
    const out = applyRedactions(TEXT, m, { strategy: "mask" });
    expect(out).toMatch(/a\*+@example\.com/);
    // Credit card mask keeps the last 4 ("4242") and masks the rest, preserving the spaces.
    expect(out).toMatch(/\*{4} \*{4} \*{4} 4242/);
    // No raw card digits should survive in the masked output.
    expect(out).not.toContain("4242 4242 4242 4242");
  });
});

describe("strategy: hash", () => {
  it("is deterministic for same input + salt", () => {
    const m = scan(TEXT);
    const a = applyRedactions(TEXT, m, { strategy: "hash", hashSalt: "s1" });
    const b = applyRedactions(TEXT, m, { strategy: "hash", hashSalt: "s1" });
    expect(a).toBe(b);
  });

  it("differs when salt differs", () => {
    const m = scan(TEXT);
    const a = applyRedactions(TEXT, m, { strategy: "hash", hashSalt: "s1" });
    const b = applyRedactions(TEXT, m, { strategy: "hash", hashSalt: "s2" });
    expect(a).not.toBe(b);
  });
});

describe("strategy: fake", () => {
  it("produces deterministic synthetic values that pass shape checks", () => {
    const m = scan(TEXT);
    const a = applyRedactions(TEXT, m, { strategy: "fake" });
    const b = applyRedactions(TEXT, m, { strategy: "fake" });
    expect(a).toBe(b);
    expect(a).toMatch(/@example\.(com|org|net)|test\.invalid/);
  });
});

describe("strategy: remove", () => {
  it("drops the matched span", () => {
    const m = scan(TEXT);
    const out = applyRedactions(TEXT, m, { strategy: "remove" });
    expect(out).not.toContain("alice@example.com");
    expect(out).not.toContain("4242 4242 4242 4242");
  });
});

describe("perType strategy overrides", () => {
  it("mixes strategies per detector type", () => {
    const m = scan(TEXT);
    const out = applyRedactions(TEXT, m, {
      strategy: "replace",
      perType: { email: "hash", credit_card: "mask" },
    });
    expect(out).toMatch(/\[EMAIL:[0-9a-f]+\]/);
    expect(out).toMatch(/\*{4} \*{4} \*{4} 4242/);
    expect(out).toContain("[IPV4]");
  });
});
