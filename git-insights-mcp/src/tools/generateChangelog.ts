import { z } from "zod";
import { gitOrThrow, resolveRepoPath } from "../git/exec.js";
import { LOG_FORMAT, parseLog } from "../git/parseLog.js";
import { CHANGELOG_GROUPS, groupForType, parseConventional } from "../git/conventional.js";

export const generateChangelogInputShape = {
  repoPath: z.string().min(1).describe("Filesystem path to a local git repository"),
  fromRef: z.string().optional().describe("Lower bound (tag, sha, branch). Default: previous tag if any."),
  toRef: z.string().optional().describe("Upper bound (tag, sha, branch). Default: HEAD"),
  format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
  title: z.string().optional().describe("Custom heading (e.g. release version)"),
};

const InputSchema = z.object(generateChangelogInputShape);

const REF_LIKE = /^[A-Za-z0-9._\-\/+@^~]+$/;

export async function generateChangelogTool(rawInput: z.input<typeof InputSchema>) {
  const input = InputSchema.parse(rawInput);
  const cwd = await resolveRepoPath(input.repoPath);

  let from = input.fromRef;
  if (!from) {
    const tags = await gitOrThrow({ cwd, args: ["tag", "--sort=-creatordate"] });
    const list = tags.split("\n").map((l) => l.trim()).filter(Boolean);
    from = list[1] ?? list[0];
  }
  const to = input.toRef ?? "HEAD";
  for (const r of [from, to].filter(Boolean) as string[]) {
    if (!REF_LIKE.test(r)) throw new Error(`Unsafe ref: ${r}`);
  }

  const range = from ? `${from}..${to}` : to;
  const stdout = await gitOrThrow({ cwd, args: ["log", `--pretty=format:${LOG_FORMAT}`, range] });
  const commits = parseLog(stdout);

  const grouped = new Map<string, { description: string; hash: string; scope?: string }[]>();
  for (const g of CHANGELOG_GROUPS) grouped.set(g.key, []);

  for (const c of commits) {
    const conv = parseConventional(c.subject, c.body);
    const key = groupForType(conv.type, conv.breaking);
    const entry = { description: conv.description || c.subject, hash: c.hash.slice(0, 7), scope: conv.scope };
    grouped.get(key)!.push(entry);
  }

  if (input.format === "json") {
    return {
      repoPath: cwd,
      from: from ?? null,
      to,
      groups: Object.fromEntries(grouped),
    };
  }

  return { markdown: renderMarkdown({ title: input.title, from, to, grouped }) };
}

function renderMarkdown(p: {
  title?: string;
  from?: string;
  to: string;
  grouped: Map<string, { description: string; hash: string; scope?: string }[]>;
}): string {
  const heading = p.title ?? (p.from ? `${p.from} → ${p.to}` : p.to);
  const lines: string[] = [`## ${heading}`, ""];
  let wroteAny = false;
  for (const g of CHANGELOG_GROUPS) {
    const items = p.grouped.get(g.key) ?? [];
    if (!items.length) continue;
    wroteAny = true;
    lines.push(`### ${g.title}`, "");
    for (const it of items) {
      const scope = it.scope ? `**${it.scope}:** ` : "";
      lines.push(`- ${scope}${it.description} (\`${it.hash}\`)`);
    }
    lines.push("");
  }
  if (!wroteAny) lines.push("_No changes._", "");
  return lines.join("\n");
}
