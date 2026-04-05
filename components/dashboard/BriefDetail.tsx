"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import {
  ArrowLeft, Clock, DollarSign, Mail, User, Zap, Edit2, Check,
  ChevronRight, AlertTriangle, Loader2, UserPlus, X,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ComplexityDots } from "@/components/ui/ComplexityDots";
import { Skeleton } from "@/components/ui/Skeleton";
import { STAGE_LABELS, CATEGORY_LABELS, formatBudget } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────────── */
type Analysis = {
  complexity: number; category: string; minHours: number; maxHours: number;
  status: string; features: string[]; stack: string[];
  overriddenBy?: string | null; overrideReason?: string | null;
};
type Author = { id: string; name?: string | null; email: string };
type Note = {
  id: string; body: string; createdAt: string;
  author: Author; replies: Note[];
};
type StageEvent = {
  id: string; fromStage: string; toStage: string; createdAt: string;
  actor: Author;
};
type AssignmentEvent = {
  id: string;
  createdAt: string;
  actor: Author;
  fromAssignee?: Author | null;
  toAssignee?: Author | null;
};
type Brief = {
  id: string; title: string; description: string; budgetRange: string;
  urgency: string; contactName: string; contactEmail: string;
  stage: string; createdAt: string;
  analysis?: Analysis | null;
  assignee?: Author | null;
  events: StageEvent[];
  notes: Note[];
  assignmentEvents: AssignmentEvent[];
};
type TeamMember = { id: string; name?: string | null; email: string; role: string };

