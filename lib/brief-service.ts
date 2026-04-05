import { prisma } from "./prisma";
import { analyzeBrief } from "./ai";
import { broadcastSSE } from "./sse";
import { invalidateAnalyticsCache } from "./redis";
import type { Stage } from "./types";
import { z } from "zod";

export const BriefInputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(50).max(10000),
  budgetRange: z.enum(["under-5k", "5k-15k", "15k-50k", "50k-100k", "100k-plus"]),
  urgency: z.enum(["asap", "1-3-months", "3-6-months", "flexible"]),
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
});

export type BriefInput = z.infer<typeof BriefInputSchema>;

export async function createBrief(input: BriefInput) {
  const brief = await prisma.brief.create({
    data: {
      title: input.title,
      description: input.description,
      budgetRange: input.budgetRange,
      urgency: input.urgency,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
    },
  });

  // Run AI analysis async - don't block response
  setImmediate(() => runAnalysis(brief.id, input.description, input.title));

  broadcastSSE("new_brief", { briefId: brief.id, title: brief.title });
  invalidateAnalyticsCache().catch(console.error);

  return brief;
}

async function runAnalysis(briefId: string, description: string, title: string) {
  const result = await analyzeBrief(description, title);

  if (result.status === "failed") {
    await prisma.aiAnalysis.create({
      data: {
        briefId,
        features: [],
        category: "WEB_APP",
        minHours: 0,
        maxHours: 0,
        stack: [],
        complexity: 1,
        status: "failed",
      },
    });
    invalidateAnalyticsCache().catch(console.error);
    broadcastSSE("analysis_complete", { briefId, status: "failed" });
    return;
  }

  await prisma.aiAnalysis.create({
    data: {
      briefId,
      features: result.result.features,
      category: result.result.category,
      minHours: result.result.minHours,
      maxHours: result.result.maxHours,
      stack: result.result.stack,
      complexity: result.result.complexity,
      status: "ok",
    },
  });

  invalidateAnalyticsCache().catch(console.error);
  broadcastSSE("analysis_complete", { briefId, status: "ok" });
}

export async function updateBriefStage(
  briefId: string,
  toStage: Stage,
  actorId: string,
  currentStage: Stage
) {
  const [brief] = await prisma.$transaction([
    prisma.brief.update({ where: { id: briefId }, data: { stage: toStage } }),
    prisma.stageEvent.create({
      data: { briefId, fromStage: currentStage, toStage, actorId },
    }),
  ]);

  invalidateAnalyticsCache().catch(console.error);
  broadcastSSE("stage_change", { briefId, toStage });

  return brief;
}

export async function getBriefsByStage(stage: Stage, cursor?: string, take = 20, assigneeId?: string) {
  const briefs = await prisma.brief.findMany({
    where: { stage, ...(assigneeId ? { assigneeId } : {}) },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      analysis: {
        select: {
          complexity: true, category: true, status: true,
          minHours: true, maxHours: true,
        },
      },
      assignee: { select: { id: true, name: true, email: true } },
      _count: { select: { notes: true } },
    },
  });

  const hasMore = briefs.length > take;
  if (hasMore) briefs.pop();

  return { briefs, nextCursor: hasMore ? briefs[briefs.length - 1]?.id : null };
}
