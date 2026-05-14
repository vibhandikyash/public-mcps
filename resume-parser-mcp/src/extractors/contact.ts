export interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links: string[];
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g;
const PHONE_RE = /\+?\d[\d\s.\-()]{6,18}\d/g;
const URL_RE = /\bhttps?:\/\/[^\s)<>]+/gi;
const HANDLE_RE = /\b(?:github|gitlab|bitbucket|linkedin)\.com\/[A-Za-z0-9_\-./]+/gi;

export function extractContact(text: string): Contact {
  const emails = text.match(EMAIL_RE) ?? [];
  const phones = text.match(PHONE_RE) ?? [];
  const urls = new Set<string>();
  for (const m of text.match(URL_RE) ?? []) urls.add(stripTrailingPunct(m));
  for (const m of text.match(HANDLE_RE) ?? []) urls.add("https://" + stripTrailingPunct(m));

  const name = guessName(text);
  const location = guessLocation(text);

  return {
    name,
    email: emails[0],
    phone: phones.find((p) => p.replace(/\D/g, "").length >= 7),
    location,
    links: Array.from(urls),
  };
}

function stripTrailingPunct(s: string): string {
  return s.replace(/[.,;:)\]>]+$/g, "");
}

function guessName(text: string): string | undefined {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.length > 60) continue;
    if (EMAIL_RE.test(line) || /\d/.test(line)) {
      EMAIL_RE.lastIndex = 0;
      continue;
    }
    EMAIL_RE.lastIndex = 0;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    const looksLikeName = words.every((w) => /^[A-Z][a-zA-Z'’.\-]+$/.test(w));
    if (looksLikeName) return line;
  }
  return undefined;
}

const LOCATION_HINTS = /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?,\s?[A-Z]{2,}(?:\s\d{4,6})?)\b/;

function guessLocation(text: string): string | undefined {
  const head = text.split("\n").slice(0, 12).join("\n");
  const m = head.match(LOCATION_HINTS);
  return m?.[1];
}