/* ── Note component ─────────────────────────────────────────────────────── */
function NoteItem({ note, briefId, onRefresh }: { note: Note; briefId: string; onRefresh: () => void }) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitReply = async () => {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    await fetch(`/api/briefs/${briefId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody, parentId: note.id }),
    });
    setReplyBody(""); setReplying(false); setSubmitting(false);
    onRefresh();
  };

  return (
    <div className="space-y-2">
      <div className="glass-panel dark p-4 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-accent-green/40 to-emerald-600/40 rounded-full flex items-center justify-center shrink-0 border border-accent-green/30">
            <span className="text-accent-green text-xs font-semibold">
              {(note.author.name ?? note.author.email)[0].toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-white">{note.author.name ?? note.author.email}</span>
          <span className="text-xs text-text-muted ml-auto">{format(new Date(note.createdAt), "MMM d, h:mm a")}</span>
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{note.body}</p>
        <button onClick={() => setReplying(r => !r)}
          className="mt-2 text-xs text-text-muted hover:text-accent-green transition-colors font-medium">
          {replying ? "Cancel" : "↩ Reply"}
        </button>
      </div>

      {note.replies.length > 0 && (
        <div className="ml-5 border-l-2 border-accent-green/20 pl-4 space-y-2">
          {note.replies.map(reply => (
            <div key={reply.id} className="glass-panel dark p-3 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 bg-slate-700/50 rounded-full flex items-center justify-center shrink-0 border border-slate-600/50">
                  <span className="text-text-muted text-xs font-medium">
                    {(reply.author.name ?? reply.author.email)[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-medium text-text-secondary">{reply.author.name ?? reply.author.email}</span>
                <span className="text-xs text-text-muted ml-auto">{format(new Date(reply.createdAt), "MMM d, h:mm a")}</span>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="ml-5 border-l-2 border-accent-green/20 pl-4">
          <textarea rows={2} value={replyBody} onChange={e => setReplyBody(e.target.value)}
            placeholder="Write a reply…" autoFocus
            className="input-field w-full text-sm" />
          <div className="flex gap-2 mt-1.5">
            <button onClick={submitReply} disabled={submitting || !replyBody.trim()}
              className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1 disabled:opacity-50">
              {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Send reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Override modal ─────────────────────────────────────────────────────── */
function OverrideModal({ analysis, briefId, onClose, onSave }: {
  analysis: Analysis; briefId: string; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    minHours: analysis.minHours, maxHours: analysis.maxHours,
    complexity: analysis.complexity, overrideReason: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (form.minHours > form.maxHours) { setError("Min hours must be less than max hours"); return; }
    if (form.overrideReason.trim().length < 10) { setError("Please provide a reason (min 10 characters)"); return; }
    setSaving(true);
    const res = await fetch(`/api/briefs/${briefId}/analysis`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { onSave(); onClose(); }
    else { setError("Failed to save. Please try again."); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="glass-panel dark rounded-2xl shadow-2xl w-full max-w-md border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-white">Override AI Estimates</h3>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Min Hours</label>
              <input type="number" min={1} value={form.minHours}
                onChange={e => setForm(f => ({ ...f, minHours: Math.max(1, +e.target.value) }))}
                className="input-field w-full text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Max Hours</label>
              <input type="number" min={1} value={form.maxHours}
                onChange={e => setForm(f => ({ ...f, maxHours: Math.max(1, +e.target.value) }))}
                className="input-field w-full text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Complexity Score</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, complexity: n }))}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold border transition-all",
                    form.complexity === n
                      ? "bg-accent-green/30 text-accent-green border-accent-green/50"
                      : "border-slate-700 text-text-muted hover:border-accent-green/30 hover:text-text-secondary"
                  )}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1.5">1 = trivial, 5 = highly complex</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              Reason for Override <span className="text-red-400">*</span>
            </label>
            <textarea rows={3} value={form.overrideReason}
              onChange={e => setForm(f => ({ ...f, overrideReason: e.target.value }))}
              placeholder="Why are you adjusting the AI estimates? (min 10 characters)"
              className="input-field w-full text-sm resize-none" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2.5 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={onClose} className="text-sm text-text-muted hover:text-white px-4 py-2 rounded-lg transition-colors">Cancel</button>
            <button onClick={save} disabled={saving}
              className="text-sm btn-primary px-5 py-2 flex items-center gap-1.5 disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Assign dropdown (admin only) ───────────────────────────────────────── */
function AssignDropdown({ brief, onAssigned }: { brief: Brief; onAssigned: () => void }) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const loadTeam = async () => {
    setLoadingTeam(true);
    setError("");

    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setTeam(await res.json());
      } else {
        const payload = await res.json().catch(() => null);
        setError(payload?.error ?? "Unable to load assignees");
      }
    } finally {
      setLoadingTeam(false);
    }
  };

  const assign = async (userId: string | null) => {
    setError("");

    const res = await fetch(`/api/briefs/${brief.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: userId }),
    });

    if (res.ok) {
      setOpen(false);
      onAssigned();
      return;
    }

    const payload = await res.json().catch(() => null);
    setError(payload?.error ?? "Unable to update assignment");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) void loadTeam(); }}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-green border border-slate-700 hover:border-accent-green/50 px-3 py-1.5 rounded-lg transition-colors">
        <UserPlus className="w-3 h-3" />
        {brief.assignee ? "Reassign" : "Assign"}
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-600/70 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden max-h-72 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-slate-300 font-semibold tracking-wide border-b border-slate-700">Assign to</div>
          {error && (
            <div className="px-3 py-2 text-xs text-red-300 border-b border-slate-700/80 bg-red-500/10">
              {error}
            </div>
          )}
          {brief.assignee && (
            <button onClick={() => assign(null)}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800/70 transition-colors flex items-center gap-2">
              <X className="w-3 h-3" /> Unassign
            </button>
          )}
          {loadingTeam && (
            <div className="px-3 py-3 text-xs text-slate-300 text-center">
              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
            </div>
          )}
          {!loadingTeam && team.length === 0 && !error && (
            <div className="px-3 py-3 text-xs text-slate-400 text-center">
              No assignable users found.
            </div>
          )}
          {team.map(member => (
            <button key={member.id} onClick={() => assign(member.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800/70 transition-colors flex items-center gap-2",
                brief.assignee?.id === member.id
                  ? "text-accent-green bg-accent-green/10"
                  : "text-slate-100"
              )}>
              <div className="w-5 h-5 bg-gradient-to-br from-accent-green/40 to-emerald-600/40 rounded-full flex items-center justify-center shrink-0 border border-accent-green/30">
                <span className="text-accent-green text-xs font-semibold">
                  {(member.name ?? member.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-xs">{member.name ?? member.email}</p>
                <p className="text-xs text-slate-400">{member.role}</p>
              </div>
              {brief.assignee?.id === member.id && <Check className="w-3 h-3 ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main BriefDetail component ─────────────────────────────────────────── */
export default function BriefDetail({ briefId, userRole }: { briefId: string; userRole?: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [fetchStatus, setFetchStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteBody, setNoteBody] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "notes" | "timeline">("analysis");

  const refreshBrief = useCallback(async () => {
    const res = await fetch(`/api/briefs/${briefId}`);
    if (res.ok) {
      setBrief(await res.json());
      setFetchStatus(200);
    }
  }, [briefId]);

  useEffect(() => {
    let cancelled = false;

    const loadBrief = async () => {
      const res = await fetch(`/api/briefs/${briefId}`);
      if (cancelled) return;

      if (res.ok) {
        setBrief(await res.json());
        setFetchStatus(200);
      } else {
        setFetchStatus(res.status);
      }
      setLoading(false);
    };

    void loadBrief();

    return () => {
      cancelled = true;
    };
  }, [briefId]);

  // SSE live updates
  useEffect(() => {
    const es = new EventSource("/api/events");
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.briefId === briefId) {
          void refreshBrief();
        }
      } catch { /* ignore parse errors */ }
    };
    es.addEventListener("analysis_complete", handler);
    es.addEventListener("stage_change", handler);
    return () => es.close();
  }, [briefId, refreshBrief]);

  const submitNote = async () => {
    if (!noteBody.trim()) return;
    setSubmittingNote(true);
    await fetch(`/api/briefs/${briefId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });
    setNoteBody(""); setSubmittingNote(false);
    await refreshBrief();
  };

  /* Loading skeleton */
  if (loading) return (
    <div className="max-w-5xl mx-auto p-6">
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="h-40 mb-4" />
      <Skeleton className="h-10 w-80 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-52" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-52" />
      </div>
    </div>
  );

  if (!brief) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700/50">
          <AlertTriangle className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-text-secondary">
          {fetchStatus === 403
            ? "Access denied. This brief is not assigned to your account."
            : "Brief not found or access denied."}
        </p>
        <Link href="/dashboard" className="text-sm text-accent-green hover:text-accent-green-light mt-2 inline-block">
          ← Back to Pipeline
        </Link>
      </div>
    </div>
  );

  const analysis = brief.analysis;
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Back navigation */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-green mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Pipeline
      </Link>

      {/* Hero card */}
      <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-6 mb-4 shadow-lg shadow-accent-green/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700/50 bg-slate-800/50 text-text-secondary`}>
                {STAGE_LABELS[brief.stage] ?? brief.stage}
              </span>
              {analysis?.overriddenBy && (
                <span className="text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 font-medium">
                  ✏ Estimates overridden
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 leading-tight">{brief.title}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />{brief.contactName}
              </span>
              <a href={`mailto:${brief.contactEmail}`}
                className="flex items-center gap-1.5 hover:text-accent-green transition-colors">
                <Mail className="w-3.5 h-3.5" />{brief.contactEmail}
              </a>
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />{formatBudget(brief.budgetRange)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {brief.urgency === "asap" ? "ASAP" : brief.urgency.replace(/-/g, " ")}
              </span>
            </div>
          </div>

          {/* Estimate summary */}
          {analysis?.status === "ok" && (
            <div className="text-right shrink-0 glass-panel dark rounded-lg p-4 min-w-32 border border-accent-green/20">
              <div className="flex items-center gap-2 justify-end mb-2">
                <ComplexityDots score={analysis.complexity} />
              </div>
              <p className="text-2xl font-bold text-accent-green">{analysis.minHours}–{analysis.maxHours}h</p>
              <p className="text-xs text-text-muted mt-0.5">estimated effort</p>
            </div>
          )}
          {!analysis && (
            <div className="flex items-center gap-2 text-sm text-text-muted bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/50">
              <Loader2 className="w-4 h-4 animate-spin text-accent-green" /> Analyzing…
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1 glass-panel dark border border-slate-700/50 rounded-lg p-1 shadow-sm">
          {(["analysis", "notes", "timeline"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize",
                activeTab === tab
                  ? "bg-accent-green/20 text-accent-green border border-accent-green/30"
                  : "text-text-muted hover:text-white hover:bg-slate-800/50"
              )}>
              {tab}
              {tab === "notes" && brief.notes.length > 0 && (
                <span className={cn("ml-1.5 text-xs px-1.5 py-0.5 rounded-full", activeTab === tab ? "bg-accent-green/30 text-accent-green" : "bg-slate-700/50 text-text-muted")}>
                  {brief.notes.length}
                </span>
              )}
              {tab === "timeline" && brief.events.length > 0 && (
                <span className={cn("ml-1.5 text-xs px-1.5 py-0.5 rounded-full", activeTab === tab ? "bg-accent-green/30 text-accent-green" : "bg-slate-700/50 text-text-muted")}>
                  {brief.events.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── ANALYSIS TAB ── */}
          {activeTab === "analysis" && (
            <>
              <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-white mb-3">Project Description</h2>
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{brief.description}</p>
              </div>

              <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-accent-green/20 rounded-lg flex items-center justify-center border border-accent-green/30">
                      <Zap className="w-3.5 h-3.5 text-accent-green" />
                    </div>
                    <h2 className="text-sm font-semibold text-white">AI Analysis</h2>
                    {analysis?.status === "ok" && (
                      <Badge variant="purple">llama-3.1-8b</Badge>
                    )}
                  </div>
                  {analysis?.status === "ok" && (
                    <button onClick={() => setShowOverride(true)}
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-green border border-slate-700 hover:border-accent-green/50 px-3 py-1.5 rounded-lg transition-colors">
                      <Edit2 className="w-3 h-3" /> Override estimates
                    </button>
                  )}
                </div>

                {!analysis && (
                  <div className="flex items-center gap-3 text-sm text-text-muted py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-accent-green" />
                    <div>
                      <p className="font-medium text-white">Analyzing your brief…</p>
                      <p className="text-xs text-text-muted">Usually takes 5–15 seconds</p>
                    </div>
                  </div>
                )}
                {analysis?.status === "failed" && (
                  <div className="flex items-start gap-3 text-sm bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-400">AI analysis failed</p>
                      <p className="text-xs text-red-300/80 mt-0.5">Please review this brief manually and add notes.</p>
                    </div>
                  </div>
                )}
                {analysis?.status === "ok" && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">Category</p>
                      <Badge variant="blue">{CATEGORY_LABELS[analysis.category] ?? analysis.category}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
                        Extracted Features ({(analysis.features as string[]).length})
                      </p>
                      <ul className="space-y-2">
                        {(analysis.features as string[]).map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                            <div className="w-4 h-4 bg-accent-green/30 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-accent-green/50">
                              <Check className="w-2.5 h-2.5 text-accent-green" />
                            </div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">Suggested Stack</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.stack as string[]).map((s, i) => (
                          <span key={i} className="text-xs bg-slate-700/50 hover:bg-slate-700 text-text-secondary px-2.5 py-1 rounded-lg font-medium transition-colors cursor-default border border-slate-700/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">Complexity Breakdown</p>
                      <div className="flex items-center gap-3">
                        <ComplexityDots score={analysis.complexity} />
                        <span className="text-sm text-white font-medium">{analysis.complexity} / 5</span>
                        <span className="text-xs text-text-muted">
                          {["", "Very simple", "Simple", "Moderate", "Complex", "Highly complex"][analysis.complexity]}
                        </span>
                      </div>
                    </div>
                    {analysis.overrideReason && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <p className="text-xs font-semibold text-amber-300 mb-1.5">Override reason</p>
                        <p className="text-sm text-amber-200/80">{analysis.overrideReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── NOTES TAB ── */}
          {activeTab === "notes" && (
            <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-white mb-5">Internal Notes</h2>

              {/* Note composer */}
              <div className="mb-6 glass-panel dark rounded-lg p-4 border border-slate-700/50">
                <textarea rows={3} value={noteBody} onChange={e => setNoteBody(e.target.value)}
                  placeholder="Add an internal note visible to team members…"
                  className="w-full text-sm bg-transparent placeholder-text-muted text-white focus:outline-none resize-none" />
                <div className="flex justify-end mt-2">
                  <button onClick={submitNote} disabled={submittingNote || !noteBody.trim()}
                    className="text-sm btn-primary px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
                    {submittingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes list */}
              <div className="space-y-4">
                {brief.notes.length === 0 && (
                  <div className="text-center py-10 text-text-muted">
                    <div className="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700/50">
                      <Mail className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-sm">No notes yet. Start the conversation above.</p>
                  </div>
                )}
                {brief.notes.map(note => (
                  <NoteItem key={note.id} note={note} briefId={briefId} onRefresh={() => { void refreshBrief(); }} />
                ))}
              </div>
            </div>
          )}

          {/* ── TIMELINE TAB ── */}
          {activeTab === "timeline" && (
            <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-white mb-5">Stage History</h2>

              {/* Created event */}
              <div className="flex items-start gap-3 pb-4 mb-1">
                <div className="w-7 h-7 bg-slate-700/50 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-slate-700/50">
                  <div className="w-2 h-2 bg-text-muted rounded-full" />
                </div>
                <div>
                  <p className="text-sm text-white">
                    <span className="font-medium">{brief.contactName}</span> submitted brief
                  </p>
                  <p className="text-xs text-text-muted">{format(new Date(brief.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </div>

              {brief.events.length > 0 && (
                <div className="ml-3.5 border-l-2 border-accent-green/20 pl-6 space-y-4">
                  {brief.events.map(ev => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-accent-green/30 rounded-full flex items-center justify-center shrink-0 -ml-3.5 ring-2 ring-slate-900 border border-accent-green/50">
                        <ChevronRight className="w-3.5 h-3.5 text-accent-green" />
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          <span className="font-medium">{ev.actor.name ?? ev.actor.email}</span> moved to{" "}
                          <span className="font-semibold text-accent-green">{STAGE_LABELS[ev.toStage] ?? ev.toStage}</span>
                        </p>
                        <p className="text-xs text-text-muted">{format(new Date(ev.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {brief.assignmentEvents.length > 0 && (
                <div className="mt-7">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Assignment History</h3>
                  <div className="space-y-3">
                    {brief.assignmentEvents.map((ev) => (
                      <div key={ev.id} className="glass-panel dark p-3 rounded-lg border border-slate-700/50">
                        <p className="text-sm text-white">
                          <span className="font-medium">{ev.actor.name ?? ev.actor.email}</span> changed assignee from{" "}
                          <span className="text-text-secondary">{ev.fromAssignee ? (ev.fromAssignee.name ?? ev.fromAssignee.email) : "Unassigned"}</span>{" "}
                          to{" "}
                          <span className="text-accent-green">{ev.toAssignee ? (ev.toAssignee.name ?? ev.toAssignee.email) : "Unassigned"}</span>
                        </p>
                        <p className="text-xs text-text-muted mt-1">{format(new Date(ev.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.events.length === 0 && (
                <p className="text-sm text-text-muted mt-2 ml-10">Still in initial stage — no transitions yet.</p>
              )}
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-4">
          <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Assignment</h3>
              {isAdmin && <AssignDropdown brief={brief} onAssigned={() => { void refreshBrief(); }} />}
            </div>
            {brief.assignee ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-green/40 to-emerald-600/40 rounded-full flex items-center justify-center shrink-0 border border-accent-green/30">
                  <span className="text-accent-green text-sm font-semibold">
                    {(brief.assignee.name ?? brief.assignee.email)[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{brief.assignee.name ?? brief.assignee.email}</p>
                  <p className="text-xs text-text-muted">{brief.assignee.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">
                {isAdmin ? "No one assigned yet" : "Unassigned"}
              </p>
            )}
          </div>

          <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Details</h3>
            <dl className="space-y-3">
              {[
                { label: "Submitted", value: format(new Date(brief.createdAt), "MMM d, yyyy") },
                { label: "Budget", value: formatBudget(brief.budgetRange) },
                { label: "Timeline", value: brief.urgency === "asap" ? "ASAP" : brief.urgency.replace(/-/g, " ") },
                { label: "Stage", value: STAGE_LABELS[brief.stage] ?? brief.stage },
                { label: "Notes", value: `${brief.notes.length} note${brief.notes.length !== 1 ? "s" : ""}` },
                { label: "Events", value: `${brief.events.length} transition${brief.events.length !== 1 ? "s" : ""}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <dt className="text-xs text-text-muted shrink-0">{label}</dt>
                  <dd className="text-xs font-medium text-white text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {analysis?.status === "ok" && (
            <div className="glass-panel dark rounded-2xl border border-accent-green/30 p-5 bg-gradient-to-br from-accent-green/5 to-emerald-600/5 shadow-lg shadow-accent-green/5">
              <h3 className="text-xs font-semibold text-accent-green uppercase tracking-wider mb-3">Effort Estimate</h3>
              <p className="text-3xl font-bold text-accent-green mb-0.5">
                {analysis.minHours}–{analysis.maxHours}h
              </p>
              <p className="text-xs text-accent-green/60 mb-3">developer hours</p>
              <div className="flex items-center gap-2">
                <ComplexityDots score={analysis.complexity} />
                <span className="text-xs text-accent-green font-medium">Complexity {analysis.complexity}/5</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showOverride && analysis?.status === "ok" && (
        <OverrideModal analysis={analysis} briefId={briefId} onClose={() => setShowOverride(false)} onSave={() => { void refreshBrief(); }} />
      )}
    </div>
  );
}
