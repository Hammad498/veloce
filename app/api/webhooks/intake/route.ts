import { NextRequest, NextResponse } from "next/server";
import { webhookRatelimit } from "@/lib/redis";
import { verifyWebhookSignature } from "@/lib/utils";
import { BriefInputSchema, createBrief } from "@/lib/brief-service";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "webhook";
  const { success } = await webhookRatelimit.limit(ip);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const signature = req.headers.get("x-webhook-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 401 });

  const rawBody = await req.text();
  const isValid = verifyWebhookSignature(rawBody, signature, process.env.WEBHOOK_SECRET!);
  if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let body: unknown;
  try { body = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = BriefInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const brief = await createBrief(parsed.data);
    return NextResponse.json({ id: brief.id, message: "Brief ingested via webhook" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to process brief" }, { status: 500 });
  }
}
