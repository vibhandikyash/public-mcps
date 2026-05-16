import type { Match, ScanOptions } from "./types.js";
import { detectorsFor } from "../detectors/index.js";

/**
 * Run every requested detector and return de-overlapped matches sorted by start offset.
 * Overlap rules:
 *   - Highest confidence wins.
 *   - Tie-break: longer span wins.
 *   - Further tie-break: earlier detector in the registry wins (more specific types).
 */
export function scan(text: string, opts: ScanOptions = {}): Match[] {
  const minConfidence = opts.minConfidence ?? 0.5;
  const detectors = detectorsFor(opts.types);

  const all: Match[] = [];
  for (let i = 0; i < detectors.length; i++) {
    for (const m of detectors[i].detect(text)) {
      if (m.confidence < minConfidence) continue;
      // Stash registry priority on a sortable field.
      (m as any).__priority = i;
      all.push(m);
    }
  }

  all.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    const la = a.end - a.start;
    const lb = b.end - b.start;
    if (la !== lb) return lb - la;
    return ((a as any).__priority ?? 0) - ((b as any).__priority ?? 0);
  });

  const kept: Match[] = [];
  for (const m of all) {
    const overlap = kept.find((k) => m.start < k.end && k.start < m.end);
    if (!overlap) {
      kept.push(m);
      continue;
    }
    if (shouldReplace(m, overlap)) {
      const idx = kept.indexOf(overlap);
      kept[idx] = m;
    }
  }

  kept.sort((a, b) => a.start - b.start);
  for (const m of kept) delete (m as any).__priority;
  return kept;
}

function shouldReplace(candidate: Match, incumbent: Match): boolean {
  if (candidate.confidence !== incumbent.confidence) {
    return candidate.confidence > incumbent.confidence;
  }
  const lc = candidate.end - candidate.start;
  const li = incumbent.end - incumbent.start;
  if (lc !== li) return lc > li;
  return ((candidate as any).__priority ?? 0) < ((incumbent as any).__priority ?? 0);
}
