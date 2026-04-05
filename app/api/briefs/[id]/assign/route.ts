import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AssignSchema = z.object({ assigneeId: z.string().nullable() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });

  const current = await prisma.brief.findUnique({
    where: { id },
    select: { assigneeId: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public."AssignmentEvent"') IS NOT NULL AS "exists"
  `;

  const brief = await prisma.brief.update({
    where: { id },
    data: { assigneeId: parsed.data.assigneeId },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  if (tableCheck[0]?.exists) {
    await prisma.assignmentEvent.create({
      data: {
        briefId: id,
        fromAssigneeId: current.assigneeId,
        toAssigneeId: parsed.data.assigneeId,
        actorId: session.user.id!,
      },
    });
  }

  return NextResponse.json(brief);
}
