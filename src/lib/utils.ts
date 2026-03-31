import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeFtsQuery(input: string) {
  const normalized = input
    .replace(/["'`()[\]{}:*+\-!^~?\\/:.,;=<>|&]/g, " ")
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, " ")
    .trim();

  const terms = normalized
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  if (terms.length === 0) {
    return "";
  }

  return terms.map((term) => `"${term.replace(/"/g, "\"\"")}"`).join(" ");
}
