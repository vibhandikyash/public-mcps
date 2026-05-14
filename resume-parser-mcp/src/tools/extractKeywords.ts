import { z } from "zod";
import { extractSkills, topKeywords } from "../extractors/skills.js";

export const extractKeywordsInputShape = {
  text: z.string().min(1).describe("Resume or job-description text to analyse"),
  top: z.number().int().min(1).max(200).default(25).describe("Max number of generic keywords to return"),
};

const InputSchema = z.object(extractKeywordsInputShape);

export function extractKeywordsTool(input: z.infer<typeof InputSchema>) {
  const { skills, tools } = extractSkills(input.text);
  const keywords = topKeywords(input.text, input.top);
  return { keywords, skills, tools };
}
