import { describe, it, expect } from "vitest";
import { scan } from "../src/core/scanner.js";

describe("scan", () => {
  it("returns every detector's matches when types is omitted", () => {
    const text = "Email alice@example.com, card 4242 4242 4242 4242, IP 10.0.0.1.";
    const matches = scan(text);
    const types = new Set(matches.map((m) => m.type));
    expect(types.has("email")).toBe(true);
    expect(types.has("credit_card")).toBe(true);
    expect(types.has("ipv4")).toBe(true);
  });

  it("filters by `types`", () => {
    const text = "Email alice@example.com and card 4242 4242 4242 4242.";
    const matches = scan(text, { types: ["email"] });
    expect(matches.every((m) => m.type === "email")).toBe(true);
  });

  it("applies minConfidence filter", () => {
    const text = "Generic high-entropy chunk: " + "Ab3Ks9PqXr7TmZjLn5Wd2Vc8Eg4Hf1Bv6Yu0Qx9";
    const lowBar = scan(text, { minConfidence: 0.1 });
    const highBar = scan(text, { minConfidence: 0.99 });
    expect(lowBar.length).toBeGreaterThanOrEqual(highBar.length);
  });

  it("dedupes overlapping spans, preferring higher confidence / longer matches", () => {
    // OpenAI key would also match the generic_secret detector, but openai_key is more specific.
    const text = "k=sk-proj-abcdefghijklmnopqrstuvwxyz0123456789";
    const matches = scan(text);
    expect(matches.filter((m) => m.start < text.length && m.end > 2).length).toBe(1);
    expect(matches[0].type).toBe("openai_key");
  });

  it("returns matches sorted by start offset", () => {
    const text = "first alice@example.com middle 192.168.0.1 last 4242 4242 4242 4242";
    const matches = scan(text);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i].start).toBeGreaterThanOrEqual(matches[i - 1].start);
    }
  });
});
