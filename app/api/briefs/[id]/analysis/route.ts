import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateAnalyticsCache } from "@/lib/redis";
import { broadcastSSE } from "@/lib/sse";
import { z } from "zod";

const OverrideSchema = z.object({
  minHours: z.number().int().positive(),
  maxHours: z.number().int().positive(),
  complexity: z.number().int().min(1).max(5),
  overrideReason: z.string().min(10),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = session.user.id;
  const userRole = session.user.role;

  const brief = await prisma.brief.findUnique({ where: { id }, select: { assigneeId: true } });
  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (userRole === "REVIEWER" && brief.assigneeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = OverrideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });

  const analysis = await prisma.aiAnalysis.update({
    where: { briefId: id },
    data: { ...parsed.data, overriddenBy: userId },
  });

  invalidateAnalyticsCache().catch(console.error);
  broadcastSSE("analysis_complete", { briefId: id, status: "overridden" });

  return NextResponse.json(analysis);
}
