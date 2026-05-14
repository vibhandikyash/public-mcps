import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

export interface GitRunOptions {
  cwd: string;
  args: string[];
  maxBuffer?: number;
  input?: string;
}

export interface GitResult {
  stdout: string;
  stderr: string;
  code: number;
}

export class GitError extends Error {
  constructor(message: string, public readonly result: GitResult) {
    super(message);
    this.name = "GitError";
  }
}

const DEFAULT_MAX_BUFFER = 32 * 1024 * 1024; // 32 MiB

export async function runGit(opts: GitRunOptions): Promise<GitResult> {
  return new Promise((resolveP, rejectP) => {
    const child = spawn("git", opts.args, {
      cwd: opts.cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", LC_ALL: "C" },
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    let stdoutSize = 0;
    const limit = opts.maxBuffer ?? DEFAULT_MAX_BUFFER;
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutSize += Buffer.byteLength(chunk, "utf8");
      if (stdoutSize > limit) {
        child.kill("SIGTERM");
        return;
      }
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => { stderr += chunk; });
    child.on("error", rejectP);
    child.on("close", (code) => {
      resolveP({ stdout, stderr, code: code ?? 0 });
    });
    if (opts.input) {
      child.stdin.write(opts.input);
    }
    child.stdin.end();
  });
}

export async function gitOrThrow(opts: GitRunOptions): Promise<string> {
  const r = await runGit(opts);
  if (r.code !== 0) {
    throw new GitError(`git ${opts.args.join(" ")} failed (exit ${r.code}): ${r.stderr.trim() || "no stderr"}`, r);
  }
  return r.stdout;
}

export async function resolveRepoPath(input: string): Promise<string> {
  const abs = resolve(input);
  const s = await stat(abs).catch(() => null);
  if (!s || !s.isDirectory()) {
    throw new Error(`repoPath does not exist or is not a directory: ${abs}`);
  }
  const top = await runGit({ cwd: abs, args: ["rev-parse", "--show-toplevel"] });
  if (top.code !== 0) {
    throw new Error(`Not a git repository: ${abs}`);
  }
  return top.stdout.trim();
}
