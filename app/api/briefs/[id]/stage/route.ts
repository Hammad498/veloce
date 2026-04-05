import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateBriefStage } from "@/lib/brief-service";
import { prisma } from "@/lib/prisma";
import type { Stage } from "@/lib/types";
import { z } from "zod";

const StageUpdateSchema = z.object({
  stage: z.enum(["NEW", "UNDER_REVIEW", "PROPOSAL_SENT", "WON", "ARCHIVED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const userRole = session.user.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (userRole === "REVIEWER" && brief.assigneeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = StageUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid stage" }, { status: 422 });

  const updated = await updateBriefStage(
    id,
    parsed.data.stage as Stage,
    userId,
    brief.stage as Stage
  );
  return NextResponse.json(updated);
}
