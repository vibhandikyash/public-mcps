import { describe, it, expect } from "vitest";
import { parseLog, parseLogWithNumstat, FIELD_SEP, RECORD_SEP, LOG_FORMAT } from "../src/git/parseLog.js";

function buildRecord(parts: string[]): string {
  return parts.join(FIELD_SEP) + RECORD_SEP;
}

describe("parseLog", () => {
  it("parses multiple commit records", () => {
    const out = buildRecord(["abc", "Ada", "ada@x.com", "2024-01-02T10:00:00+00:00", "feat: a", ""])
      + buildRecord(["def", "Bee", "bee@x.com", "2024-02-02T10:00:00+00:00", "fix: b", ""]);
    const commits = parseLog(out);
    expect(commits).toHaveLength(2);
    expect(commits[0].authorName).toBe("Ada");
    expect(commits[1].subject).toBe("fix: b");
  });

  it("LOG_FORMAT contains the expected number of fields", () => {
    expect(LOG_FORMAT.split(FIELD_SEP)).toHaveLength(6);
  });
});

describe("parseLogWithNumstat", () => {
  it("attaches numstat data to commits", () => {
    const header = ["abc", "Ada", "ada@x.com", "2024-01-02T10:00:00+00:00", "feat: a", ""].join(FIELD_SEP);
    const rec = `${header}\n5\t1\tsrc/index.ts\n3\t0\tREADME.md\n${RECORD_SEP}`;
    const commits = parseLogWithNumstat(rec);
    expect(commits).toHaveLength(1);
    expect(commits[0].insertions).toBe(8);
    expect(commits[0].deletions).toBe(1);
    expect(commits[0].files).toHaveLength(2);
  });

  it("handles '-' numstat (binary files)", () => {
    const header = ["abc", "Ada", "ada@x.com", "2024-01-02T10:00:00+00:00", "feat: a", ""].join(FIELD_SEP);
    const rec = `${header}\n-\t-\tlogo.png\n${RECORD_SEP}`;
    const commits = parseLogWithNumstat(rec);
    expect(commits[0].insertions).toBe(0);
    expect(commits[0].files[0].path).toBe("logo.png");
  });
});
