import { NextRequest, NextResponse } from "next/server";
import { formRatelimit } from "@/lib/redis";
import { BriefInputSchema, createBrief } from "@/lib/brief-service";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success, remaining } = await formRatelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute." },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = BriefInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const brief = await createBrief(parsed.data);
    return NextResponse.json({ id: brief.id, message: "Brief submitted successfully" }, { status: 201 });
  } catch (err) {
    console.error("Failed to create brief:", err);
    return NextResponse.json({ error: "Failed to submit brief" }, { status: 500 });
  }
}
