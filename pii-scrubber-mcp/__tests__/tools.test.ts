import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanTextTool } from "../src/tools/scanText.js";
import { redactTextTool } from "../src/tools/redactText.js";
import { redactFileTool } from "../src/tools/redactFile.js";
import { listDetectorsTool } from "../src/tools/listDetectors.js";

const MIXED = [
  "From: alice.doe@example.com",
  "Phone: +1 (415) 555-2671",
  "Card: 4242 4242 4242 4242",
  "IP: 10.0.0.1",
  "AWS key: AKIAIOSFODNN7EXAMPLE",
  "DOB: 1990-02-01",
  "Address: 1600 Pennsylvania Avenue NW",
].join("\n");

describe("scan_text tool", () => {
  it("returns a summary count per type", () => {
    const r = scanTextTool({ text: MIXED });
    expect(r.summary.total).toBeGreaterThanOrEqual(5);
    expect(r.summary.byType.email).toBeGreaterThanOrEqual(1);
  });

  it("respects `types` filter", () => {
    const r = scanTextTool({ text: MIXED, types: ["email"] });
    expect(r.matches.every((m) => m.type === "email")).toBe(true);
  });
});

describe("redact_text tool", () => {
  it("replaces by default and removes the original values", () => {
    const r = redactTextTool({ text: MIXED });
    expect(r.redactedText).toContain("[EMAIL]");
    expect(r.redactedText).not.toContain("alice.doe@example.com");
    expect(r.redactedText).not.toContain("4242 4242 4242 4242");
  });
});

describe("redact_file tool", () => {
  let dir = "";
  let txtPath = "";
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "pii-scrubber-test-"));
    txtPath = join(dir, "leak.txt");
    await writeFile(txtPath, MIXED);
  });
  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("redacts a text file via path", async () => {
    const r = await redactFileTool({ source: "path", value: txtPath, format: "auto", strategy: "replace" });
    expect(r.redactedText).toContain("[EMAIL]");
    expect(r.matches.length).toBeGreaterThanOrEqual(5);
  });

  it("redacts content provided as base64", async () => {
    const b64 = Buffer.from(MIXED, "utf8").toString("base64");
    const r = await redactFileTool({ source: "base64", value: b64, format: "text", strategy: "mask" });
    expect(r.redactedText.length).toBeGreaterThan(0);
    expect(r.redactedText).not.toContain("alice.doe@example.com");
  });
});

describe("list_detectors tool", () => {
  it("returns every detector, strategy, and policy", () => {
    const r = listDetectorsTool();
    expect(r.detectors.length).toBeGreaterThan(10);
    expect(r.strategies).toEqual(expect.arrayContaining(["mask", "replace", "hash", "fake", "remove"]));
    expect(r.policies.map((p) => p.name)).toEqual(
      expect.arrayContaining(["hipaa", "gdpr", "pci", "strict", "safe-share"])
    );
  });
});
