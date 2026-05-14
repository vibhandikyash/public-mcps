import { z } from "zod";
import { gitOrThrow, resolveRepoPath } from "../git/exec.js";
import { FIELD_SEP, LOG_FORMAT, RECORD_SEP, parseLog } from "../git/parseLog.js";
import { extname } from "node:path";

export const repoOverviewInputShape = {
  repoPath: z.string().min(1).describe("Filesystem path to a local git repository"),
};

const InputSchema = z.object(repoOverviewInputShape);

export async function repoOverviewTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const cwd = await resolveRepoPath(input.repoPath);
  const [logOut, branchesOut, tagsOut, filesOut, headOut] = await Promise.all([
    gitOrThrow({ cwd, args: ["log", `--pretty=format:${LOG_FORMAT}`] }),
    gitOrThrow({ cwd, args: ["branch", "-a", "--no-color"] }),
    gitOrThrow({ cwd, args: ["tag", "--list"] }),
    gitOrThrow({ cwd, args: ["ls-files"] }),
    gitOrThrow({ cwd, args: ["rev-parse", "--abbrev-ref", "HEAD"] }),
  ]);
  const commits = parseLog(logOut);
  const totalCommits = commits.length;
  const contributors = new Set<string>();
  for (const c of commits) contributors.add(c.authorEmail || c.authorName);

  const firstCommit = commits[commits.length - 1];
  const lastCommit = commits[0];

  const branches = branchesOut
    .split("\n")
    .map((l) => l.replace(/^[* ]+/, "").trim())
    .filter(Boolean);
  const tags = tagsOut.split("\n").map((l) => l.trim()).filter(Boolean);

  const files = filesOut.split("\n").map((l) => l.trim()).filter(Boolean);
  const extCounts = new Map<string, number>();
  for (const f of files) {
    const e = extname(f).toLowerCase();
    if (!e) continue;
    extCounts.set(e, (extCounts.get(e) ?? 0) + 1);
  }
  const topExtensions = Array.from(extCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ext, count]) => ({ extension: ext, files: count }));

  return {
    repoPath: cwd,
    head: headOut.trim(),
    totalCommits,
    totalContributors: contributors.size,
    totalFiles: files.length,
    branches,
    tags,
    firstCommit: firstCommit
      ? { hash: firstCommit.hash, date: firstCommit.date, author: firstCommit.authorName }
      : null,
    lastCommit: lastCommit
      ? { hash: lastCommit.hash, date: lastCommit.date, author: lastCommit.authorName, subject: lastCommit.subject }
      : null,
    ageDays: firstCommit && lastCommit
      ? Math.max(0, Math.round((new Date(lastCommit.date).getTime() - new Date(firstCommit.date).getTime()) / 86400000))
      : 0,
    topExtensions,
  };
}

// Silence unused imports warning — these constants are exported for tooling but not used here.
void FIELD_SEP; void RECORD_SEP;
