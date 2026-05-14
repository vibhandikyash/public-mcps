import { z } from "zod";
import { gitOrThrow, resolveRepoPath } from "../git/exec.js";

export const ownershipMapInputShape = {
  repoPath: z.string().min(1).describe("Filesystem path to a local git repository"),
  path: z.string().min(1).describe("File path inside the repo to analyse"),
};

const InputSchema = z.object(ownershipMapInputShape);

export async function ownershipMapTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const cwd = await resolveRepoPath(input.repoPath);
  const stdout = await gitOrThrow({
    cwd,
    args: ["blame", "--line-porcelain", "--", input.path],
  });

  const lineCounts = new Map<string, { name: string; email: string; lines: number }>();
  let currentAuthor: { name: string; email: string } | null = null;
  let pendingLine = false;
  let totalLines = 0;

  for (const line of stdout.split("\n")) {
    if (/^[0-9a-f]{40}\b/.test(line)) {
      // Header line for a blame entry; reset for this group.
      currentAuthor = { name: "", email: "" };
      pendingLine = true;
      continue;
    }
    if (currentAuthor && line.startsWith("author ")) {
      currentAuthor.name = line.slice("author ".length);
      continue;
    }
    if (currentAuthor && line.startsWith("author-mail ")) {
      currentAuthor.email = line.slice("author-mail ".length).replace(/^<|>$/g, "");
      continue;
    }
    if (pendingLine && line.startsWith("\t")) {
      if (currentAuthor) {
        const key = (currentAuthor.email || currentAuthor.name).toLowerCase();
        const existing = lineCounts.get(key) ?? { name: currentAuthor.name, email: currentAuthor.email, lines: 0 };
        existing.lines += 1;
        lineCounts.set(key, existing);
        totalLines += 1;
      }
      pendingLine = false;
    }
  }

  const rows = Array.from(lineCounts.values())
    .sort((a, b) => b.lines - a.lines)
    .map((r) => ({
      authorName: r.name,
      authorEmail: r.email,
      lines: r.lines,
      percent: totalLines ? Math.round((r.lines / totalLines) * 1000) / 10 : 0,
    }));

  return {
    repoPath: cwd,
    path: input.path,
    totalLines,
    owners: rows,
  };
}
