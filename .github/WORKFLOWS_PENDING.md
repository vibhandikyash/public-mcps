# CI workflows pending

`.github/workflows/ci.yml` and `.github/workflows/publish.yml` exist locally in this repo but are **not yet tracked on the remote**, because pushing them requires the `workflow` OAuth scope on the GitHub token.

To restore them, in a real terminal (not the `!` shortcut):

```bash
gh auth refresh -s workflow
git add .github/workflows/ci.yml .github/workflows/publish.yml
git commit -m "Add CI workflows"
git push
```

The two workflows are:
- `ci.yml` — matrix of `{resume-parser-mcp, git-insights-mcp}` × `{Node 20, Node 22}`, runs `lint + typecheck + test + build` on every push/PR.
- `publish.yml` — triggers on tags `<pkg>@x.y.z`, verifies the tag matches package.json, runs the full suite, and `npm publish --access public --provenance`.
