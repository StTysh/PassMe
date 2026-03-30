import type {
  Difficulty,
  DocumentType,
  InterestLevel,
  InterviewType,
  PersonaKey,
  SessionMode,
} from "@/lib/types/domain";

export const APP_NAME = "Interview Loop";
export const APP_VERSION = "1.0.0";

export const DEFAULT_DATABASE_PATH = "./data/interview-loop.sqlite";
export const DEFAULT_DB_PATH = DEFAULT_DATABASE_PATH;

export const FEATURE_FLAGS = {
  ENABLE_VOICE: false,
  ENABLE_SEARCH_PAGE: false,
  ENABLE_DEMO_MODE: true,
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/profiles", label: "Profiles", icon: "profiles" },
  { href: "/interviews/new", label: "Interview setup", icon: "interviews" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export const INTERVIEW_TYPES: Array<{
  value: InterviewType;
  label: string;
  description: string;
}> = [
  {
    value: "recruiter_screen",
    label: "Recruiter screen",
    description: "Fit, motivation, communication, and high-level background.",
  },
  {
    value: "hiring_manager",
    label: "Hiring manager",
    description: "Ownership, impact, tradeoffs, and business judgment.",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    description: "Stories, collaboration, conflict, and leadership signals.",
  },
  {
    value: "technical_general",
    label: "Technical general",
    description: "Role-relevant technical depth without code execution.",
  },
  {
    value: "system_design_light",
    label: "System design light",
    description: "Structured problem-solving and architecture tradeoffs.",
  },
];

export const DIFFICULTY_OPTIONS: Array<{
  value: Difficulty;
  label: string;
  description: string;
}> = [
  { value: "easy", label: "Easy", description: "Gentler pacing and more rescue." },
  {
    value: "realistic",
    label: "Realistic",
    description: "Balanced challenge aligned to a real interview.",
  },
  { value: "hard", label: "Hard", description: "Sharper probing and less patience." },
];

export const INTEREST_LEVEL_OPTIONS: Array<{
  value: InterestLevel;
  label: string;
  description: string;
}> = [
  {
    value: "low",
    label: "Low",
    description: "More skeptical, less patient, and less helpful.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Neutral baseline mapped to the selected persona.",
  },
  {
    value: "high",
    label: "High",
    description: "Warmer, more patient, and more willing to give second chances.",
  },
];

export const SESSION_DURATIONS = [5, 10, 15] as const;
export const SESSION_MODES: SessionMode[] = ["text", "voice"];

export const DOCUMENT_TYPES: Array<{
  value: DocumentType;
  label: string;
  acceptUpload?: boolean;
}> = [
  { value: "resume", label: "Resume", acceptUpload: true },
  { value: "job_description", label: "Job description" },
  { value: "cover_letter", label: "Cover letter" },
  { value: "application_answer", label: "Application answers" },
  { value: "company_context", label: "Company context" },
];

export const PERSONA_KEYS: PersonaKey[] = [
  "warm_recruiter",
  "skeptical_manager",
  "neutral_manager",
  "detail_oriented_interviewer",
];

export const SCORE_BANDS = [
  { min: 0, max: 49.99, label: "Needs work" },
  { min: 50, max: 64.99, label: "Developing" },
  { min: 65, max: 79.99, label: "Promising" },
  { min: 80, max: 100, label: "Strong" },
] as const;

export const REVIEW_CATEGORIES = [
  "strength",
  "weakness",
  "missed_point",
  "rewritten_answer",
  "next_step",
] as const;

export const RETRIEVAL_TOP_K = 6;
export const CHUNK_TARGET_SIZE = 650;
export const CHUNK_OVERLAP = 120;
export const FOLLOW_UP_CAP = 2;
export const TURN_HISTORY_WINDOW = 8;

export const DEMO_PROFILE_NAME = "Alex Morgan";
export const DEMO_PROFILE_ID = "profile_demo_alex_morgan";
export const DEMO_RESUME_DOC_ID = "document_demo_resume";
export const DEMO_JOB_DOC_ID = "document_demo_job";
export const DEMO_SESSION_ID = "session_demo_pm_ai_platform";
