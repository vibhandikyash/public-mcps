# resume-parser-mcp

An MCP (Model Context Protocol) server that turns **PDF / DOCX / plain-text resumes** into structured JSON — contact info, skills, work experience, education, projects, certifications — and scores candidates against a job description.

Useful for recruiters, founders triaging applicants, ATS integrations, and anyone wiring an AI assistant into a hiring pipeline.

- **Zero auth.** No API keys, no OAuth. Everything runs locally.
- **Stdio transport.** Drop-in for Claude Desktop, Cursor, Continue, Windsurf, and any MCP client.
- **Self-contained.** PDF parsing via `pdf-parse`, DOCX via `mammoth`; no cloud calls.

## Tools

| Tool | What it does |
|---|---|
| `parse_resume` | Read a resume (path / base64 / text) → structured JSON: contact, summary, skills, experience, education, projects, certifications |
| `extract_keywords` | Extract technical skills, tools, and the top-N high-signal keywords from any text |
| `score_against_job` | Match a resume against a job description → 0-100 score, matched / missing / bonus skills, short rationale |
| `summarize_resume` | Produce a short candidate summary (headline, years of experience, top stack, education) |

## Install

```bash
npx -y resume-parser-mcp
```

Or globally:

```bash
npm install -g resume-parser-mcp
```

## Client configuration

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "resume-parser": {
      "command": "npx",
      "args": ["-y", "resume-parser-mcp"]
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json` or the project-local `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "resume-parser": {
      "command": "npx",
      "args": ["-y", "resume-parser-mcp"]
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
          "args": ["-y", "resume-parser-mcp"]
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
    "resume-parser": {
      "command": "npx",
      "args": ["-y", "resume-parser-mcp"]
    }
  }
}
```

## Usage examples

Once configured, ask your assistant:

> *"Parse `/Users/me/Downloads/jane_doe.pdf` and tell me her top 5 skills."*

> *"Here's a job description for a senior backend role. Score this resume against it: …"*

> *"Summarize this CV in two sentences."*

## Local development

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
node dist/index.js   # runs the stdio server (use the MCP Inspector to interact)
```

### Testing the stdio handshake

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' | node dist/index.js
```

## Docker

```bash
docker build -t resume-parser-mcp .
docker run --rm -i resume-parser-mcp
```

## Tool reference

### `parse_resume`

```ts
{
  source: "path" | "base64" | "text",
  value: string,
  format?: "pdf" | "docx" | "text" | "auto"
}
```

Returns:

```ts
{
  contact: { name?, email?, phone?, location?, links: string[] },
  summary?: string,
  skills: string[],
  tools: string[],
  experience: { title?, company?, dates?, bullets: string[] }[],
  education: { institution?, degree?, field?, dates?, details: string[] }[],
  projects:  { name?, description?, bullets: string[] }[],
  certifications: string[],
  rawText: string,
  sections: Record<string, string>
}
```

### `score_against_job`

```ts
{
  resume: string,
  jobDescription: string
}
```

Returns:

```ts
{
  score: number,            // 0-100
  matched: string[],
  missing: string[],
  bonus: string[],
  rationale: string
}
```

## Limitations

- The parser is **rule-based**, not LLM-backed — fast and offline, but layouts that put critical info inside columns / tables / images may not extract cleanly. Scans / image-only PDFs need OCR (not bundled).
- Skill matching uses a curated dictionary; niche or very new tools may not register.
- For best results, pass plain text when you have it.

## License

MIT — © Yashvi Bhandik
