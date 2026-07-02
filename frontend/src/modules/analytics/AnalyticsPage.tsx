import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { MetricEventType, RecommendationSeverity } from "../../types/api";
import { analyticsApi } from "./api";

const EVENT_TYPES: MetricEventType[] = [
  "lead_created",
  "lead_converted",
  "deal_won",
  "deal_lost",
  "ticket_created",
  "ticket_resolved",
  "campaign_sent",
  "workflow_completed"
];

const SEVERITY_STYLES: Record<RecommendationSeverity, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-800"
};

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function TrendPanel() {
  const [eventType, setEventType] = useState<MetricEventType>("lead_created");
  const trendQuery = useQuery({
    queryKey: ["trend", eventType],
    queryFn: () => analyticsApi.trend(eventType, 30, 7)
  });

  const chartData = [
    ...(trendQuery.data?.history.map((p) => ({ date: p.date, actual: p.count, projected: null as number | null })) ?? []),
    ...(trendQuery.data?.projection.map((p) => ({ date: p.date, actual: null as number | null, projected: p.count })) ??
      [])
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trend forecasting</h2>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as MetricEventType)}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {trendQuery.data && trendQuery.data.trend !== "insufficient_data" ? (
        <>
          <p className="mt-1 text-xs text-slate-500">
            Trend: <strong className="text-slate-700">{trendQuery.data.trend}</strong> (
            {trendQuery.data.slope_per_day >= 0 ? "+" : ""}
            {trendQuery.data.slope_per_day}/day) — simple linear projection, not a full ML forecast.
          </p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={20} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#0f172a" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke="#2563eb"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Not enough recorded events yet for {eventType.replace(/_/g, " ")} — log a few below to see a trend.
        </p>
      )}
    </section>
  );
}

function RecordEventForm({ onRecorded }: { onRecorded: () => void }) {
  const [eventType, setEventType] = useState<MetricEventType>("deal_won");
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: () => analyticsApi.recordEvent(eventType, value ? Number(value) : undefined),
    onSuccess: () => {
      setValue("");
      onRecorded();
    }
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Log a metric event</h2>
      <p className="mt-1 text-xs text-slate-500">
        Other modules (leads, sales, campaigns) will call this automatically once built — use this to try the
        dashboard with sample data now.
      </p>
      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as MetricEventType)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        >
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Value (optional, e.g. revenue)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-48 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Record event
        </button>
      </form>
    </section>
  );
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const overviewQuery = useQuery({ queryKey: ["dashboard-overview"], queryFn: analyticsApi.overview });
  const recommendationsQuery = useQuery({
    queryKey: ["dashboard-recommendations"],
    queryFn: analyticsApi.recommendations
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-recommendations"] });
    queryClient.invalidateQueries({ queryKey: ["trend"] });
  };

  const sales = overviewQuery.data?.sales;
  const leads = overviewQuery.data?.leads;
  const support = overviewQuery.data?.support;
  const openBacklog = support
    ? Object.entries(support.by_status)
        .filter(([status]) => ["new", "open", "escalated"].includes(status))
        .reduce((sum, [, count]) => sum + count, 0)
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-950">Analytics & Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Real-time revenue, lead conversion, and support metrics, plus trend forecasting and rule-based
          growth recommendations.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Revenue won" value={`$${(sales?.revenue_won ?? 0).toLocaleString()}`} />
        <MetricCard
          label="Win rate"
          value={sales?.win_rate_percent != null ? `${sales.win_rate_percent}%` : "—"}
          sub={sales ? `${sales.deals_won} won · ${sales.deals_lost} lost` : undefined}
        />
        <MetricCard
          label="Lead conversion"
          value={leads?.conversion_rate_percent != null ? `${leads.conversion_rate_percent}%` : "—"}
          sub={leads ? `${leads.leads_converted} of ${leads.leads_created}` : undefined}
        />
        <MetricCard label="Open ticket backlog" value={openBacklog} sub="new + open + escalated" />
      </div>

      <TrendPanel />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Growth recommendations</h2>
        <div className="mt-3 space-y-2">
          {recommendationsQuery.data?.recommendations.map((rec, i) => (
            <div key={i} className={`rounded-md border p-3 text-sm ${SEVERITY_STYLES[rec.severity]}`}>
              <span className="font-medium capitalize">{rec.area.replace(/_/g, " ")}:</span> {rec.message}
            </div>
          ))}
        </div>
      </section>

      {support && support.agent_performance.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Employee performance</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Agent</th>
                <th className="pb-2">Open</th>
                <th className="pb-2">Resolved</th>
                <th className="pb-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {support.agent_performance.map((agent) => (
                <tr key={agent.assigned_to__id}>
                  <td className="py-2 font-medium text-slate-900">{agent.assigned_to__username}</td>
                  <td className="py-2">{agent.open_count}</td>
                  <td className="py-2">{agent.resolved_count}</td>
                  <td className="py-2">{agent.total_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <RecordEventForm onRecorded={refresh} />
    </div>
  );
}
