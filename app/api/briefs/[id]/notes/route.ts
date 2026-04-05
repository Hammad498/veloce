import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const NoteSchema = z.object({
  body: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const notes = await prisma.note.findMany({
    where: { briefId: id, parentId: null },
    include: {
      author: { select: { id: true, name: true, email: true } },
      replies: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = NoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const note = await prisma.note.create({
    data: { briefId: id, authorId: userId, body: parsed.data.body, parentId: parsed.data.parentId },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
