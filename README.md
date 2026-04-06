# Veloce — AI-Powered Project Intake & Estimation Engine...

A production-grade agency tool that receives project briefs, runs them through an AI analysis pipeline, and manages the full proposal lifecycle via a real-time Kanban dashboard.

**Live Demo:** `https://veloce-tawny.vercel.app/`  
**Tech Stack:** Next.js 14+ App Router · PostgreSQL (Neon) · Prisma · Upstash Redis · Groq (Llama 3.1) · NextAuth · Recharts

---

## Quick Start

```bash
git clone https://github.com/you/veloce
cd veloce
npm install
cp .env.local.example .env.local   # fill in your credentials
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

**Demo credentials (after seed):**
- Admin: `admin@veloce.io` / `admin123`
- Reviewer: `reviewer@veloce.io` / `reviewer123`

---

## Environment Variables

```env
# Neon PostgreSQL (neon.tech — free tier)
DATABASE_URL="postgresql://user:pass@host/veloce?sslmode=require"

# NextAuth (generate: openssl rand -base64 32)
AUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Keep this pointed at the deployed production URL in Vercel.
# Leaving it set to localhost will make auth redirects and sign-out land on localhost in production.

# Upstash Redis (upstash.com — free tier)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Groq API (groq.com — free-tier credits)
GROQ_API_KEY="gsk_..."

# Webhook HMAC signing secret (generate: openssl rand -hex 32)
WEBHOOK_SECRET="your-webhook-secret"
```

---

## Architecture & Design Decisions

### Data Model

```
Brief (1) ──── (1) AiAnalysis
  │
  ├──── (many) StageEvent   ← append-only event log
  ├──── (many) AssignmentEvent ← assignee change history
  ├──── (many) Note         ← threaded (parentId nullable)
  └──── (1) User            ← assignee FK
```

**Key decisions:**

- **AiAnalysis is a separate table** (not JSON columns on Brief). This keeps raw client input and AI output independently queryable, lets us re-run analysis without touching the brief record, and enables indexing on `complexity` and `category` for analytics queries.

- **StageEvent is append-only** — we never update a status field. Each transition inserts a new row with `fromStage`, `toStage`, `actorId`, and a timestamp. This gives us a full audit trail and timeline UI for free, is trivially paginated, and is immutable (no accidental state corruption).

- **Note.parentId is nullable** — a single self-referential FK supports infinite threading depth while keeping the schema simple. We only query `where: { parentId: null }` for top-level notes and `include: replies` for one level of nesting (sufficient for team use).

### Indexing Strategy

```prisma
// briefs — most queried by stage+time (Kanban columns)
@@index([stage, createdAt(sort: Desc)])   // Kanban column fetch
@@index([assigneeId, stage])              // Reviewer scoped view
@@index([createdAt(sort: Desc)])          // Analytics time-series

// ai_analyses — analytics aggregation
@@index([briefId])     // 1:1 join from brief
@@index([category])    // groupBy category
@@index([complexity])  // avg complexity queries

// stage_events — timeline queries
@@index([briefId, createdAt(sort: Desc)]) // per-brief timeline

// notes — thread fetch
@@index([briefId, createdAt(sort: Desc)]) // per-brief notes
```

All Kanban queries use cursor-based pagination (`findMany + cursor + skip: 1`) instead of `skip/take` offset pagination. This keeps query time O(1) as the dataset grows, because the DB seeks to the cursor row by indexed primary key rather than counting `OFFSET` rows.

### AI Pipeline Design

```
Client submits brief
       │
       ▼
Brief saved to DB immediately (fast response to user)
       │
       ▼ (setImmediate — non-blocking)
Groq llama-3.1-8b-instant
  └─ tool_choice: { type: "tool", name: "analyze_brief" }
  └─ Zod validation of returned tool input
  └─ Retry once on timeout/error
  └─ On 2nd failure: store status:"failed", brief still visible
       │
       ▼
