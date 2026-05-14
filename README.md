# public-mcps

Two small, focused MCP (Model Context Protocol) servers I built and open-sourced for the community. Both are stdio servers, zero-OAuth, easy to install via `npx`.

| Server | What it does |
|---|---|
| [`resume-parser-mcp`](./resume-parser-mcp) | Parse PDF / DOCX / text resumes into structured JSON, extract skills, score against a job description |
| [`git-insights-mcp`](./git-insights-mcp) | Local-git analytics: contributor stats, file churn, ownership maps, conventional-commit changelogs |

Each package publishes independently to npm and ships its own README with install snippets for Claude Desktop, Cursor, Continue, and Windsurf.

## Why these two?

- **Resume parser** — recruiters and founders increasingly use AI to triage candidates, but there is no clean MCP for *parsing* resumes (existing ones only generate them). Self-contained, no external API.
- **Git insights** — the official `mcp-server-git` covers basic commands; this one focuses on the *analytics* layer (who owns what, where the churn lives, what shipped since the last tag).

## Development

```bash
# install per package
cd resume-parser-mcp && npm install && npm test
cd git-insights-mcp && npm install && npm test
```

CI runs lint + typecheck + tests on every PR. Publishing happens on `v*.*.*` tags via GitHub Actions.

## License

MIT — see [LICENSE](./LICENSE).

## Author

Yashvi Bhandik · [github.com/yashvibhandik](https://github.com/yashvibhandik)
