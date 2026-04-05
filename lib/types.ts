// Local type definitions that mirror the Prisma schema
// This avoids runtime imports from @prisma/client before prisma generate runs

export type Stage = "NEW" | "UNDER_REVIEW" | "PROPOSAL_SENT" | "WON" | "ARCHIVED";
export type Category = "WEB_APP" | "MOBILE" | "AI_ML" | "AUTOMATION" | "INTEGRATION";
export type Role = "ADMIN" | "REVIEWER";

export const STAGES: Stage[] = ["NEW", "UNDER_REVIEW", "PROPOSAL_SENT", "WON", "ARCHIVED"];
export const CATEGORIES: Category[] = ["WEB_APP", "MOBILE", "AI_ML", "AUTOMATION", "INTEGRATION"];
