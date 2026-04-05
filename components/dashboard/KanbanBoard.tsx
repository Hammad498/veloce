"use client";
import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import BriefCard from "./BriefCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { STAGE_LABELS } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink, UserRoundSearch } from "lucide-react";

const STAGES = ["NEW", "UNDER_REVIEW", "PROPOSAL_SENT", "WON", "ARCHIVED"] as const;
type Stage = typeof STAGES[number];

type Brief = {
  id: string; title: string; contactName: string; budgetRange: string;
  urgency: string; stage: Stage; createdAt: string;
  analysis?: { complexity: number; category: string; minHours: number; maxHours: number; status: string } | null;
  assignee?: { name?: string | null; email: string } | null;
  _count?: { notes: number };
};

type Columns = Record<Stage, Brief[]>;

const STAGE_COUNT_COLOR: Record<Stage, string> = {
  NEW: "bg-slate-700/50 text-slate-300",
  UNDER_REVIEW: "bg-blue-700/50 text-blue-300",
  PROPOSAL_SENT: "bg-amber-700/50 text-amber-300",
  WON: "bg-emerald-700/50 text-emerald-300",
  ARCHIVED: "bg-slate-800/50 text-slate-400",
};

export default function KanbanBoard({ userRole }: { userRole?: string }) {
  const [columns, setColumns] = useState<Columns>({
    NEW: [], UNDER_REVIEW: [], PROPOSAL_SENT: [], WON: [], ARCHIVED: [],
  });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const res = await fetch("/api/briefs/board");
    if (res.ok) {
      const data = await res.json();
      setColumns(data.columns as Columns);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void loadAll();
    });

    return () => cancelAnimationFrame(frame);
  }, [loadAll]);

  // SSE for real-time updates
  useEffect(() => {
    const es = new EventSource("/api/events");
    es.addEventListener("new_brief", () => loadAll());
    es.addEventListener("stage_change", () => loadAll());
    es.addEventListener("analysis_complete", () => loadAll());
    return () => es.close();
  }, [loadAll]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const fromStage = source.droppableId as Stage;
    const toStage = destination.droppableId as Stage;
    const brief = columns[fromStage].find(b => b.id === draggableId);
    if (!brief) return;

    // Optimistic update
    setColumns(prev => {
      const from = [...prev[fromStage]];
      const to = [...prev[toStage]];
      from.splice(source.index, 1);
      to.splice(destination.index, 0, { ...brief, stage: toStage });
      return { ...prev, [fromStage]: from, [toStage]: to };
    });

    // Persist
    const res = await fetch(`/api/briefs/${draggableId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: toStage }),
    });

    if (!res.ok) {
      // Rollback on failure
      setColumns(prev => {
        const from = [...prev[fromStage]];
        const to = [...prev[toStage]];
        const movedIdx = to.findIndex(b => b.id === draggableId);
        if (movedIdx !== -1) {
          to.splice(movedIdx, 1);
          from.splice(source.index, 0, { ...brief, stage: fromStage });
        }
        return { ...prev, [fromStage]: from, [toStage]: to };
      });
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 p-6 overflow-x-auto">
        {STAGES.map(s => (
          <div key={s} className="flex-none w-72">
            <Skeleton className="h-6 w-32 mb-3" />
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 mb-2" />)}
          </div>
        ))}
      </div>
    );
  }

  const totalBriefs = STAGES.reduce((sum, stage) => sum + (columns[stage]?.length ?? 0), 0);

  if (totalBriefs === 0) {
    return (
      <div className="p-6">
        <div className="glass-panel dark border border-slate-700/50 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-accent-green/10 border border-accent-green/30 flex items-center justify-center mx-auto mb-4">
            <UserRoundSearch className="w-7 h-7 text-accent-green" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No briefs to show yet</h3>
          <p className="text-text-secondary max-w-xl mx-auto">
            {userRole === "REVIEWER"
              ? "Your queue is empty. Ask an admin to assign briefs to your account, then refresh this page."
              : "No briefs have been submitted yet. Open the intake form and create the first project brief."}
          </p>
          <div className="mt-6">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-green/30 text-accent-green hover:bg-accent-green/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Intake Form
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-80px)]">
        {STAGES.map(stage => (
          <div key={stage} className="flex-none w-80 flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{STAGE_LABELS[stage]}</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-700/50 ${STAGE_COUNT_COLOR[stage]}`}>
                {columns[stage].length}
              </span>
            </div>

            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`kanban-column transition-all duration-300 min-h-[300px]
                    ${snapshot.isDraggingOver ? "bg-slate-800/80 border-accent-green/60 ring-2 ring-accent-green/40 shadow-lg shadow-accent-green/10" : ""}`}
                >
                  {columns[stage].map((brief, index) => (
                    <Draggable key={brief.id} draggableId={brief.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-3"
                        >
                          <BriefCard brief={brief} isDragging={snapshot.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {columns[stage].length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-32 text-xs text-text-muted border-2 border-dashed border-slate-700/50 rounded-lg hover:border-accent-green/30 transition-colors">
                      <span className="flex flex-col items-center gap-1">
                        Drop briefs here
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
