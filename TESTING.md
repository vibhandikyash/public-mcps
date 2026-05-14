# Testing the MCP servers

Four ways to test, from fastest to most realistic. The same options apply to both `resume-parser-mcp` and `git-insights-mcp` — swap the package name.

## 1. The automated test suite

Per-package unit + integration tests run in milliseconds, no external setup.

```bash
cd resume-parser-mcp
npm install
npm test           # 11 tests
```

```bash
cd git-insights-mcp
npm install
npm test           # 18 tests (creates a temp git repo in beforeAll)
```

Watch mode:

```bash
npm run test:watch
```

The CI workflow (`.github/workflows/ci.yml`) runs the same suite on Node 20 and Node 22 against every push and PR.

## 2. MCP Inspector — interactive UI

The official Model Context Protocol testing tool. Browser UI, form-driven tool calls, full request/response inspection. Best for exploring inputs and edge cases.

```bash
cd resume-parser-mcp
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

The Inspector opens a local page. From the **Tools** tab you can pick `parse_resume`, `extract_keywords`, `score_against_job`, or `summarize_resume`, fill in arguments via the auto-generated form, and see the JSON response.

Try this for `parse_resume`:

```json
{
  "source": "path",
  "value": "__tests__/fixtures/sample-resume.txt",
  "format": "text"
}
```

Same idea for `git-insights-mcp` — point it at any local git repo.

## 3. Wire it into a real MCP client

This is the closest test to how end users will use it. Add the server to your client's config and ask natural-language questions.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "resume-parser": {
      "command": "node",
      "args": ["/absolute/path/to/public-mcps/resume-parser-mcp/dist/index.js"]
    },
    "git-insights": {
      "command": "node",
      "args": ["/absolute/path/to/public-mcps/git-insights-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop, then try:

- *"Parse `~/Downloads/some-resume.pdf` and tell me their top 5 skills."*
- *"Score this resume against this job description: …"*
- *"Give me a one-paragraph overview of `~/code/my-repo`."*
- *"Generate a changelog from `v1.2.0` to HEAD for `~/code/my-repo` as markdown."*

### Cursor / Continue / Windsurf

The per-package README has copy-paste config snippets for each client. Once published to npm, `command: "npx"` with `args: ["-y", "<package-name>"]` becomes the simplest setup.

## 4. Raw stdio — for protocol-level debugging

Useful when something's off and you want to see exact JSON-RPC frames. Save the script below and run it; tweak the request payloads to exercise other tools.

`scripts/smoke.mjs`:

```js
import { spawn } from "node:child_process";

const SERVER = process.argv[2] ?? "./resume-parser-mcp/dist/index.js";
const child = spawn("node", [SERVER], { stdio: ["pipe", "pipe", "inherit"] });

let buf = "";
const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) !== -1) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (line.trim()) console.log(JSON.parse(line));
  }
});

send({ jsonrpc: "2.0", id: 1, method: "initialize",
       params: { protocolVersion: "2025-06-18", capabilities: {},
                 clientInfo: { name: "smoke", version: "0" } } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
send({ jsonrpc: "2.0", id: 3, method: "tools/call",
       params: { name: "summarize_resume",
                 arguments: { text: "Priya Sharma\nSenior Engineer at Acme | Jan 2022 - Present\nSKILLS\nTypeScript, Node.js, Kubernetes" } } });
setTimeout(() => child.kill(), 1500);
```

```bash
node scripts/smoke.mjs ./resume-parser-mcp/dist/index.js
node scripts/smoke.mjs ./git-insights-mcp/dist/index.js
```

Common pitfalls when debugging:

- **Empty / hung output** — usually a missing `notifications/initialized` after `initialize`. The server holds tool calls until it sees this notification.
- **`stdout` corruption** — never `console.log` from inside a tool; use `process.stderr.write`. Both packages already enforce this via lint (`no-console`).
- **Schema errors** — Zod validates every input. If a tool returns `isError: true` with a Zod message, check the `inputSchema` shape from `tools/list`.

## Quick "is everything wired up?" check

From the repo root:

```bash
( cd resume-parser-mcp && npm run lint && npm run typecheck && npm test && npm run build ) && \
( cd git-insights-mcp  && npm run lint && npm run typecheck && npm test && npm run build )
```

Green across both packages means lint, types, behaviour, and bundles are all healthy.
