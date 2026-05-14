import { z } from "zod";
import { gitOrThrow, resolveRepoPath } from "../git/exec.js";
import { LOG_FORMAT, parseLogWithNumstat } from "../git/parseLog.js";

export const contributorStatsInputShape = {
  repoPath: z.string().min(1).describe("Filesystem path to a local git repository"),
  since: z.string().optional().describe("Lower-bound date (e.g. '2024-01-01' or '6 months ago')"),
  until: z.string().optional().describe("Upper-bound date"),
  top: z.number().int().min(1).max(500).default(20).describe("Max number of contributors to return"),
};

const InputSchema = z.object(contributorStatsInputShape);

export interface ContributorRow {
  authorName: string;
  authorEmail: string;
  commits: number;
  insertions: number;
  deletions: number;
  netLines: number;
  firstCommit: string;
  lastCommit: string;
}

export async function contributorStatsTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const cwd = await resolveRepoPath(input.repoPath);
  const args = ["log", `--pretty=format:${LOG_FORMAT}`, "--numstat"];
  if (input.since) args.push(`--since=${input.since}`);
  if (input.until) args.push(`--until=${input.until}`);

  const out = await gitOrThrow({ cwd, args });
  const commits = parseLogWithNumstat(out);

  const byKey = new Map<string, ContributorRow>();
  for (const c of commits) {
    const key = (c.authorEmail || c.authorName).toLowerCase();
    let row = byKey.get(key);
    if (!row) {
      row = {
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        commits: 0,
        insertions: 0,
        deletions: 0,
        netLines: 0,
        firstCommit: c.date,
        lastCommit: c.date,
      };
      byKey.set(key, row);
    }
    row.commits += 1;
    row.insertions += c.insertions;
    row.deletions += c.deletions;
    row.netLines = row.insertions - row.deletions;
    if (c.date < row.firstCommit) row.firstCommit = c.date;
    if (c.date > row.lastCommit) row.lastCommit = c.date;
  }

  const rows = Array.from(byKey.values())
    .sort((a, b) => b.commits - a.commits || b.insertions - a.insertions)
    .slice(0, input.top);

  return {
    repoPath: cwd,
    window: { since: input.since ?? null, until: input.until ?? null },
    totalContributors: byKey.size,
    contributors: rows,
  };
}
