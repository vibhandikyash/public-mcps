import { extractContact, type Contact } from "../extractors/contact.js";
import { splitSections } from "../extractors/sections.js";
import { extractSkills } from "../extractors/skills.js";
import { extractDateRange, type DateRange } from "../extractors/dates.js";
import { normalizeText } from "./text.js";

export interface ParsedResume {
  contact: Contact;
  summary?: string;
  skills: string[];
  tools: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  rawText: string;
  sections: Record<string, string>;
}

export interface ExperienceEntry {
  title?: string;
  company?: string;
  dates?: DateRange;
  bullets: string[];
}

export interface EducationEntry {
  institution?: string;
  degree?: string;
  field?: string;
  dates?: DateRange;
  details: string[];
}

export interface ProjectEntry {
  name?: string;
  description?: string;
  bullets: string[];
}

export function parseResumeText(rawText: string): ParsedResume {
  const text = normalizeText(rawText);
  const contact = extractContact(text);
  const sections = splitSections(text);
  const skillsSource = [sections.skills ?? "", text].join("\n");
  const { skills, tools } = extractSkills(skillsSource);
  const summary = sections.summary?.trim();
  const experience = parseExperience(sections.experience ?? "");
  const education = parseEducation(sections.education ?? "");
  const projects = parseProjects(sections.projects ?? "");
  const certifications = parseCertifications(sections.certifications ?? "");

  const otherSections: Record<string, string> = { ...sections.other };
  for (const k of ["summary","experience","education","skills","projects","certifications","awards","publications"] as const) {
    const v = (sections as any)[k];
    if (v && k !== "summary") otherSections[k] = v;
  }

  return {
    contact,
    summary,
    skills,
    tools,
    experience,
    education,
    projects,
    certifications,
    rawText: text,
    sections: otherSections,
  };
}

function parseExperience(block: string): ExperienceEntry[] {
  if (!block.trim()) return [];
  const entries: ExperienceEntry[] = [];
  const chunks = splitByBlankLines(block);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const dateLineIdx = lines.findIndex((l) => extractDateRange(l));
    const headerLines = dateLineIdx >= 0 ? lines.slice(0, dateLineIdx + 1) : lines.slice(0, 2);
    const bulletLines = lines.slice(headerLines.length).filter((l) => /^[-•*▪◦]/.test(l) || l.length > 20);

    const dates = headerLines.map(extractDateRange).find(Boolean);
    const headerText = headerLines.join(" • ");
    const { title, company } = splitTitleCompany(headerText);

    entries.push({
      title,
      company,
      dates,
      bullets: bulletLines.map((l) => l.replace(/^[-•*▪◦]\s*/, "").trim()).filter(Boolean),
    });
  }
  return entries;
}

function parseEducation(block: string): EducationEntry[] {
  if (!block.trim()) return [];
  const entries: EducationEntry[] = [];
  const chunks = splitByBlankLines(block);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const dates = lines.map(extractDateRange).find(Boolean);
    const first = lines[0] ?? "";
    const second = lines[1] ?? "";
    const { institution, degree, field } = splitInstitutionDegree(first, second);
    entries.push({
      institution,
      degree,
      field,
      dates,
      details: lines.slice(2),
    });
  }
  return entries;
}

function parseProjects(block: string): ProjectEntry[] {
  if (!block.trim()) return [];
  const entries: ProjectEntry[] = [];
  const chunks = splitByBlankLines(block);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const [head, ...rest] = lines;
    const bulletLines = rest.filter((l) => /^[-•*▪◦]/.test(l) || l.length > 20);
    entries.push({
      name: head.split(/[—–-]| - /)[0]?.trim(),
      description: rest.find((l) => !/^[-•*▪◦]/.test(l)),
      bullets: bulletLines.map((l) => l.replace(/^[-•*▪◦]\s*/, "").trim()),
    });
  }
  return entries;
}

function parseCertifications(block: string): string[] {
  if (!block.trim()) return [];
  return block
    .split("\n")
    .map((l) => l.replace(/^[-•*▪◦]\s*/, "").trim())
    .filter(Boolean);
}

function splitByBlankLines(block: string): string[] {
  return block
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitTitleCompany(line: string): { title?: string; company?: string } {
  const parts = line.split(/\s+(?:@|at|·|•|—|–|\|)\s+/i);
  if (parts.length >= 2) return { title: parts[0]?.trim(), company: parts[1]?.trim() };
  const commaParts = line.split(/,\s+/);
  if (commaParts.length >= 2) return { title: commaParts[0]?.trim(), company: commaParts[1]?.trim() };
  return { title: line.trim() };
}

function splitInstitutionDegree(first: string, second: string): { institution?: string; degree?: string; field?: string } {
  const degreeRe = /\b(b\.?s\.?|b\.?a\.?|bachelor|master|m\.?s\.?|m\.?a\.?|mba|ph\.?d\.?|associate|diploma)\b/i;
  if (degreeRe.test(first)) {
    return { degree: first, institution: second || undefined, field: extractField(first) };
  }
  if (degreeRe.test(second)) {
    return { institution: first, degree: second, field: extractField(second) };
  }
  return { institution: first, degree: second || undefined };
}

function extractField(degree: string): string | undefined {
  const m = degree.match(/\bin\s+(.+?)(?:,|$)/i);
  return m?.[1]?.trim();
}
