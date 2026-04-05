import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const brief = await prisma.brief.findUnique({
    where: { id },
    include: {
      analysis: true,
      assignee: { select: { id: true, name: true, email: true } },
      events: {
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      notes: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true, email: true } },
          replies: {
            include: { author: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      assignmentEvents: {
        include: {
          actor: { select: { id: true, name: true, email: true } },
          fromAssignee: { select: { id: true, name: true, email: true } },
          toAssignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole = session.user.role;
  const userId = session.user.id;
  if (userRole === "REVIEWER" && brief.assigneeId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(brief);
}
