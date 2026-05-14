import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseResumeTool } from "../src/tools/parseResume.js";
import { scoreAgainstJobTool } from "../src/tools/scoreAgainstJob.js";
import { summarizeResumeTool } from "../src/tools/summarizeResume.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "fixtures", "sample-resume.txt");

async function loadFixtureText(): Promise<string> {
  return (await readFile(fixturePath, "utf8")).toString();
}

describe("parseResumeTool (text source)", () => {
  it("returns structured fields from the sample resume", async () => {
    const text = await loadFixtureText();
    const parsed: any = await parseResumeTool({ source: "text", value: text, format: "auto" });
    expect(parsed.contact.name).toBe("Priya Sharma");
    expect(parsed.contact.email).toBe("priya.sharma@example.com");
    expect(parsed.skills.length).toBeGreaterThan(5);
    expect(parsed.experience.length).toBeGreaterThanOrEqual(2);
    expect(parsed.experience[0].dates?.current).toBe(true);
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
    expect(parsed.certifications.length).toBeGreaterThanOrEqual(1);
  });

  it("loads a resume from a file path", async () => {
    const parsed: any = await parseResumeTool({ source: "path", value: fixturePath, format: "auto" });
    expect(parsed.contact.email).toBe("priya.sharma@example.com");
  });
});

describe("scoreAgainstJobTool", () => {
  it("scores a matching JD high and a mismatched JD low", async () => {
    const resume = await loadFixtureText();
    const goodJob = "We need a TypeScript / Node.js engineer with Kafka, PostgreSQL, Kubernetes and AWS experience.";
    const badJob = "Looking for a Salesforce admin with Apex, Lightning Web Components and Visualforce.";
    const good = scoreAgainstJobTool({ resume, jobDescription: goodJob });
    const bad = scoreAgainstJobTool({ resume, jobDescription: badJob });
    expect(good.score).toBeGreaterThan(bad.score);
    expect(good.matched.length).toBeGreaterThan(0);
    expect(bad.matched.length).toBeLessThan(good.matched.length);
  });
});

describe("summarizeResumeTool", () => {
  it("produces a non-empty summary referencing the candidate", async () => {
    const text = await loadFixtureText();
    const out = summarizeResumeTool({ text, maxWords: 80 });
    expect(out.summary).toContain("Priya Sharma");
    expect(out.yearsOfExperience).toBeGreaterThan(0);
  });
});
