// Use ASCII unit separators for fields and record separators for entries.
// These almost never appear in commit metadata so they make parsing cheap and reliable.
export const FIELD_SEP = "";
export const RECORD_SEP = "";

// Format string for `git log --pretty=format:`. RECORD_SEP is placed at the START of each commit
// so that `--numstat` output (which git appends AFTER the format string) ends up inside its own
// commit's record when we split, instead of bleeding into the next one.
export const LOG_FORMAT = RECORD_SEP + ["%H", "%an", "%ae", "%aI", "%s", "%b"].join(FIELD_SEP);

export interface RawCommit {
  hash: string;
  authorName: string;
  authorEmail: string;
  date: string;
  subject: string;
  body: string;
}

export interface CommitWithStats extends RawCommit {
  insertions: number;
  deletions: number;
  files: { path: string; insertions: number; deletions: number }[];
}

export function parseLog(stdout: string): RawCommit[] {
  const out: RawCommit[] = [];
  const records = stdout.split(RECORD_SEP);
  for (const rec of records) {
    if (!rec) continue;
    // The first US-separated chunk on the first line is the hash; the body field
    // can span multiple lines, so we split the record by FIELD_SEP rather than newlines first.
    const [hash, authorName, authorEmail, date, subject, ...rest] = rec.split(FIELD_SEP);
    if (!hash) continue;
    const body = rest.join(FIELD_SEP).replace(/\n+$/, "");
    out.push({ hash, authorName, authorEmail, date, subject, body });
  }
  return out;
}

export function parseLogWithNumstat(stdout: string): CommitWithStats[] {
  const out: CommitWithStats[] = [];
  const records = stdout.split(RECORD_SEP);
  for (const rec of records) {
    if (!rec) continue;
    // The record is `<hash><US><name><US><email><US><date><US><subject><US><body><numstat lines>`.
    // FIELD_SEP doesn't appear inside the body or the numstat output, so splitting once on
    // FIELD_SEP and taking the first 5 fixed fields is safe; everything after is body + numstat.
    const parts = rec.split(FIELD_SEP);
    if (parts.length < 6) continue;
    const [hash, authorName, authorEmail, date, subject] = parts;
    const tail = parts.slice(5).join(FIELD_SEP);
    if (!hash) continue;

    // The body can be multi-line; numstat lines have the shape `<ins>\t<del>\t<path>`. We split
    // off the numstat tail by looking for the LAST run of numstat-shaped lines.
    const tailLines = tail.split("\n");
    const numstatRe = /^(\d+|-)\t(\d+|-)\t.+$/;
    const numstatStart = findNumstatStart(tailLines, numstatRe);
    const body = tailLines.slice(0, numstatStart).join("\n").replace(/\n+$/, "");

    const files: CommitWithStats["files"] = [];
    let insertions = 0;
    let deletions = 0;
    for (const line of tailLines.slice(numstatStart)) {
      const m = line.match(numstatRe);
      if (!m) continue;
      const ins = m[1] === "-" ? 0 : parseInt(m[1], 10);
      const del = m[2] === "-" ? 0 : parseInt(m[2], 10);
      const path = line.split("\t")[2];
      files.push({ path, insertions: ins, deletions: del });
      insertions += ins;
      deletions += del;
    }

    out.push({ hash, authorName, authorEmail, date, subject, body, insertions, deletions, files });
  }
  return out;
}

function findNumstatStart(lines: string[], re: RegExp): number {
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i;
  }
  return lines.length;
}
