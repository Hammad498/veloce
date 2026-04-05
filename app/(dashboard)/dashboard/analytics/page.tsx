import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <div>
      <div className="glass-panel border-b border-slate-700/50 px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800">
        <h1 className="text-lg font-semibold text-white">Analytics</h1>
        <p className="text-xs text-text-muted mt-0.5">Pipeline performance and AI insights</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
