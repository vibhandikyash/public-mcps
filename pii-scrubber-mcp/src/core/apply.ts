import type { Match, RedactOptions, RedactionStrategy } from "./types.js";
import { maskValue } from "../strategies/mask.js";
import { replaceValue } from "../strategies/replace.js";
import { hashValue } from "../strategies/hash.js";
import { fakeValue } from "../strategies/fake.js";
import { removeValue } from "../strategies/remove.js";

export function applyRedactions(text: string, matches: Match[], opts: RedactOptions = {}): string {
  if (matches.length === 0) return text;
  const sorted = [...matches].sort((a, b) => a.start - b.start);

  let out = "";
  let cursor = 0;
  for (const m of sorted) {
    if (m.start < cursor) continue; // overlap guard
    out += text.slice(cursor, m.start);
    out += applyOne(m, opts);
    cursor = m.end;
  }
  out += text.slice(cursor);
  return out;
}

function applyOne(m: Match, opts: RedactOptions): string {
  const strategy: RedactionStrategy = opts.perType?.[m.type] ?? opts.strategy ?? "replace";
  switch (strategy) {
    case "mask":   return maskValue(m);
    case "replace": return replaceValue(m);
    case "hash":   return hashValue(m, opts.hashSalt);
    case "fake":   return fakeValue(m, opts.hashSalt);
    case "remove": return removeValue(m);
  }
}
