const MONTHS = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const YEAR = "(\\d{4})";
const DATE = `(?:${MONTHS}\\s+${YEAR}|${YEAR})`;
const PRESENT = "(present|current|now|ongoing)";
const SEP = "\\s*(?:-|–|—|to)\\s*";

const RANGE_RE = new RegExp(
  `(?<start>${DATE})${SEP}(?<end>${DATE}|${PRESENT})`,
  "i"
);

export interface DateRange {
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  current?: boolean;
  raw: string;
}

export function extractDateRange(line: string): DateRange | undefined {
  const m = line.match(RANGE_RE);
  if (!m || !m.groups) return undefined;
  const start = parseDate(m.groups.start);
  const endRaw = m.groups.end ?? "";
  const isPresent = /present|current|now|ongoing/i.test(endRaw);
  const end = isPresent ? {} : parseDate(endRaw);
  return {
    startYear: start?.year,
    startMonth: start?.month,
    endYear: end?.year,
    endMonth: end?.month,
    current: isPresent,
    raw: m[0],
  };
}

function parseDate(s: string): { year?: number; month?: number } | undefined {
  if (!s) return undefined;
  const monthMatch = s.match(new RegExp(MONTHS, "i"));
  const yearMatch = s.match(/\d{4}/);
  return {
    year: yearMatch ? Number(yearMatch[0]) : undefined,
    month: monthMatch ? monthToNumber(monthMatch[0]) : undefined,
  };
}

function monthToNumber(m: string): number {
  const key = m.slice(0, 3).toLowerCase();
  return ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(key) + 1;
}
