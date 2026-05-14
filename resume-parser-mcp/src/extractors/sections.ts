export interface SectionMap {
  summary?: string;
  experience?: string;
  education?: string;
  skills?: string;
  projects?: string;
  certifications?: string;
  awards?: string;
  publications?: string;
  other: Record<string, string>;
}

const HEADING_PATTERNS: Array<{ key: keyof Omit<SectionMap, "other">; re: RegExp }> = [
  { key: "summary",        re: /^(summary|profile|objective|about(?:\s+me)?)\s*$/i },
  { key: "experience",     re: /^(experience|work\s+experience|employment(?:\s+history)?|professional\s+experience|career)\s*$/i },
  { key: "education",      re: /^(education|academic(?:\s+background)?|qualifications)\s*$/i },
  { key: "skills",         re: /^(skills|technical\s+skills|core\s+competencies|tech\s+stack|technologies)\s*$/i },
  { key: "projects",       re: /^(projects|personal\s+projects|side\s+projects|selected\s+projects)\s*$/i },
  { key: "certifications", re: /^(certifications?|licenses?)\s*$/i },
  { key: "awards",         re: /^(awards|honors|achievements)\s*$/i },
  { key: "publications",   re: /^(publications|papers|talks)\s*$/i },
];

export function splitSections(text: string): SectionMap {
  const lines = text.split("\n");
  const result: SectionMap = { other: {} };

  let currentKey: string | null = null;
  let currentIsKnown = false;
  let buf: string[] = [];

  const flush = () => {
    if (!currentKey) return;
    const body = buf.join("\n").trim();
    if (!body) return;
    if (currentIsKnown) {
      (result as any)[currentKey] = body;
    } else {
      result.other[currentKey] = body;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      buf.push("");
      continue;
    }
    const matched = matchHeading(line);
    if (matched) {
      flush();
      currentKey = matched;
      currentIsKnown = true;
      buf = [];
      continue;
    }
    if (looksLikeUnknownHeading(line)) {
      flush();
      currentKey = line.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      currentIsKnown = false;
      buf = [];
      continue;
    }
    buf.push(rawLine);
  }
  flush();
  return result;
}

function matchHeading(line: string): keyof Omit<SectionMap, "other"> | null {
  for (const { key, re } of HEADING_PATTERNS) {
    if (re.test(line)) return key;
  }
  return null;
}

function looksLikeUnknownHeading(line: string): boolean {
  if (line.length > 40) return false;
  if (/[.:!?]$/.test(line)) return false;
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-Z]/g, "");
  return upper.length / letters.length >= 0.6;
}
