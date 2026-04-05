"use client";
import { useState, useEffect, type ElementType } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrendingUp, DollarSign, Target, FileText } from "lucide-react";
import { STAGE_LABELS, CATEGORY_LABELS } from "@/lib/utils";

const STAGE_COLORS_MAP: Record<string, string> = {
  NEW: "#64748b", UNDER_REVIEW: "#3b82f6", PROPOSAL_SENT: "#f59e0b",
  WON: "#00d084", ARCHIVED: "#475569",
};

const CATEGORY_COLORS = ["#00d084","#3b82f6","#f59e0b","#ec4899","#8b5cf6"];

type Analytics = {
  stageCounts: { stage: string; count: number }[];
  categories: { category: string; count: number }[];
  complexityOverTime: { week: string; avg: number }[];
  conversionRate: number;
  revenuePipeline: number;
  totalBriefs: number;
  wonBriefs: number;
};

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: ElementType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
      {sub && <p className="text-xs text-text-muted/70 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1,2].map(i => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-text-muted">Failed to load analytics.</div>;

  const stageChartData = data.stageCounts.map(s => ({
    name: STAGE_LABELS[s.stage] ?? s.stage,
    count: s.count,
    fill: STAGE_COLORS_MAP[s.stage] ?? "#94a3b8",
  }));

  const categoryData = data.categories.map(c => ({
    name: CATEGORY_LABELS[c.category] ?? c.category,
    value: c.count,
  }));

  const revenueFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(data.revenuePipeline);

  return (
    <div className="p-6 space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={FileText} label="Total Briefs" value={data.totalBriefs}
          color="bg-slate-700/50 border border-slate-700/50 text-text-secondary" />
        <MetricCard icon={Target} label="Conversion Rate" value={`${data.conversionRate}%`}
          sub={`${data.wonBriefs} won`} color="bg-accent-green/30 border border-accent-green/30 text-accent-green" />
        <MetricCard icon={DollarSign} label="Revenue Pipeline" value={revenueFormatted}
          sub="Active briefs" color="bg-amber-500/30 border border-amber-500/30 text-amber-300" />
        <MetricCard icon={TrendingUp} label="Avg Complexity"
          value={data.complexityOverTime.length > 0
            ? (data.complexityOverTime.reduce((s, d) => s + d.avg, 0) / data.complexityOverTime.length).toFixed(1)
            : "—"}
          sub="out of 5" color="bg-blue-500/30 border border-blue-500/30 text-blue-300" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By stage bar chart */}
        <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Briefs by Stage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #475569", backgroundColor: "#1f2937", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                labelStyle={{ fontWeight: 600, color: "#f1f5f9" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {stageChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Complexity over time */}
        <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Avg Complexity Over Time</h3>
          {data.complexityOverTime.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-text-muted">Not enough data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.complexityOverTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #475569", backgroundColor: "#1f2937" }}
                  formatter={(value) => [typeof value === "number" ? value.toFixed(1) : String(value ?? ""), "Avg complexity"]}
                />
                <Line type="monotone" dataKey="avg" stroke="#00d084" strokeWidth={2}
                  dot={{ fill: "#00d084", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categories pie */}
        <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Top Project Categories</h3>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-text-muted">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #475569", backgroundColor: "#1f2937" }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 12, color: "#94a3b8" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversion funnel */}
        <div className="glass-panel dark rounded-2xl border border-slate-700/50 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Pipeline Funnel</h3>
          <div className="space-y-3">
            {data.stageCounts.map(s => {
              const pct = data.totalBriefs > 0 ? Math.round((s.count / data.totalBriefs) * 100) : 0;
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">{STAGE_LABELS[s.stage] ?? s.stage}</span>
                    <span className="text-xs font-medium text-text-secondary">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: STAGE_COLORS_MAP[s.stage] ?? "#94a3b8" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
