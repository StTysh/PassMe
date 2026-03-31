import { companyResearchSchema } from "@/lib/types/domain";
import {
  joinPromptSections,
  jsonOnlyInstruction,
  type PromptDefinition,
} from "@/lib/prompts/shared";

export function buildCompanyResearchPrompt(
  companyName: string,
  jobTitle: string,
  jobDescriptionContext?: string,
): PromptDefinition<typeof companyResearchSchema> {
  const systemInstruction = jsonOnlyInstruction(
    `You are a deep company research analyst preparing a comprehensive intelligence brief for interview preparation.

Your job is to produce a structured, honest, and thorough company profile that will be used to:
1. Generate realistic interviewer personas that match this company's culture
2. Build interview questions grounded in the company's actual priorities
3. Help a candidate understand what this company truly cares about

CRITICAL RULES:
- Be SPECIFIC. Generic platitudes like "values innovation and collaboration" are useless. Every company says that. What makes THIS company's culture distinct?
- DISTINGUISH between facts you know with confidence, reasonable inferences, and things you genuinely don't know.
- If you don't know something, say so in the "unknowns" array. Do NOT fabricate specifics.
- Use the "confidenceLevel" field honestly: "high" if you know this company well (major tech companies, large public companies), "medium" for mid-size or less-known companies, "low" if you're largely inferring.
- The output must be detailed enough to create a 30-minute realistic interview simulation.`,
  );

  const userPrompt = joinPromptSections(
    `Research the company "${companyName}" in depth for a candidate applying to the "${jobTitle}" position.`,
    jobDescriptionContext
      ? `Context from the job description:\n---\n${jobDescriptionContext}\n---`
      : null,
    `Produce a comprehensive company research brief with ALL of the following fields:

confirmedName: The official/full company name
industry: Primary industry and sub-sector
summary: 3-5 sentence overview of what the company does, its scale, and market position

coreBusinessModel: How does this company make money? What is the primary business model?
productsAndServices: List their main products, platforms, or service lines (be specific, not generic)
targetMarket: Who are their customers? B2B, B2C, enterprise, SMB, developers, etc.?
positioning: How do they position themselves vs competitors? What's their unique angle?

missionAndValues: What are their stated or evident values? Go beyond generic "innovation" — what specifically do they emphasize?
strategicPriorities: What appears to be their current strategic focus? (e.g., AI integration, international expansion, profitability push)
currentInitiatives: Known current projects, product launches, or strategic bets
recentDirection: Any notable recent pivots, leadership changes, acquisitions, or market moves

hiringCultureSignals: What signals exist about their hiring culture? (e.g., "known for rigorous system design rounds", "emphasizes culture fit heavily", "fast-paced startup mentality")
teamExpectations: What would a team at this company likely expect from a new hire in this role?
interviewStyle: What is their known or likely interview format? (rounds, types of questions, panel vs 1:1, take-home vs live coding, etc.)

roleContribution: How does the "${jobTitle}" role specifically contribute to this company's goals?
likelyCompetencyAreas: What competencies would this company likely test for this role? (be specific to the company, not generic)
likelyConcernsAboutCandidates: What red flags or concerns would interviewers at this company likely have when assessing candidates?

confidenceLevel: "high" if you have strong knowledge of this company, "medium" if reasonable but partially inferred, "low" if mostly inferred
unknowns: List anything you genuinely don't know or had to infer heavily

Also fill these legacy fields for backward compatibility:
values: Array of company values
currentProjects: Array of current projects
goals: Array of company goals
culture: Culture description string
roleContext: Role context string`,
    "Be thorough. This brief directly determines interview quality. A shallow brief produces a generic interview. A deep brief produces a realistic one.",
    "Return JSON matching the CompanyResearch schema.",
  );

  return {
    name: "companyResearch",
    systemInstruction,
    userPrompt,
    responseSchema: companyResearchSchema,
    temperature: 0.3,
    maxOutputTokens: 8192,
  };
}
