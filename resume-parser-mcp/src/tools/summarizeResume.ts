import { z } from "zod";
import { parseResumeText } from "../parsers/resume.js";

export const summarizeResumeInputShape = {
  text: z.string().min(1).describe("Resume text"),
  maxWords: z.number().int().min(20).max(400).default(120).describe("Soft cap on summary length"),
};

const InputSchema = z.object(summarizeResumeInputShape);

export function summarizeResumeTool(input: z.infer<typeof InputSchema>) {
  const parsed = parseResumeText(input.text);
  const yearsOfExperience = estimateYears(parsed);
  const headline = parsed.experience[0]?.title;
  const company = parsed.experience[0]?.company;
  const topSkills = [...parsed.skills, ...parsed.tools].slice(0, 8);

  const sentences: string[] = [];
  if (parsed.contact.name) {
    sentences.push(
      `${parsed.contact.name}${headline ? ` is a ${headline}` : ""}${company ? ` at ${company}` : ""}.`
    );
  } else if (headline) {
    sentences.push(`Candidate working as ${headline}${company ? ` at ${company}` : ""}.`);
  }
  if (yearsOfExperience) {
    sentences.push(`Approximately ${yearsOfExperience} years of relevant experience.`);
  }
  if (topSkills.length) {
    sentences.push(`Core stack: ${topSkills.join(", ")}.`);
  }
  if (parsed.education[0]) {
    const e = parsed.education[0];
    const parts = [e.degree, e.institution].filter(Boolean);
    if (parts.length) sentences.push(`Education: ${parts.join(", ")}.`);
  }
  if (parsed.summary) {
    sentences.push(parsed.summary);
  }

  const summary = capWords(sentences.filter(Boolean).join(" "), input.maxWords);
  return { summary, yearsOfExperience };
}

function estimateYears(parsed: ReturnType<typeof parseResumeText>): number | undefined {
  const ranges = parsed.experience.map((e) => e.dates).filter(Boolean) as NonNullable<typeof parsed.experience[number]["dates"]>[];
  if (!ranges.length) return undefined;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  let totalMonths = 0;
  for (const r of ranges) {
    if (!r.startYear) continue;
    const startY = r.startYear;
    const startM = r.startMonth ?? 1;
    const endY = r.current ? currentYear : (r.endYear ?? startY);
    const endM = r.current ? currentMonth : (r.endMonth ?? 12);
    const months = (endY - startY) * 12 + (endM - startM);
    if (months > 0) totalMonths += months;
  }
  return Math.round((totalMonths / 12) * 10) / 10;
}

function capWords(s: string, max: number): string {
  const words = s.split(/\s+/);
  if (words.length <= max) return s.trim();
  return words.slice(0, max).join(" ").trim() + "…";
}
