import { describe, it, expect } from "vitest";
import { parseConventional, groupForType } from "../src/git/conventional.js";

describe("parseConventional", () => {
  it("parses type, scope, description", () => {
    const c = parseConventional("feat(api): add /healthcheck endpoint");
    expect(c.type).toBe("feat");
    expect(c.scope).toBe("api");
    expect(c.breaking).toBe(false);
    expect(c.description).toBe("add /healthcheck endpoint");
  });

  it("flags breaking changes via the bang marker", () => {
    const c = parseConventional("feat!: drop Node 18 support");
    expect(c.type).toBe("feat");
    expect(c.breaking).toBe(true);
  });

  it("flags breaking changes via the BREAKING CHANGE footer", () => {
    const c = parseConventional("refactor(db): rename users.name -> users.full_name", "BREAKING CHANGE: column renamed.");
    expect(c.breaking).toBe(true);
  });

  it("returns the whole subject as description for non-conventional commits", () => {
    const c = parseConventional("update readme");
    expect(c.type).toBeUndefined();
    expect(c.description).toBe("update readme");
  });
});

describe("groupForType", () => {
  it("routes feat/fix to their own groups", () => {
    expect(groupForType("feat", false)).toBe("feat");
    expect(groupForType("fix", false)).toBe("fix");
  });

  it("routes breaking changes to the breaking group regardless of type", () => {
    expect(groupForType("feat", true)).toBe("breaking");
    expect(groupForType("chore", true)).toBe("breaking");
  });

  it("falls back to 'other'", () => {
    expect(groupForType(undefined, false)).toBe("other");
    expect(groupForType("misc", false)).toBe("other");
  });
});
