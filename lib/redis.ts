import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Form submissions: 5 per minute per IP (sliding window)
export const formRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "ratelimit:form",
});

// Webhook: 100 per minute
export const webhookRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "ratelimit:webhook",
});

export const ANALYTICS_CACHE_KEY = "analytics:dashboard";
export const ANALYTICS_TTL = 60; // seconds

export async function invalidateAnalyticsCache() {
  await redis.del(ANALYTICS_CACHE_KEY);
}
