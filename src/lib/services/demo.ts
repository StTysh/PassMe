import { getSqliteClient } from "@/db/client";
import { DEMO_PROFILE_NAME } from "@/lib/constants";
import { applyInterestLevel, getPersonaByKey } from "@/lib/personas/defaults";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { profilesRepo } from "@/lib/repositories/profilesRepo";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

const demoResumeText = `
Alex Morgan is a product manager focused on AI-powered internal tools and platform products.
Led cross-functional launches across ML, platform, and enterprise workflow initiatives.
Improved activation by 18 percent and reduced ops handling time by 32 percent.
Partnered with engineering, design, sales, and support to prioritize roadmap tradeoffs.
`.trim();

const demoJobText = `
Senior Product Manager, AI Platform.
Own platform roadmap, partner with engineering leadership, define success metrics, and drive adoption.
Must have experience with platform strategy, technical fluency, and stakeholder management.
Preferred background in AI or ML-enabled products.
`.trim();

export function ensureDemoData() {
  ensureDatabaseReady();

  const profile =
    profilesRepo.listProfiles().find((item) => item.fullName === DEMO_PROFILE_NAME) ??
    profilesRepo.createProfile({
      fullName: DEMO_PROFILE_NAME,
      headline: "Senior Product Manager, AI products",
      email: "alex@example.com",
      yearsExperience: 8,
      targetRoles: ["Senior Product Manager", "AI Platform PM"],
      primaryDomain: "AI products",
      notes: "Seeded demo profile.",
    });

  if (!profile) {
    return;
  }

  const resume =
    documentsRepo
      .listDocumentsForProfile(profile.id, "resume")
      .find((item) => item.title === "Alex Morgan Resume") ??
    documentsRepo.createDocument({
      candidateProfileId: profile.id,
      type: "resume",
      title: "Alex Morgan Resume",
      rawText: demoResumeText,
    });
  if (resume && !resume.parsedJson) {
    documentsRepo.updateParsedDocument(resume.id, {
      professionalSummary: "AI-focused product manager with platform and operations experience.",
      roles: [
        {
          company: "Demo Company",
          title: "Senior Product Manager",
          achievements: [
            "Improved activation by 18 percent.",
            "Reduced ops handling time by 32 percent.",
          ],
          responsibilities: ["Owned AI platform roadmap", "Aligned cross-functional partners"],
          skillsUsed: ["product strategy", "experimentation", "stakeholder management"],
        },
      ],
      skills: ["AI products", "platform strategy", "roadmapping"],
      education: [],
      metrics: ["18 percent activation uplift", "32 percent ops reduction"],
      leadershipSignals: ["cross-functional leadership", "prioritization"],
      domainKeywords: ["AI", "platform", "operations"],
    });
  }

  const job =
    documentsRepo
      .listDocumentsForProfile(profile.id, "job_description")
      .find((item) => item.title === "Senior Product Manager, AI Platform") ??
    documentsRepo.createDocument({
      candidateProfileId: profile.id,
      type: "job_description",
      title: "Senior Product Manager, AI Platform",
      rawText: demoJobText,
    });
  if (job && !job.parsedJson) {
    documentsRepo.updateParsedDocument(job.id, {
      titleGuess: "Senior Product Manager, AI Platform",
      seniority: "senior",
      coreCompetencies: ["platform strategy", "stakeholder management", "execution"],
      mustHaveSkills: ["platform roadmap", "technical fluency", "adoption metrics"],
      niceToHaveSkills: ["AI/ML product experience"],
      likelyInterviewThemes: ["ownership", "tradeoffs", "platform impact"],
      hiddenSignals: ["clarity", "execution"],
      likelyConcerns: ["technical depth"],
    });
  }

  const personas = personasRepo.listPersonas();
  const skeptical = personas.find((persona) => persona.key === "skeptical_manager");
  if (!skeptical || !job) {
    return;
  }

  const existingDemoSession = interviewsRepo
    .listSessionsForProfile(profile.id)
    .find((session) => session.status === "completed");

  if (existingDemoSession) {
    return;
  }

  const personaConfig = applyInterestLevel(getPersonaByKey("skeptical_manager")!, "medium");
  const demoPanel = [
    {
      key: "interviewer_1",
      name: "Marcus Webb",
      ageRange: "42-46",
      role: "Hiring Manager",
      department: "Product",
      seniorityLevel: "Director",
      yearsExperience: 15,
      educationBackground: "MBA at Kellogg, BS Computer Science at Georgia Tech",
      careerPath: "Started as a software engineer, moved into product at a Series B startup, then led product at two mid-stage companies before joining here.",
      companyTenure: "4 years",
      gender: "male" as const,
      hiringPriorities: ["ownership", "evidence of impact", "clear thinking"],
      interviewPhilosophy: "Believes the best signal comes from how candidates describe failures and tradeoffs, not rehearsed success stories.",
      biggestConcerns: ["candidates who can't quantify their impact", "lack of ownership clarity"],
      whatTheyValueMost: "Intellectual honesty and the ability to separate signal from noise",
      whatFrustratesThem: "Buzzword-heavy answers with no substance behind them",
      strongAnswerDefinition: "Specific, structured, includes the 'why' behind decisions and measurable outcomes",
      domainExpertise: ["AI products", "platform strategy", "B2B SaaS"],
      decisionMakingStyle: "Data-informed but trusts pattern recognition from experience",
      riskTolerance: "Moderate — prefers calculated bets over blind optimism",
      warmth: 40,
      formalityLevel: "Professional but direct — no small talk padding",
      directnessLevel: "High — will ask 'why?' multiple times",
      patienceLevel: "Moderate — gives candidates room but redirects quickly if they're rambling",
      listeningStyle: "Intense focus, brief nods, takes mental notes",
      conversationPace: "Measured — deliberate pauses to let weight of questions land",
      interruptionTendency: "Will interrupt if the answer is going off-track",
      followUpStyle: "Asks increasingly specific questions — 'What specifically did you do?' 'What was the metric?'",
      vagueAnswerReaction: "Pauses, then asks for a concrete example with numbers",
      challengeApproach: "Direct pushback: 'That sounds good on paper, but how did it actually play out?'",
      preferredAnswerStructure: "Situation, action, measurable result",
      challengeStyle: "sharp" as const,
      personalityTraits: ["analytical", "direct", "fair-minded", "quietly intense"],
      hobbies: ["chess", "long-distance cycling"],
      interests: ["behavioral economics", "systems thinking"],
      senseOfHumor: "Dry and understated — occasional wry observation",
      energyLevel: "Calm but alert — nothing escapes his attention",
      values: ["intellectual honesty", "craftsmanship", "accountability"],
      smallPersonalHabits: ["always has a black coffee", "tends to lean back in his chair when thinking"],
      introStyleInRealLife: "Firm handshake, direct eye contact, gets to the point quickly but respectfully",
      introStyle: "Introduces himself by name and role, briefly explains what he's looking for, then transitions directly to the first question",
      smallTalkTendency: "Minimal — one or two warm sentences before getting started",
      startBroadOrSpecific: "Starts broad ('walk me through your background'), then quickly narrows to specifics",
      questionPreference: "Behavioral with an emphasis on outcomes and tradeoffs",
      followUpLogic: "Always follows up on claims of impact — wants the specific numbers",
      escalationLogic: "If initial answers are strong, increases complexity; if weak, probes for clarity",
      topicClosingStyle: "Brief acknowledgment, then moves to next area",
      handoffStyle: "Clean verbal transition",
      focusAreas: ["ownership", "evidence", "tradeoffs", "impact"],
      tone: "direct, sharp, concise",
      personality: "Demanding but fair interviewer who wants proof, ownership, and measurable impact. Respects candidates who are honest about what they don't know.",
      voicePreference: "male-1",
      avatarColor: "#6366f1",
      skepticism: 85,
      openingMessage: "Hi, I'm Marcus — I lead the product team here. Thanks for making time to talk today. I've reviewed your background and I'm interested in hearing the story behind some of your experience. Let me start with a broad one: could you walk me through the most impactful thing you've shipped in the last couple of years and why it mattered?",
    },
  ];
  const session = interviewsRepo.createSession({
    candidateProfileId: profile.id,
    personaId: skeptical.id,
    interviewType: "hiring_manager",
    difficulty: "realistic",
    interestLevel: "medium",
    mode: "text",
    durationMinutes: 10,
    status: "completed",
    jobDocumentId: job.id,
    companyName: "Demo Company",
    companyContextJson: JSON.stringify({ confirmedName: "Demo Corp", industry: "Technology", summary: "A demo company for testing.", coreBusinessModel: "SaaS", productsAndServices: ["Demo product"], targetMarket: "Enterprise", positioning: "Market leader in demo services", missionAndValues: ["innovation", "quality"], strategicPriorities: ["growth"], currentInitiatives: ["AI integration"], recentDirection: "Expanding into new markets", hiringCultureSignals: ["Rigorous interviews"], teamExpectations: "High ownership", interviewStyle: "Structured", roleContribution: "PM role drives product strategy", likelyCompetencyAreas: ["product sense", "execution"], likelyConcernsAboutCandidates: ["experience depth"], confidenceLevel: "high", unknowns: [], values: ["innovation"], currentProjects: [], goals: [], culture: "Professional", roleContext: "PM role" }),
    panelJson: JSON.stringify(demoPanel),
    planJson: JSON.stringify({
      sessionObjective: "Assess PM ownership and AI platform fit.",
      competencySequence: ["ownership", "impact", "stakeholder management"],
      starterQuestions: [
        {
          id: "demo_q_1",
          category: "ownership",
          question: "Walk me through a platform product you owned and why it mattered.",
          whyItMatters: "Tests ownership and relevance.",
        },
      ],
      followUpRules: ["Probe for metrics and tradeoffs."],
      likelyGapTargets: ["technical depth"],
      likelyStrengthTargets: personaConfig.focusAreas,
    }),
    startedAt: Date.now() - 1000 * 60 * 20,
    completedAt: Date.now() - 1000 * 60 * 10,
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 10,
    id: undefined!,
  } as never);

  if (!session) {
    return;
  }

  transcriptRepo.appendTurn({
    interviewSessionId: session.id,
    speaker: "agent",
    text: "Walk me through a platform product you owned and why it mattered.",
    questionCategory: "ownership",
    interviewerKey: "interviewer_1",
  });
  transcriptRepo.appendTurn({
    interviewSessionId: session.id,
    speaker: "candidate",
    text: "I led the rollout of an AI operations platform that cut manual handling time by 32 percent and improved internal adoption by 18 percent.",
  });
  transcriptRepo.appendTurn({
    interviewSessionId: session.id,
    speaker: "agent",
    text: "What tradeoffs did you make to get that shipped?",
    questionCategory: "tradeoffs",
    interviewerKey: "interviewer_1",
  });
  transcriptRepo.appendTurn({
    interviewSessionId: session.id,
    speaker: "candidate",
    text: "I narrowed the v1 scope to workflow automation and held back lower-confidence ML features so the platform could launch with measurable value and less operational risk.",
  });

  scoresRepo.createScore({
    id: undefined!,
    interviewSessionId: session.id,
    overallScore: 81,
    clarityScore: 82,
    relevanceScore: 84,
    evidenceScore: 79,
    structureScore: 80,
    roleFitScore: 85,
    confidenceScore: 76,
    band: "Strong",
    summary: "Strong PM signal with solid ownership and credible metrics.",
    createdAt: Date.now() - 1000 * 60 * 9,
  });

  scoresRepo.createFeedbackItems([
    {
      interviewSessionId: session.id,
      category: "strength",
      title: "Clear ownership",
      body: "The examples showed direct accountability and practical decision-making.",
    },
    {
      interviewSessionId: session.id,
      category: "next_step",
      title: "Add more technical detail",
      body: "Go one layer deeper on platform architecture tradeoffs in future answers.",
    },
  ]);
}

/**
 * Wipe all user-created content from the database (respecting FK ordering),
 * clear FTS virtual tables, then re-seed fresh demo data.
 */
export function resetAllData() {
  ensureDatabaseReady();
  const sqlite = getSqliteClient();

  sqlite.exec(`
    DELETE FROM feedback_items;
    DELETE FROM scores;
    DELETE FROM transcript_turns;
    DELETE FROM transcript_turns_fts;
    DELETE FROM interview_sessions;
    DELETE FROM document_chunks;
    DELETE FROM document_chunks_fts;
    DELETE FROM documents;
    DELETE FROM documents_fts;
    DELETE FROM candidate_profiles;
  `);

  ensureDemoData();
}
