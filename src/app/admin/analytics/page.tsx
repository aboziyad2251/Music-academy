"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  BookOpen,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    activeUsers: number;
    publishedCourses: number;
    avgCompletion: number;
  };
  weeklyNewUsers: { week: string; count: number }[];
  monthlyRevenue: { month: string; amount: number }[];
  topCourses: { title: string; enrolled: number }[];
  recentTransactions: { student: string; course: string; amount: number; date: string; status: string }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!data) return null;

  const { metrics, weeklyNewUsers, monthlyRevenue, topCourses, recentTransactions } = data;

  const METRIC_CARDS = [
    {
      label: "Total Revenue",
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-950/60",
      border: "border-emerald-800/40",
    },
    {
      label: "Active Users",
      value: String(metrics.activeUsers),
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-950/60",
      border: "border-indigo-800/40",
    },
    {
      label: "Published Courses",
      value: String(metrics.publishedCourses),
      icon: BookOpen,
      color: "text-amber-400",
      bg: "bg-amber-950/60",
      border: "border-amber-800/40",
    },
    {
      label: "Avg. Completion",
      value: `${metrics.avgCompletion}%`,
      icon: TrendingUp,
      color: "text-teal-400",
      bg: "bg-teal-950/60",
      border: "border-teal-800/40",
    },
  ];

  const maxWeekly = Math.max(...weeklyNewUsers.map((w) => w.count), 1);
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.amount), 1);
  const maxEnrolled = Math.max(...topCourses.map((c) => c.enrolled), 1);

  // SVG line chart
  const svgW = 500, svgH = 160, padX = 40, padY = 20;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;
  const points = monthlyRevenue.map((m, i) => {
    const x = padX + (i / Math.max(monthlyRevenue.length - 1, 1)) * chartW;
    const y = padY + chartH - (m.amount / maxRevenue) * chartH;
    return `${x},${y}`;
  });
  const linePath = points.join(" ");

  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-slate-400 mt-1 text-sm">Live platform metrics and performance insights.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-5 space-y-3`}>
            <div className={`h-10 w-10 rounded-lg border ${border} bg-slate-900/60 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart — New Users Per Week */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white text-sm">New Users Per Week</span>
          </div>
          <div className="p-5">
            {weeklyNewUsers.every((w) => w.count === 0) ? (
              <p className="text-center text-slate-600 py-12 text-sm">No new signups in the last 6 weeks.</p>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {weeklyNewUsers.map((w) => (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-indigo-300 font-semibold tabular-nums">{w.count}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
                      style={{ height: `${(w.count / maxWeekly) * 100}%`, minHeight: w.count > 0 ? "8px" : "2px" }}
                    />
                    <span className="text-[10px] text-slate-500 font-medium">{w.week}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SVG Line Chart — Revenue Per Month */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-white text-sm">Revenue Per Month</span>
          </div>
          <div className="p-5">
            {monthlyRevenue.every((m) => m.amount === 0) ? (
              <p className="text-center text-slate-600 py-12 text-sm">No revenue data yet.</p>
            ) : (
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40">
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                  <line key={pct} x1={padX} y1={padY + chartH - pct * chartH}
                    x2={svgW - padX} y2={padY + chartH - pct * chartH}
                    stroke="#334155" strokeWidth="0.5" />
                ))}
                <polygon
                  points={`${padX},${padY + chartH} ${linePath} ${svgW - padX},${padY + chartH}`}
                  fill="url(#areaGrad)" opacity="0.3" />
                <polyline points={linePath} fill="none" stroke="#34d399"
                  strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {monthlyRevenue.map((m, i) => {
                  const x = padX + (i / Math.max(monthlyRevenue.length - 1, 1)) * chartW;
                  const y = padY + chartH - (m.amount / maxRevenue) * chartH;
                  return (
                    <g key={m.month}>
                      <circle cx={x} cy={y} r="4" fill="#34d399" />
                      <text x={x} y={padY + chartH + 14} textAnchor="middle" fill="#64748b" fontSize="10">{m.month}</text>
                      <text x={x} y={y - 8} textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="600">${m.amount}</text>
                    </g>
                  );
                })}
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 5 Courses */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-white text-sm">Top 5 Courses by Enrollment</span>
          </div>
          <div className="p-5 space-y-3">
            {topCourses.length === 0 ? (
              <p className="text-center text-slate-600 py-8 text-sm">No enrollments yet.</p>
            ) : (
              topCourses.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-5 text-end tabular-nums">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{c.title}</p>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${(c.enrolled / maxEnrolled) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 tabular-nums w-8 text-end">{c.enrolled}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-white text-sm">Recent Transactions</span>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-center text-slate-600 py-10 text-sm">No paid transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Course</th>
                    <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t, idx) => (
                    <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-200 font-medium whitespace-nowrap">{t.student}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell truncate max-w-[180px]">{t.course}</td>
                      <td className="px-5 py-3 text-emerald-400 font-semibold tabular-nums">${t.amount}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{t.date}</td>
                      <td className="px-5 py-3">
                        <Badge className="bg-emerald-900/60 text-emerald-400 border border-emerald-800/40">{t.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
