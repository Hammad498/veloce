"use client";
import Link from "next/link";
import { MessageSquare, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ComplexityDots } from "@/components/ui/ComplexityDots";
import { CATEGORY_LABELS, formatBudget } from "@/lib/utils";

type BadgeVariant = "default" | "purple" | "blue" | "amber" | "emerald" | "gray" | "red";

const CATEGORY_VARIANT: Record<string, BadgeVariant> = {
  WEB_APP: "blue", MOBILE: "purple", AI_ML: "amber",
  AUTOMATION: "emerald", INTEGRATION: "default",
};

type Brief = {
  id: string;
  title: string;
  contactName: string;
  budgetRange: string;
  urgency: string;
  createdAt: string | Date;
  analysis?: { complexity: number; category: string; minHours: number; maxHours: number; status: string } | null;
  assignee?: { name?: string | null; email: string } | null;
  _count?: { notes: number };
};

export default function BriefCard({ brief, isDragging }: { brief: Brief; isDragging?: boolean }) {
  const analysis = brief.analysis;

  return (
    <Link href={`/dashboard/briefs/${brief.id}`}>
      <div className={`brief-card group transition-all duration-300 cursor-pointer ${
        isDragging ? "ring-2 ring-accent-green shadow-lg shadow-accent-green/20" : "hover:border-accent-green/50 hover:shadow-lg hover:shadow-accent-green/10"
      }`}>
        {/* Category badge + complexity */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {analysis?.status === "ok" ? (
            <Badge variant={CATEGORY_VARIANT[analysis.category] ?? "default"}>
              {CATEGORY_LABELS[analysis.category] ?? analysis.category}
            </Badge>
          ) : analysis?.status === "failed" ? (
            <Badge variant="red">Analysis failed</Badge>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700/50 text-text-muted text-xs font-medium animate-pulse">
              <Zap className="w-3 h-3 text-accent-green" />
              Analyzing…
            </span>
          )}
          {analysis?.status === "ok" && <ComplexityDots score={analysis.complexity} />}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white leading-snug mb-1 group-hover:text-accent-green transition-colors line-clamp-2">
          {brief.title}
        </h3>
        <p className="text-xs text-text-muted mb-3">{brief.contactName}</p>

        {/* Hours estimate */}
        {analysis?.status === "ok" && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit">
            <Clock className="w-3.5 h-3.5 text-accent-green" />
            <span>{analysis.minHours}–{analysis.maxHours}h est.</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          <span className="text-xs text-text-secondary font-medium">{formatBudget(brief.budgetRange)}</span>
          <div className="flex items-center gap-2">
            {(brief._count?.notes ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-green transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                {brief._count!.notes}
              </span>
            )}
            {brief.assignee && (
              <div className="w-6 h-6 bg-gradient-to-br from-accent-green/40 to-emerald-600/40 rounded-full flex items-center justify-center border border-accent-green/30 hover:border-accent-green/60" title={brief.assignee.name ?? brief.assignee.email}>
                <span className="text-accent-green text-xs font-semibold">
                  {(brief.assignee.name ?? brief.assignee.email)[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
