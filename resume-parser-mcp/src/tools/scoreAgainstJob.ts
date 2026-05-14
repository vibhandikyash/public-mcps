import { z } from "zod";
import { extractSkills } from "../extractors/skills.js";

export const scoreAgainstJobInputShape = {
  resume: z.string().min(1).describe("Resume text"),
  jobDescription: z.string().min(1).describe("Job description text"),
};

const InputSchema = z.object(scoreAgainstJobInputShape);

export interface ScoreResult {
  score: number;
  matched: string[];
  missing: string[];
  bonus: string[];
  rationale: string;
}

export function scoreAgainstJobTool(input: z.infer<typeof InputSchema>): ScoreResult {
  const resumeSkills = new Set(
    [...extractSkills(input.resume).skills, ...extractSkills(input.resume).tools].map((s) => s.toLowerCase())
  );
  const jobSkillsArr = [...extractSkills(input.jobDescription).skills, ...extractSkills(input.jobDescription).tools];
  const jobSkillsSet = new Set(jobSkillsArr.map((s) => s.toLowerCase()));

  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of jobSkillsArr) {
    if (resumeSkills.has(skill.toLowerCase())) matched.push(skill);
    else missing.push(skill);
  }
  const bonus: string[] = [];
  const resumeSkillsArr = [...extractSkills(input.resume).skills, ...extractSkills(input.resume).tools];
  for (const skill of resumeSkillsArr) {
    if (!jobSkillsSet.has(skill.toLowerCase())) bonus.push(skill);
  }

  const total = jobSkillsArr.length;
  const score = total === 0 ? 0 : Math.round((matched.length / total) * 100);

  const rationale = buildRationale({ score, matched, missing, bonus, total });

  return { score, matched, missing, bonus, rationale };
}

function buildRationale(p: {
  score: number;
  matched: string[];
  missing: string[];
  bonus: string[];
  total: number;
}): string {
  if (p.total === 0) {
    return "No identifiable technical skills found in the job description; score defaults to 0.";
  }
  const head = `${p.matched.length} of ${p.total} job-description skills matched (${p.score}%).`;
  const parts: string[] = [head];
  if (p.matched.length) parts.push(`Strengths: ${p.matched.slice(0, 8).join(", ")}.`);
  if (p.missing.length) parts.push(`Gaps to consider: ${p.missing.slice(0, 8).join(", ")}.`);
  if (p.bonus.length) parts.push(`Extra skills the candidate brings: ${p.bonus.slice(0, 8).join(", ")}.`);
  return parts.join(" ");
}
