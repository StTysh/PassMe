import { companyResolutionSchema } from "@/lib/types/domain";
import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

export function buildResolveCompanyPrompt(
  companyName: string,
  jobTitle: string,
  jobDescriptionSnippet?: string,
): PromptDefinition<typeof companyResolutionSchema> {
  const systemInstruction = jsonOnlyInstruction(
    "You are a company entity resolver. Given a company name (which may be ambiguous, abbreviated, misspelled, or could refer to multiple entities), identify the most likely real company the user means. Return a structured result with the top match, any alternative matches, and whether the result is ambiguous. Be honest about confidence — do not fake high confidence when you're unsure.",
  );

  const userPrompt = joinPromptSections(
    `Resolve this company name: "${companyName}"`,
    jobTitle ? `The user is applying for a "${jobTitle}" position there.` : null,
    jobDescriptionSnippet
      ? `Context from their job description:\n${jobDescriptionSnippet.slice(0, 500)}`
      : null,
    joinPromptSections(
      "For the TOP MATCH, provide:",
      "- name: the official/full company name",
      "- industry: their primary industry",
      "- description: 2-3 sentence description of what they do",
      "- headquarters: city/country of HQ",
      "- companySize: approximate (e.g., 'Startup (~50 employees)', 'Large enterprise (100k+)')",
      "- website: their primary domain if known",
      "- confidence: 'high' if you're very sure this is the right company, 'medium' if likely but not certain, 'low' if this is a guess",
      "- disambiguationNote: why this match vs alternatives (e.g., 'This is the tech company, not the insurance company with the same name')",
    ),
    joinPromptSections(
      "For ALTERNATIVES (if the name is ambiguous), provide up to 3 other possible companies with the same fields.",
      "Examples of ambiguity:",
      "- 'Amazon' could mean Amazon.com (e-commerce/cloud) or Amazon (region)",
      "- 'Mercury' could be Mercury Financial, Mercury (banking app), or Mercury Systems (defense)",
      "- 'Apple' is not ambiguous (clear tech company in this context)",
      "- A misspelled name like 'Gogle' should resolve to 'Google' with high confidence",
    ),
    joinPromptSections(
      "Set isAmbiguous to true if:",
      "- Multiple real companies share this name",
      "- The name is very generic (e.g., 'National Solutions')",
      "- You cannot determine which company with >80% certainty",
    ),
    joinPromptSections(
      "Set needsConfirmation to true if:",
      "- confidence is 'medium' or 'low'",
      "- isAmbiguous is true",
      "- The name could plausibly refer to 2+ different companies",
      "Set needsConfirmation to false ONLY when confidence is 'high' AND the company is unambiguous",
    ),
    "Return JSON matching the CompanyResolutionResult schema.",
  );

  return {
    name: "resolveCompany",
    systemInstruction,
    userPrompt,
    responseSchema: companyResolutionSchema,
    temperature: 0.1,
    maxOutputTokens: 4096,
    modelTier: "lite" as const,
  };
}
