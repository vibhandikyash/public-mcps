export interface ConventionalCommit {
  type?: string;
  scope?: string;
  breaking: boolean;
  description: string;
}

// Conventional commits spec: `type(scope)!?: description`
const RE = /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<desc>.+)$/;

export function parseConventional(subject: string, body = ""): ConventionalCommit {
  const m = subject.match(RE);
  if (!m || !m.groups) {
    return { breaking: /BREAKING[ -]CHANGE/i.test(body), description: subject };
  }
  const breaking = Boolean(m.groups.bang) || /BREAKING[ -]CHANGE/i.test(body);
  return {
    type: m.groups.type.toLowerCase(),
    scope: m.groups.scope?.trim(),
    breaking,
    description: m.groups.desc.trim(),
  };
}

export const CHANGELOG_GROUPS: { key: string; title: string; types: string[] }[] = [
  { key: "breaking", title: "Breaking changes", types: [] },
  { key: "feat",     title: "Features",          types: ["feat", "feature"] },
  { key: "fix",      title: "Bug fixes",         types: ["fix", "bugfix"] },
  { key: "perf",     title: "Performance",       types: ["perf"] },
  { key: "refactor", title: "Refactoring",       types: ["refactor"] },
  { key: "docs",     title: "Documentation",     types: ["docs", "doc"] },
  { key: "test",     title: "Tests",             types: ["test", "tests"] },
  { key: "build",    title: "Build & tooling",   types: ["build", "ci", "chore"] },
  { key: "other",    title: "Other changes",     types: [] },
];

export function groupForType(type: string | undefined, breaking: boolean): string {
  if (breaking) return "breaking";
  if (!type) return "other";
  for (const g of CHANGELOG_GROUPS) {
    if (g.types.includes(type.toLowerCase())) return g.key;
  }
  return "other";
}