AiAnalysis record created
SSE broadcast → all dashboard clients update
```

**Why tool-calling over JSON mode:** Tool calling forces the model to emit a structured object conforming to a JSON Schema we define. We get compile-time type safety via Zod validation on the response. Raw JSON mode still produces free-form text that may require regex cleanup.

**Why llama-3.1-8b-instant on Groq:** Fast inference, low-cost/free-tier friendly, and good structured-output reliability when constrained through tool-calling + Zod validation.

**Graceful failure:** The brief is always saved before AI runs. If AI fails twice, `AiAnalysis.status = "failed"` is recorded. The UI shows a clear "Analysis failed" badge rather than a spinner. Reviewers can still process the brief manually.

### Caching Strategy (Upstash Redis)

```
Cache key:   analytics:dashboard
TTL:         60 seconds (time-based safety net)
Invalidated: on every brief creation OR stage change (event-driven)
```

**Why event-driven + TTL hybrid:** Event-driven invalidation (`redis.del()`) ensures the cache is fresh immediately after mutations. TTL is the fallback in case invalidation fails (Redis timeout, deployment restart). The 60s TTL means worst-case staleness is 1 minute. Analytics are read-heavy and compute-expensive (5 aggregation queries), making caching high-value.

**Rate limiting:** Uses Upstash's sliding window algorithm — smoother than fixed windows, prevents burst gaming. Different limits per surface:
- Public intake form: 5 req/min/IP (prevents spam)
- Webhook endpoint: 100 req/min/IP (server-to-server traffic)

### Real-Time Updates (SSE)

Server-Sent Events over WebSockets because:
- Unidirectional (server → client) — SSE is exactly the right primitive
- Works through Vercel's serverless function model (no persistent WS server needed)
- Auto-reconnects natively in the browser
- HTTP/2 multiplexes multiple SSE streams on one connection

The broadcaster is a module-level `Set<SSEClient>` — correct for single-instance Vercel deployments. For multi-instance, replace with Upstash Pub/Sub (documented upgrade path in `lib/sse.ts`).

Events emitted: `new_brief`, `stage_change`, `analysis_complete`. The Kanban board and Brief Detail page both subscribe and re-fetch on relevant events.

### RSC vs. Client Component Split

| Component | Type | Reason |
|---|---|---|
| `app/(dashboard)/layout.tsx` | Server | Auth check via `auth()`, no interactivity |
| `app/(dashboard)/dashboard/page.tsx` | Server | Thin shell, session metadata only |
| `KanbanBoard` | Client | DnD state, SSE subscription, optimistic updates |
| `BriefDetail` | Client | SSE subscription, note submission, tab state |
| `AnalyticsDashboard` | Client | Recharts requires browser APIs (canvas) |
| `app/(dashboard)/analytics/page.tsx` | Server | Header only, delegates to client component |
| `DashboardNav` | Client | `usePathname()` for active link highlighting |
| `IntakeForm` | Client | Form state, validation, submission |
| `BriefCard` | Client | Link navigation (could be Server — kept Client for DnD compatibility) |

No `useState` or browser APIs in Server Components. Loading skeletons in `KanbanBoard` and `BriefDetail` prevent layout shift during data fetches.

### Webhook Security

HMAC-SHA256 verification using Node's `crypto.timingSafeEqual` — critically, **not string equality**. String equality short-circuits on the first mismatching character, leaking timing information that allows bit-by-bit secret reconstruction. `timingSafeEqual` always runs in constant time regardless of where the mismatch occurs.

Signature format: `X-Webhook-Signature: sha256=<hmac-hex>` — same convention as GitHub, Stripe, and Typeform webhooks.

---

## Testing the Webhook

```bash
# Generate a test signature
SECRET="your-webhook-secret"
PAYLOAD='{"title":"Test Project","description":"A test project with enough detail to be analyzed properly by the AI system we built","budgetRange":"15k-50k","urgency":"1-3-months","contactName":"Test User","contactEmail":"test@example.com"}'
SIG="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)"

curl -X POST https://your-app.vercel.app/api/webhooks/intake \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIG" \
  -d "$PAYLOAD"
```

---

## Deployment (Vercel — free tier)

```bash
npm install -g vercel
vercel
# Follow prompts, then add env vars in Vercel dashboard
# Run: vercel env add DATABASE_URL (etc.)
npx prisma db push   # run from local against Neon
npx prisma db seed   # seed demo users
```

---



---

## What I'd Improve With More Time

1. **Multi-instance SSE** — replace the in-process `Set<SSEClient>` with Upstash Pub/Sub for horizontal scaling. The interface in `lib/sse.ts` (`broadcastSSE`, `addSSEClient`) makes this a 20-line swap.

2. **AI re-analysis** — add a "Re-analyze" button on failed or stale analyses. The `analyzeBrief` function is already isolated; just wire up a new API route + UI button.

3. **Assignment workflow** — currently assignees are set manually by admins. Add email notifications (Resend, free tier) when a brief is assigned to a reviewer.

4. **Full-text search** — add `pg_trgm` index on `Brief.title + description` for a search bar across all briefs. Alternatively, Algolia free tier (10k records).

5. **E2E tests** — Playwright tests for the intake form submission flow, HMAC webhook rejection, and Kanban drag-and-drop stage transitions. The happy paths are solid; edge cases (concurrent submissions, AI timeout during demo) need coverage.

6. **Pagination UI** — cursor pagination is implemented in the API but the Kanban board loads all briefs per stage in one shot. Adding "Load more" per column would help at scale (50+ briefs/stage).

7. **Proposal generation** — given the AI already has features, stack, and estimates, a one-click "Generate Proposal PDF" using a template would complete the agency workflow loop.
