import { auth } from "@/lib/auth";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import Link from "next/link";
import { ExternalLink, LayoutGrid } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="glass-panel-dark border-b border-accent-green/10 px-8 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-green/20 to-emerald-600/20 rounded-lg flex items-center justify-center border border-accent-green/20">
            <LayoutGrid className="w-6 h-6 text-accent-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Project Pipeline</h1>
            <p className="text-text-muted text-sm mt-1">
              {user?.role === "ADMIN" ? "Manage all project briefs" : "Your assigned briefs"}
            </p>
          </div>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-green/20 text-accent-green hover:bg-accent-green/10 hover:border-accent-green/40 transition-all duration-300 text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          View Form
        </Link>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-auto">
        <KanbanBoard userRole={user?.role} />
      </div>
    </div>
  );
}
