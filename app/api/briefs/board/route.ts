import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBriefsByStage } from "@/lib/brief-service";
import { STAGES, type Stage } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = session.user.role;
  const userId = session.user.id;
  const assigneeId = userRole === "REVIEWER" ? userId : undefined;

  const results = await Promise.all(
    STAGES.map((stage) => getBriefsByStage(stage as Stage, undefined, 50, assigneeId))
  );

  const columns = Object.fromEntries(
    STAGES.map((stage, idx) => [stage, results[idx].briefs])
  );

  return NextResponse.json({ columns, role: userRole });
}
