import { describe, it, expect } from "vitest";
import { extractContact } from "../src/extractors/contact.js";
import { splitSections } from "../src/extractors/sections.js";
import { extractSkills, topKeywords } from "../src/extractors/skills.js";
import { extractDateRange } from "../src/extractors/dates.js";

describe("extractContact", () => {
  it("pulls email, phone, name and links from a resume header", () => {
    const text = `Priya Sharma\npriya.sharma@example.com | +91 98765 43210 | Bengaluru, IN\nhttps://github.com/priyasharma | https://linkedin.com/in/priyasharma`;
    const c = extractContact(text);
    expect(c.email).toBe("priya.sharma@example.com");
    expect(c.phone?.replace(/\D/g, "")).toContain("9876543210");
    expect(c.name).toBe("Priya Sharma");
    expect(c.links.some((l) => l.includes("github.com/priyasharma"))).toBe(true);
    expect(c.links.some((l) => l.includes("linkedin.com/in/priyasharma"))).toBe(true);
  });
});

describe("splitSections", () => {
  it("recognises common headings", () => {
    const text = [
      "SUMMARY",
      "Backend engineer.",
      "",
      "EXPERIENCE",
      "Engineer @ Acme",
      "",
      "EDUCATION",
      "B.S. Computer Science",
      "",
      "SKILLS",
      "TypeScript, Node.js",
    ].join("\n");
    const s = splitSections(text);
    expect(s.summary).toContain("Backend engineer");
    expect(s.experience).toContain("Engineer @ Acme");
    expect(s.education).toContain("B.S. Computer Science");
    expect(s.skills).toContain("TypeScript");
  });
});

describe("extractSkills", () => {
  it("finds known skills and classifies workplace tools separately", () => {
    const text = "I have used TypeScript, Node.js, Kubernetes, Docker, Jira and Figma.";
    const { skills, tools } = extractSkills(text);
    expect(skills).toContain("TypeScript");
    expect(skills).toContain("Node.js");
    expect(skills).toContain("Kubernetes");
    expect(skills).toContain("Docker");
    expect(tools).toContain("Jira");
    expect(tools).toContain("Figma");
  });

  it("does not match substrings", () => {
    const text = "I love going for a JavaScripted holiday.";
    const { skills } = extractSkills(text);
    expect(skills).not.toContain("JavaScript");
  });
});

describe("topKeywords", () => {
  it("returns common terms by frequency", () => {
    const text = "billing billing billing pipeline pipeline kafka kafka kafka redis";
    const kws = topKeywords(text, 3);
    expect(kws.slice(0, 3)).toEqual(expect.arrayContaining(["billing", "kafka"]));
  });
});

describe("extractDateRange", () => {
  it("parses Month YYYY - Present", () => {
    const r = extractDateRange("Senior Engineer — Acme | Jan 2022 - Present");
    expect(r?.startYear).toBe(2022);
    expect(r?.startMonth).toBe(1);
    expect(r?.current).toBe(true);
  });

  it("parses YYYY - YYYY", () => {
    const r = extractDateRange("B.S. Computer Science, 2015 - 2019");
    expect(r?.startYear).toBe(2015);
    expect(r?.endYear).toBe(2019);
    expect(r?.current).toBeFalsy();
  });
});
