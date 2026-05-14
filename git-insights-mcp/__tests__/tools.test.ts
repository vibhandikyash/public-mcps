import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { repoOverviewTool } from "../src/tools/repoOverview.js";
import { contributorStatsTool } from "../src/tools/contributorStats.js";
import { fileChurnTool } from "../src/tools/fileChurn.js";
import { ownershipMapTool } from "../src/tools/ownershipMap.js";
import { commitsSinceTool } from "../src/tools/commitsSince.js";
import { generateChangelogTool } from "../src/tools/generateChangelog.js";

function git(cwd: string, args: string[], env: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      env: { ...process.env, ...env, GIT_TERMINAL_PROMPT: "0" },
      shell: false,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("close", (code) =>
      code === 0 ? resolve(out) : reject(new Error(`git ${args.join(" ")} failed: ${err}`))
    );
  });
}

let repo: string;

beforeAll(async () => {
  repo = await mkdtemp(join(tmpdir(), "git-insights-test-"));
  await git(repo, ["init", "-q", "-b", "main"]);
  await git(repo, ["config", "user.email", "alice@example.com"]);
  await git(repo, ["config", "user.name", "Alice"]);
  await git(repo, ["config", "commit.gpgsign", "false"]);
  await git(repo, ["config", "tag.gpgsign", "false"]);

  await mkdir(join(repo, "src"), { recursive: true });
  await writeFile(join(repo, "src/index.ts"), "export const v = 1;\n");
  await writeFile(join(repo, "README.md"), "# demo\n");
  await git(repo, ["add", "."]);
  await git(repo, ["commit", "-q", "-m", "feat(core): initial commit"], {
    GIT_AUTHOR_DATE: "2024-01-02T10:00:00+00:00",
    GIT_COMMITTER_DATE: "2024-01-02T10:00:00+00:00",
  });

  await git(repo, ["tag", "v0.1.0"]);

  await appendFile(join(repo, "src/index.ts"), "export const w = 2;\n");
  await git(repo, ["add", "."]);
  await git(repo, ["commit", "-q", "-m", "fix(core): widen export"], {
    GIT_AUTHOR_DATE: "2024-02-02T10:00:00+00:00",
    GIT_COMMITTER_DATE: "2024-02-02T10:00:00+00:00",
  });

  // Switch author for a second contributor
  await git(repo, ["config", "user.email", "bob@example.com"]);
  await git(repo, ["config", "user.name", "Bob"]);

  await appendFile(join(repo, "src/index.ts"), "export const x = 3;\nexport const y = 4;\n");
  await writeFile(join(repo, "src/util.ts"), "export const u = 0;\n");
  await git(repo, ["add", "."]);
  await git(repo, ["commit", "-q", "-m", "feat!: breaking change"], {
    GIT_AUTHOR_DATE: "2024-03-02T10:00:00+00:00",
    GIT_COMMITTER_DATE: "2024-03-02T10:00:00+00:00",
  });
});

afterAll(async () => {
  if (repo) await rm(repo, { recursive: true, force: true });
});

describe("repoOverviewTool", () => {
  it("returns totals and head info", async () => {
    const r: any = await repoOverviewTool({ repoPath: repo });
    expect(r.totalCommits).toBe(3);
    expect(r.totalContributors).toBe(2);
    expect(r.tags).toContain("v0.1.0");
    expect(r.head).toBe("main");
    expect(r.topExtensions.find((e: any) => e.extension === ".ts")).toBeTruthy();
  });
});

describe("contributorStatsTool", () => {
  it("groups commits by author", async () => {
    const r: any = await contributorStatsTool({ repoPath: repo, top: 10 });
    expect(r.totalContributors).toBe(2);
    const alice = r.contributors.find((c: any) => c.authorEmail === "alice@example.com");
    const bob = r.contributors.find((c: any) => c.authorEmail === "bob@example.com");
    expect(alice.commits).toBe(2);
    expect(bob.commits).toBe(1);
  });
});

describe("fileChurnTool", () => {
  it("ranks files by total lines changed", async () => {
    const r: any = await fileChurnTool({ repoPath: repo, top: 10 });
    const top = r.files[0];
    expect(top.path).toBe("src/index.ts");
    expect(top.commits).toBeGreaterThanOrEqual(3);
  });
});

describe("ownershipMapTool", () => {
  it("attributes lines to authors via blame", async () => {
    const r: any = await ownershipMapTool({ repoPath: repo, path: "src/index.ts" });
    expect(r.totalLines).toBeGreaterThan(0);
    const aliceShare = r.owners.find((o: any) => o.authorEmail === "alice@example.com");
    const bobShare = r.owners.find((o: any) => o.authorEmail === "bob@example.com");
    expect(aliceShare.lines + bobShare.lines).toBe(r.totalLines);
  });
});

describe("commitsSinceTool", () => {
  it("lists commits after a tag with conventional metadata", async () => {
    const r: any = await commitsSinceTool({ repoPath: repo, ref: "v0.1.0" });
    expect(r.count).toBe(2);
    expect(r.commits[0].conventionalType).toBeDefined();
    expect(r.commits.find((c: any) => c.breaking)).toBeTruthy();
  });
});

describe("generateChangelogTool", () => {
  it("emits a markdown changelog grouped by type", async () => {
    const r: any = await generateChangelogTool({ repoPath: repo, fromRef: "v0.1.0", format: "markdown" });
    const md = r.markdown as string;
    expect(md).toMatch(/Breaking changes/);
    expect(md).toMatch(/Bug fixes/);
    expect(md).toMatch(/breaking change/);
  });

  it("emits structured JSON groups when requested", async () => {
    const r: any = await generateChangelogTool({ repoPath: repo, fromRef: "v0.1.0", format: "json" });
    expect(r.groups.breaking.length).toBeGreaterThan(0);
    expect(r.groups.fix.length).toBeGreaterThan(0);
  });
});
