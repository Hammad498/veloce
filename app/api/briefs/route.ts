import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBriefsByStage } from "@/lib/brief-service";
import type { Stage } from "@/lib/types";
import { z } from "zod";

const QuerySchema = z.object({
  stage: z.enum(["NEW", "UNDER_REVIEW", "PROPOSAL_SENT", "WON", "ARCHIVED"]),
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userRole = session.user.role;
  const userId = session.user.id;
  const parsed = QuerySchema.safeParse({
    stage: searchParams.get("stage"),
    cursor: searchParams.get("cursor") ?? undefined,
    take: searchParams.get("take") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const { briefs, nextCursor } = await getBriefsByStage(
    parsed.data.stage as Stage,
    parsed.data.cursor,
    parsed.data.take,
    userRole === "REVIEWER" ? userId : undefined
  );

  return NextResponse.json({ briefs, nextCursor });
}
