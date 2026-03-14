"use client";

import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  BookOpen,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

/* ── mock data ── */
const METRICS = [
  { label: "Total Revenue",   value: "$4,280",   change: "+12%", icon: DollarSign,  color: "text-emerald-400", bg: "bg-emerald-950/60", border: "border-emerald-800/40" },
  { label: "Active Users",    value: "147",       change: "+8%",  icon: Users,       color: "text-indigo-400",  bg: "bg-indigo-950/60",  border: "border-indigo-800/40" },
  { label: "Total Courses",   value: "12",        change: "+2",   icon: BookOpen,    color: "text-amber-400",   bg: "bg-amber-950/60",   border: "border-amber-800/40" },
  { label: "Avg. Completion",  value: "73%",       change: "+5%",  icon: TrendingUp,  color: "text-teal-400",    bg: "bg-teal-950/60",    border: "border-teal-800/40" },
];

const WEEKLY_USERS = [
  { week: "Feb 3", count: 8  },
  { week: "Feb 10", count: 14 },
  { week: "Feb 17", count: 11 },
  { week: "Feb 24", count: 22 },
  { week: "Mar 3", count: 18 },
  { week: "Mar 10", count: 26 },
];

const MONTHLY_REVENUE = [
  { month: "Oct", amount: 420 },
  { month: "Nov", amount: 580 },
  { month: "Dec", amount: 710 },
  { month: "Jan", amount: 650 },
  { month: "Feb", amount: 890 },
  { month: "Mar", amount: 1030 },
];

const TOP_COURSES = [
  { title: "Acoustic Guitar for Beginners", enrolled: 52 },
  { title: "Jazz Piano Masterclass",        enrolled: 34 },
  { title: "Vocal Training: Pop & R&B",     enrolled: 27 },
  { title: "Music Theory Bootcamp",         enrolled: 18 },
  { title: "Classical Violin Essentials",    enrolled: 12 },
];

const TRANSACTIONS = [
  { student: "Chen Wei",       course: "Jazz Piano Masterclass",         amount: 40, date: "Mar 12, 2026", status: "completed" },
  { student: "Daniel Park",    course: "Acoustic Guitar for Beginners",  amount: 25, date: "Mar 11, 2026", status: "completed" },
  { student: "Marcus Bell",    course: "Vocal Training: Pop & R&B",      amount: 40, date: "Mar 10, 2026", status: "completed" },
  { student: "Yuki Tanaka",    course: "Jazz Piano Masterclass",         amount: 40, date: "Mar 9, 2026",  status: "refunded" },
  { student: "Lena Fischer",   course: "Music Theory Bootcamp",          amount: 30, date: "Mar 8, 2026",  status: "completed" },
];

/* ── helpers ── */
const maxWeekly = Math.max(...WEEKLY_USERS.map((w) => w.count));
const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.amount));
const maxEnrolled = Math.max(...TOP_COURSES.map((c) => c.enrolled));

export default function AdminAnalyticsPage() {
  /* SVG line chart points for Revenue */
  const svgW = 500;
  const svgH = 160;
  const padX = 40;
  const padY = 20;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;
  const points = MONTHLY_REVENUE.map((m, i) => {
    const x = padX + (i / (MONTHLY_REVENUE.length - 1)) * chartW;
    const y = padY + chartH - (m.amount / maxRevenue) * chartH;
    return `${x},${y}`;
  });
  const linePath = points.join(" ");

  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Analytics
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Platform metrics and performance insights.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(({ label, value, change, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-5 space-y-3`}>
            <div className={`h-10 w-10 rounded-lg border ${border} bg-slate-900/60 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">{change}</span>
                <span className="text-xs text-slate-600 ms-1">{label}</span>
              </div>
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
            <span className="font-semibold text-white text-sm">
              New Users Per Week
            </span>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-3 h-40">
              {WEEKLY_USERS.map((w) => (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-indigo-300 font-semibold tabular-nums">
                    {w.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
                    style={{ height: `${(w.count / maxWeekly) * 100}%`, minHeight: "8px" }}
                  />
                  <span className="text-[10px] text-slate-500 font-medium">{w.week}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Line Chart — Revenue Per Month */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-white text-sm">
              Revenue Per Month
            </span>
          </div>
          <div className="p-5">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40">
              {/* grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                <line
                  key={pct}
                  x1={padX}
                  y1={padY + chartH - pct * chartH}
                  x2={svgW - padX}
                  y2={padY + chartH - pct * chartH}
                  stroke="#334155"
                  strokeWidth="0.5"
                />
              ))}
              {/* area fill */}
              <polygon
                points={`${padX},${padY + chartH} ${linePath} ${svgW - padX},${padY + chartH}`}
                fill="url(#areaGrad)"
                opacity="0.3"
              />
              {/* line */}
              <polyline
                points={linePath}
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* dots + labels */}
              {MONTHLY_REVENUE.map((m, i) => {
                const x = padX + (i / (MONTHLY_REVENUE.length - 1)) * chartW;
                const y = padY + chartH - (m.amount / maxRevenue) * chartH;
                return (
                  <g key={m.month}>
                    <circle cx={x} cy={y} r="4" fill="#34d399" />
                    <text x={x} y={padY + chartH + 14} textAnchor="middle" fill="#64748b" fontSize="10">
                      {m.month}
                    </text>
                    <text x={x} y={y - 8} textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="600">
                      ${m.amount}
                    </text>
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
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 5 Courses */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-white text-sm">
              Top 5 Courses by Enrollment
            </span>
          </div>
          <div className="p-5 space-y-3">
            {TOP_COURSES.map((c, i) => (
              <div key={c.title} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-5 text-end tabular-nums">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">
                    {c.title}
                  </p>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${(c.enrolled / maxEnrolled) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-400 tabular-nums w-8 text-end">
                  {c.enrolled}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-white text-sm">
              Recent Transactions
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Course
                  </th>
                  <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Date
                  </th>
                  <th className="text-start px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-slate-200 font-medium whitespace-nowrap">
                      {t.student}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell truncate max-w-[180px]">
                      {t.course}
                    </td>
                    <td className="px-5 py-3 text-emerald-400 font-semibold tabular-nums">
                      ${t.amount}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {t.date}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        className={
                          t.status === "completed"
                            ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-900/60 text-red-400 border border-red-800/40"
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
