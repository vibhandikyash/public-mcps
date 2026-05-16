# pii-scrubber-mcp

An MCP (Model Context Protocol) server that **detects and redacts personally identifiable information** in text, PDFs, and DOCX files. Designed as a privacy guardrail in front of LLMs, log pipelines, and analytics — so PII never leaves the machine without consent.

- **15 detectors** — email, phone, credit-card (Luhn-validated), SSN, IBAN (mod-97 validated), IPv4/v6, AWS / GitHub / OpenAI keys, JWTs, PEM private-key blocks, postal addresses, DOB, MAC address, generic high-entropy secrets
- **5 redaction strategies** — `mask` · `replace` · `hash` (deterministic SHA-256) · `fake` (stable synthetic) · `remove`
- **5 compliance presets** — HIPAA · GDPR · PCI · `strict` · `safe-share`
- **Zero auth, zero network.** Everything runs locally. No data leaves your machine.
- **Stdio transport.** Drop-in for Claude Desktop, Cursor, Continue, Windsurf, or any MCP client.

## Tools

| Tool | What it does |
|---|---|
| `scan_text` | Find PII in text. Returns each match with `type`, `value`, `start`, `end`, `confidence`, `token`. |
| `redact_text` | Detect and rewrite text under a chosen strategy. `perType` lets you mix strategies (e.g. hash emails, replace phones). |
| `redact_file` | Same as `redact_text` but reads from a path or base64 (PDF / DOCX / plain text). |
| `policy_check` | Evaluate text against a compliance preset; return pass/fail, violations, remediation hint. |
| `list_detectors` | Introspection — every detector, every strategy, every policy. |

## Install

```bash
npx -y pii-scrubber-mcp
```

Or globally:

```bash
npm install -g pii-scrubber-mcp
```

## Client configuration

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "pii-scrubber": {
      "command": "npx",
      "args": ["-y", "pii-scrubber-mcp"]
    }
  }
}
```

### Cursor

`~/.cursor/mcp.json` (or project-local `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pii-scrubber": {
      "command": "npx",
      "args": ["-y", "pii-scrubber-mcp"]
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
          "args": ["-y", "pii-scrubber-mcp"]
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
    "pii-scrubber": {
      "command": "npx",
      "args": ["-y", "pii-scrubber-mcp"]
    }
  }
}
```

## Usage examples

> *"Scrub this support ticket transcript before I paste it into a public Slack channel."*

> *"Check whether this `~/Documents/policy-draft.pdf` would pass HIPAA Safe Harbor — redact anything that wouldn't."*

> *"Replace every email in this log with a deterministic hash so I can still join records later."*

> *"Find every secret in this paste — AWS keys, JWTs, anything that looks high-entropy."*

## Strategies in detail

| Strategy | Example output for `alice.doe@example.com` |
|---|---|
| `mask` | `a*********@example.com` |
| `replace` | `[EMAIL]` |
| `hash` | `[EMAIL:9f8d24a31e7a9b22]` (deterministic with optional `hashSalt`) |
| `fake` | `alex.stone@example.com` (stable per-input synthetic — pipelines can still join) |
| `remove` | *(empty)* |

`mask` preserves visible structure where useful — credit cards keep the last 4, IBANs keep first 4 / last 2, phones keep first 2 / last 2.

## Policy presets

| Policy | Forbids |
|---|---|
| `hipaa` | email · phone · ssn · address · dob · credit_card · ipv4 · ipv6 · mac_address |
| `gdpr` | email · phone · address · ipv4 · ipv6 · mac_address · dob · iban |
| `pci` | credit_card (Luhn-validated) |
| `strict` | every detector |
| `safe-share` | email · phone · address · credit_card · iban · ssn |

`policy_check` returns `pass: true` when no forbidden type is present at or above the configured `minConfidence`.

## Local development

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
node dist/index.js   # runs the stdio server (pair with the MCP Inspector to drive it)
```

### Testing the stdio handshake

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' | node dist/index.js
```

## Docker

```bash
docker build -t pii-scrubber-mcp .
docker run --rm -i pii-scrubber-mcp
```

## Tool reference

### `scan_text`

```ts
{
  text: string,
  types?: PiiType[],
  minConfidence?: number      // default 0.5
}
```

Returns `{ matches: Match[], summary: { total, byType } }`.

### `redact_text`

```ts
{
  text: string,
  strategy?: "mask" | "replace" | "hash" | "fake" | "remove",  // default "replace"
  types?: PiiType[],
  perType?: Partial<Record<PiiType, Strategy>>,                // overrides `strategy`
  minConfidence?: number,
  hashSalt?: string                                            // used by hash + fake
}
```

Returns `{ redactedText, matches }`.

### `redact_file`

Same as `redact_text` but `text` is replaced with `{ source: "path" | "base64", value, format? }`.

### `policy_check`

```ts
{
  text: string,
  policy: "hipaa" | "gdpr" | "pci" | "strict" | "safe-share",
  minConfidence?: number
}
```

Returns `{ policy, description, pass, violationCount, violationsByType, violations, recommendation }`.

### `list_detectors`

No arguments. Returns `{ detectors, strategies, policies }`.

## Limitations

- **Heuristic, not magic.** Detection is regex- and entropy-based — fast, deterministic, but not a substitute for a managed DLP system on truly sensitive data. Tune `minConfidence` and `types` for your context.
- **No OCR.** Image-only PDFs need an OCR step before scrubbing.
- **English-biased.** Addresses and DOB labels are tuned for English; structured PII (emails, cards, tokens) is language-independent.
- **No image redaction.** Faces, license plates and signatures are out of scope.

## License

MIT — © Yashvi Bhandik
