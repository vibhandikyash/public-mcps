export function logError(...args: unknown[]): void {
  process.stderr.write(args.map(String).join(" ") + "\n");
}

export function logWarn(...args: unknown[]): void {
  process.stderr.write("[warn] " + args.map(String).join(" ") + "\n");
}
