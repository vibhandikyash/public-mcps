# git-insights-mcp

An MCP (Model Context Protocol) server that turns any local git repository into a queryable analytics surface — contributor stats, file-churn hot-spots, ownership maps, and Keep-a-Changelog–style release notes generated from conventional commits.

The existing `mcp-server-git` covers basic plumbing (status, diff, log). This server is the porcelain layer on top: the questions you actually want to ask about a codebase.

- **Zero auth.** Reads a local repo. No remote calls, no tokens.
- **Stdio transport.** Drop-in for Claude Desktop, Cursor, Continue, Windsurf, and any MCP client.
- **Safe.** Every `git` call is `spawn`'d without a shell, refs are validated, and paths are resolved before use.

## Tools

| Tool | What it does |
|---|---|
| `repo_overview` | Totals (commits, contributors, files, branches, tags), age in days, top file extensions |
| `contributor_stats` | Per-author commit count, insertions, deletions, first/last commit — optionally over a date window |
| `file_churn` | Hottest files by lines changed and edit count |
| `ownership_map` | Per-author percentage of a file's current lines (from `git blame`) |
| `commits_since` | Commits since a tag / sha / branch / date, with conventional-commit metadata parsed out |
| `generate_changelog` | Grouped changelog (markdown or JSON) between two refs |

## Install

```bash
npx -y git-insights-mcp
```

Or globally:

```bash
npm install -g git-insights-mcp
```

You need `git` available on `PATH`.

## Client configuration

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "git-insights": {
      "command": "npx",
      "args": ["-y", "git-insights-mcp"]
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json` (or project-local `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "git-insights": {
      "command": "npx",
      "args": ["-y", "git-insights-mcp"]
    }
  }
}
```

### Continue

`~/.continue/config.json`:

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["-y", "git-insights-mcp"]
        }
      }
    ]
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "git-insights": {
      "command": "npx",
      "args": ["-y", "git-insights-mcp"]
    }
  }
}
```

## Usage examples

Once configured, ask your assistant:

> *"Give me a one-paragraph overview of `/Users/me/code/my-repo`."*

> *"Who are the top 5 contributors to this repo in the last 6 months?"*

> *"Which files have had the most churn under `src/auth/`?"*

> *"Generate a changelog from `v1.2.0` to `HEAD` as markdown."*

> *"Who owns `src/scheduler/queue.ts`?"*

## Local development

```bash
npm install
npm run typecheck
npm run lint
npm test                  # creates a temp git repo for end-to-end tool tests
npm run build
node dist/index.js        # runs the stdio server
```

### Testing the stdio handshake

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' | node dist/index.js
```

## Docker

```bash
docker build -t git-insights-mcp .
# bind-mount a repo to query
docker run --rm -i -v "$PWD":/repo git-insights-mcp
```

## Tool reference

### `generate_changelog`

```ts
{
  repoPath: string,
  fromRef?: string,           // defaults to the previous tag if available
  toRef?: string,             // defaults to HEAD
  format?: "markdown" | "json",
  title?: string              // custom heading for the markdown output
}
```

Returns either `{ markdown }` or `{ groups: { breaking, feat, fix, perf, refactor, docs, test, build, other } }`.

Groups follow the conventional-commits spec; `BREAKING CHANGE:` footers and the `feat!:` syntax both promote a commit to the **breaking** group.

### `commits_since`

```ts
{
  repoPath: string,
  ref: string,                // tag, sha, branch, or a date like "2024-01-01" / "6 months ago"
  until?: string,             // optional upper bound
  max?: number                // default 500
}
```

Each commit comes with `conventionalType`, `scope`, and `breaking` parsed out of the subject and body.

## Limitations

- Analyses local repositories only — no remote API calls. Clone the repo first if you need it offline.
- File-rename history is followed by git's default rules; very heavy rename churn may shift ownership numbers.
- Authors are grouped by email (lowercased) where available, otherwise by name — duplicate identities across multiple emails will show up separately.

## License

MIT — © Yashvi Bhandik
