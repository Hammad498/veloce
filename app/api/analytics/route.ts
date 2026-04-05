import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { redis, ANALYTICS_CACHE_KEY, ANALYTICS_TTL } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { budgetToMidpoint } from "@/lib/utils";
import { format, startOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

async function computeAnalytics() {
  const [stageCounts, complexityRows, categories, recentBriefs] = await Promise.all([
    prisma.brief.groupBy({ by: ["stage"], _count: true }),
    prisma.aiAnalysis.findMany({
      select: { complexity: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.aiAnalysis.groupBy({ by: ["category"], _count: true }),
    prisma.brief.findMany({
      where: { stage: { in: ["NEW", "UNDER_REVIEW", "PROPOSAL_SENT"] } },
      select: { budgetRange: true },
    }),
  ]);

  const totalBriefs = stageCounts.reduce((sum: number, s: { _count: number }) => sum + s._count, 0);
  const wonBriefs = stageCounts.find((s: { stage: string }) => s.stage === "WON")?._count ?? 0;
  const conversionRate = totalBriefs > 0 ? Math.round((wonBriefs / totalBriefs) * 100) : 0;
  const revenuePipeline = recentBriefs.reduce(
    (sum: number, b: { budgetRange: string }) => sum + budgetToMidpoint(b.budgetRange), 0
  );

  // Bucket by week and return average complexity for the last 12 weekly buckets.
  const weekly = new Map<string, { total: number; count: number; label: string }>();
  for (const row of complexityRows as Array<{ complexity: number; createdAt: Date }>) {
    const weekStart = startOfWeek(new Date(row.createdAt), { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-MM-dd");
    const prev = weekly.get(key) ?? { total: 0, count: 0, label: format(weekStart, "MMM d") };
    weekly.set(key, { total: prev.total + row.complexity, count: prev.count + 1, label: prev.label });
  }

  const complexityByWeek = Array.from(weekly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, value]) => ({
      week: value.label,
      avg: Number((value.total / value.count).toFixed(2)),
    }));

  return {
    stageCounts: stageCounts.map((s: { stage: string; _count: number }) => ({
      stage: s.stage, count: s._count,
    })),
    categories: categories.map((c: { category: string; _count: number }) => ({
      category: c.category, count: c._count,
    })),
    complexityOverTime: complexityByWeek,
    conversionRate,
    revenuePipeline,
    totalBriefs,
    wonBriefs,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const cached = await redis.get(ANALYTICS_CACHE_KEY);
    if (cached) return NextResponse.json(cached);
  } catch (err) {
    console.error("Redis cache miss:", err);
  }

  const analytics = await computeAnalytics();

  try {
    await redis.set(ANALYTICS_CACHE_KEY, analytics, { ex: ANALYTICS_TTL });
  } catch (err) {
    console.error("Failed to cache analytics:", err);
  }

  return NextResponse.json(analytics);
}
