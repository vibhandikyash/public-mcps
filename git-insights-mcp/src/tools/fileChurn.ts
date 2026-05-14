import { z } from "zod";
import { gitOrThrow, resolveRepoPath } from "../git/exec.js";
import { LOG_FORMAT, parseLogWithNumstat } from "../git/parseLog.js";

export const fileChurnInputShape = {
  repoPath: z.string().min(1).describe("Filesystem path to a local git repository"),
  since: z.string().optional().describe("Only count edits since this date"),
  until: z.string().optional().describe("Only count edits up to this date"),
  pathPrefix: z.string().optional().describe("Restrict to files under this path"),
  top: z.number().int().min(1).max(500).default(20).describe("Max number of files to return"),
};

const InputSchema = z.object(fileChurnInputShape);

export interface ChurnRow {
  path: string;
  commits: number;
  insertions: number;
  deletions: number;
  totalLinesChanged: number;
}

export async function fileChurnTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const cwd = await resolveRepoPath(input.repoPath);
  const args = ["log", `--pretty=format:${LOG_FORMAT}`, "--numstat"];
  if (input.since) args.push(`--since=${input.since}`);
  if (input.until) args.push(`--until=${input.until}`);

  const out = await gitOrThrow({ cwd, args });
  const commits = parseLogWithNumstat(out);

  const byPath = new Map<string, ChurnRow>();
  for (const c of commits) {
    for (const f of c.files) {
      if (input.pathPrefix && !f.path.startsWith(input.pathPrefix)) continue;
      let row = byPath.get(f.path);
      if (!row) {
        row = { path: f.path, commits: 0, insertions: 0, deletions: 0, totalLinesChanged: 0 };
        byPath.set(f.path, row);
      }
      row.commits += 1;
      row.insertions += f.insertions;
      row.deletions += f.deletions;
      row.totalLinesChanged = row.insertions + row.deletions;
    }
  }

  const rows = Array.from(byPath.values())
    .sort((a, b) => b.totalLinesChanged - a.totalLinesChanged || b.commits - a.commits)
    .slice(0, input.top);

  return {
    repoPath: cwd,
    window: { since: input.since ?? null, until: input.until ?? null, pathPrefix: input.pathPrefix ?? null },
    totalFiles: byPath.size,
    files: rows,
  };
}
