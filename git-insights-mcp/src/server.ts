import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { repoOverviewTool, repoOverviewInputShape } from "./tools/repoOverview.js";
import { contributorStatsTool, contributorStatsInputShape } from "./tools/contributorStats.js";
import { fileChurnTool, fileChurnInputShape } from "./tools/fileChurn.js";
import { ownershipMapTool, ownershipMapInputShape } from "./tools/ownershipMap.js";
import { commitsSinceTool, commitsSinceInputShape } from "./tools/commitsSince.js";
import { generateChangelogTool, generateChangelogInputShape } from "./tools/generateChangelog.js";
import { logError } from "./utils/log.js";

export const SERVER_NAME = "git-insights-mcp";
export const SERVER_VERSION = "0.1.0";

export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "repo_overview",
    {
      title: "Repository Overview",
      description:
        "Summarise a local git repository: total commits, contributors, files, branches, tags, age in days, and the most common file extensions.",
      inputSchema: repoOverviewInputShape,
    },
    async (args) => safe(() => repoOverviewTool(args as any))
  );

  server.registerTool(
    "contributor_stats",
    {
      title: "Contributor Stats",
      description:
        "Per-author commit counts, lines inserted/deleted, and first/last commit dates. Optional date window via `since` / `until`.",
      inputSchema: contributorStatsInputShape,
    },
    async (args) => safe(() => contributorStatsTool(args as any))
  );

  server.registerTool(
    "file_churn",
    {
      title: "File Churn",
      description:
        "Hottest files by total lines changed and edit count. Optional date window and path-prefix filter.",
      inputSchema: fileChurnInputShape,
    },
    async (args) => safe(() => fileChurnTool(args as any))
  );

  server.registerTool(
    "ownership_map",
    {
      title: "Ownership Map",
      description:
        "Who owns which lines of a given file, as a percentage breakdown derived from `git blame`.",
      inputSchema: ownershipMapInputShape,
    },
    async (args) => safe(() => ownershipMapTool(args as any))
  );

  server.registerTool(
    "commits_since",
    {
      title: "Commits Since",
      description:
        "List commits since a ref (tag/sha/branch) or a date, with conventional-commit metadata (type, scope, breaking) parsed out.",
      inputSchema: commitsSinceInputShape,
    },
    async (args) => safe(() => commitsSinceTool(args as any))
  );

  server.registerTool(
    "generate_changelog",
    {
      title: "Generate Changelog",
      description:
        "Generate a grouped, Keep-a-Changelog-style changelog (markdown or JSON) between two refs from conventional commits.",
      inputSchema: generateChangelogInputShape,
    },
    async (args) => safe(() => generateChangelogTool(args as any))
  );

  return server;
}

async function safe<T>(fn: () => Promise<T> | T) {
  try {
    const value = await fn();
    return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("[git-insights-mcp] tool error:", message);
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Error: ${message}` }],
    };
  }
}
