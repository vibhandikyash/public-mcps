# TODO — getting these MCPs into the community's hands

The code is done and committed locally. What's left is publish, distribute, and iterate.

## Ship

### 1. Push the repo to GitHub

```bash
gh repo create vibhandikyash/public-mcps --public --source=. --push --description "Two public MCP servers: resume-parser-mcp and git-insights-mcp"
```

If `gh` isn't authenticated yet: `gh auth login`.

### 2. Reserve the npm package names

Check availability:

```bash
npm view resume-parser-mcp || echo "available"
npm view git-insights-mcp  || echo "available"
npm view pii-scrubber-mcp  || echo "available"
```

If any name is taken, fall back to `@vibhandikyash/<name>` and update the matching `package.json` accordingly.

### 3. Wire up npm publishing

- Generate an automation-scoped npm token at https://www.npmjs.com/settings/vibhandikyash/tokens
- Add it as a repo secret: `gh secret set NPM_TOKEN`
- Cut the first release of each package by tagging from `main`:

```bash
git tag resume-parser-mcp@0.1.0
git tag git-insights-mcp@0.1.0
git tag pii-scrubber-mcp@0.1.0
git push --tags
```

The `publish.yml` workflow picks up tags matching `<pkg>@x.y.z`, verifies the tag matches `package.json`, runs lint/typecheck/test/build, and publishes with provenance.

### 4. Verify the npm install path

After publish, test the published artefacts the way a user would:

```bash
npx -y resume-parser-mcp < /dev/null   # should print nothing, exit when stdin closes
npx -y git-insights-mcp  < /dev/null
npx -y pii-scrubber-mcp  < /dev/null
```

Then plug the `npx` invocation into Claude Desktop / Cursor (snippets in each package's README) and run a real query to confirm end-to-end.

## Distribute

### 5. Submit to awesome-mcp-servers

The two main community-curated lists. Submit a PR to each once the npm packages are live.

- https://github.com/punkpeye/awesome-mcp-servers
- https://github.com/appcypher/awesome-mcp-servers

Suggested entry shape (match the surrounding format in each list):

```md
- [resume-parser-mcp](https://github.com/vibhandikyash/public-mcps/tree/main/resume-parser-mcp) — Parse PDF/DOCX/text resumes to structured JSON, extract skills, and score against job descriptions.
- [git-insights-mcp](https://github.com/vibhandikyash/public-mcps/tree/main/git-insights-mcp) — Local-git analytics: contributors, file churn, ownership maps, conventional-commit changelogs.
- [pii-scrubber-mcp](https://github.com/vibhandikyash/public-mcps/tree/main/pii-scrubber-mcp) — Detect and redact PII (emails, phones, cards, SSNs, API keys, more) with HIPAA / GDPR / PCI policy presets.
```

### 6. List on smithery.ai

https://smithery.ai/new — one listing per package, point at the GitHub repo. Smithery generates a hosted install button and tracks usage analytics.

### 7. Announce

- A short post on r/mcp, r/ClaudeAI, or HN Show — each one focusing on the *specific* user pain (recruiters tab-switching from Claude to ATS; engineers asking "who owns this file?")
- An X/LinkedIn post with a screen-recording of one tool in Claude Desktop is worth ten "I built an MCP server" tweets

## Iterate (next-version backlog)

### resume-parser-mcp

- **OCR fallback for image-only PDFs** — pipe through `tesseract.js` when `pdf-parse` extracts < N chars
- **LinkedIn URL → fetch + parse** — convenience tool for recruiters who paste profile links
- **Confidence scores per field** — flag when contact extraction is unsure rather than silently returning the wrong line as a name
- **More skill aliases** — `node`/`nodejs`/`node.js` should all collapse; `k8s` ↔ `Kubernetes`; LLM-era terms (`vLLM`, `Triton`, `vector DB`, `RAG`)
- **Multilingual support** — section headings in German / French / Hindi etc.

### git-insights-mcp

- **`co_change_map`** — file pairs that change together (Michael Feathers / Adam Tornhill style). Surfaces hidden coupling.
- **`bus_factor`** — knowledge concentration risk per directory
- **`stale_files`** — files untouched in N months, ranked by lines of code (rot indicator)
- **`commit_pace`** — daily/weekly commit cadence over time, with anomaly callouts
- **GitHub PR data** — optional `GITHUB_TOKEN` to enrich commits with PR titles / reviewers / merge times

### Shared

- **Server-side / Streamable HTTP transport** — for hosted deployments where users don't want a local Node process
- **`smithery.yaml`** for Smithery's hosted publish
- **Release-please** or **changesets** for automated changelogs on these packages themselves (eat our own dogfood for `git-insights-mcp`)
- **Telemetry-free** — keep it. No analytics, no phone-home. State this explicitly in the README.

## Definition of done

- [ ] Repo public on GitHub at `vibhandikyash/public-mcps`
- [ ] All three packages published on npm
- [ ] `npx -y resume-parser-mcp` runs from a clean machine
- [ ] `npx -y git-insights-mcp` runs from a clean machine
- [ ] `npx -y pii-scrubber-mcp` runs from a clean machine
- [ ] CI green on `main`
- [ ] Listed in at least one `awesome-mcp-servers` repo
- [ ] One screen-recorded demo published to a public channel
