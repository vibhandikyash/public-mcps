import type { Match } from "../core/types.js";

export function replaceValue(m: Match): string {
  return `[${m.token}]`;
}
