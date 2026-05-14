import { z } from "zod";
import { gitOrThrow, resolveRepoPath } from "../git/exec.js";
import { LOG_FORMAT, parseLog } from "../git/parseLog.js";
import { parseConventional } from "../git/conventional.js";

export const commitsSinceInputShape = {
  repoPath: z.string().min(1).describe("Filesystem path to a local git repository"),
  ref: z
    .string()
    .min(1)
    .describe("A ref to scan from — tag, sha, branch, or date (e.g. '2024-01-01' or 'v1.0.0')"),
  until: z.string().optional().describe("Optional upper bound (ref or date)"),
  max: z.number().int().min(1).max(2000).default(500).describe("Max commits to return"),
};

const InputSchema = z.object(commitsSinceInputShape);

const REF_LIKE = /^[A-Za-z0-9._\-\/+@^~]+$/;

export async function commitsSinceTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const cwd = await resolveRepoPath(input.repoPath);
  const args = ["log", `--pretty=format:${LOG_FORMAT}`, `--max-count=${input.max}`];
  const range = buildRange(input.ref, input.until);
  args.push(...range);

  const out = await gitOrThrow({ cwd, args });
  const commits = parseLog(out);
  const enriched = commits.map((c) => {
    const conv = parseConventional(c.subject, c.body);
    return {
      hash: c.hash,
      author: c.authorName,
      authorEmail: c.authorEmail,
      date: c.date,
      subject: c.subject,
      conventionalType: conv.type,
      scope: conv.scope,
      breaking: conv.breaking,
    };
  });

  return {
    repoPath: cwd,
    from: input.ref,
    until: input.until ?? "HEAD",
    count: enriched.length,
    commits: enriched,
  };
}

function buildRange(from: string, until?: string): string[] {
  // If 'from' looks like a date, use --since.
  if (looksLikeDate(from)) {
    const args = [`--since=${from}`];
    if (until && looksLikeDate(until)) args.push(`--until=${until}`);
    else if (until && isSafeRef(until)) args.push(until);
    return args;
  }
  if (!isSafeRef(from)) {
    throw new Error(`Unsafe ref: ${from}`);
  }
  const right = until && isSafeRef(until) ? until : "HEAD";
  return [`${from}..${right}`];
}

function looksLikeDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2})?$/.test(s) || /^\d+\s+(day|week|month|year)s?\s+ago$/i.test(s);
}

function isSafeRef(s: string): boolean {
  return REF_LIKE.test(s) && !s.startsWith("-");
}
