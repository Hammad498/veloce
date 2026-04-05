import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function formatBudget(range: string): string {
  const map: Record<string, string> = {
    "under-5k": "< $5k",
    "5k-15k": "$5k–$15k",
    "15k-50k": "$15k–$50k",
    "50k-100k": "$50k–$100k",
    "100k-plus": "$100k+",
  };
  return map[range] ?? range;
}

export function budgetToMidpoint(range: string): number {
  const map: Record<string, number> = {
    "under-5k": 2500,
    "5k-15k": 10000,
    "15k-50k": 32500,
    "50k-100k": 75000,
    "100k-plus": 150000,
  };
  return map[range] ?? 0;
}

export const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under Review",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  ARCHIVED: "Archived",
};

export const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  PROPOSAL_SENT: "bg-amber-100 text-amber-700",
  WON: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: "Web App",
  MOBILE: "Mobile",
  AI_ML: "AI/ML",
  AUTOMATION: "Automation",
  INTEGRATION: "Integration",
};
