import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Database,
  ShieldCheck,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STAT_CONFIG = [
  { key: "totalUsers",    label: "Total Users",    icon: Users,         color: "text-amber-400",   bg: "bg-amber-950/60",   border: "border-amber-800/40",   prefix: undefined },
  { key: "totalTeachers", label: "Total Teachers", icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-950/60", border: "border-emerald-800/40", prefix: undefined },
  { key: "totalStudents", label: "Total Students", icon: BookOpen,      color: "text-indigo-400",  bg: "bg-indigo-950/60",  border: "border-indigo-800/40",  prefix: undefined },
  { key: "totalRevenue",  label: "Total Revenue",  icon: DollarSign,    color: "text-teal-400",    bg: "bg-teal-950/60",    border: "border-teal-800/40",    prefix: "$" },
];

const HEALTH_ITEMS = [
  { label: "Database", Icon: Database },
  { label: "Auth",     Icon: ShieldCheck },
  { label: "Storage",  Icon: HardDrive },
];

export default async function AdminDashboardPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const [
    { count: totalUsers },
    { count: totalTeachers },
    { count: totalStudents },
    { data: enrollments },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("enrollments").select("course:course_id(price)"),
    supabase.from("profiles").select("full_name, email, role, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const totalRevenue = enrollments?.reduce(
    (acc: number, e: any) => acc + (e.course?.price ?? 0), 0
  ) ?? 0;

  const statValues: Record<string, string | number> = {
    totalUsers:    totalUsers ?? 0,
    totalTeachers: totalTeachers ?? 0,
    totalStudents: totalStudents ?? 0,
    totalRevenue:  totalRevenue.toLocaleString(),
  };

  return (
    <div className="space-y-8 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Admin Control Panel
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Full platform overview and management.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg, border, prefix }) => (
          <div key={key} className={`rounded-xl border ${border} ${bg} p-5 space-y-4`}>
            <div className={`h-10 w-10 rounded-lg border ${border} bg-slate-900/60 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <div className={`text-3xl font-bold ${color} tabular-nums`}>
                {prefix ?? ""}{statValues[key]}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3-col grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Signups — 2 cols */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-white text-sm">Recent Signups</span>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 h-7 text-xs" asChild>
              <Link href="/admin/users">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.map((u: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 text-slate-200 font-medium">{u.full_name || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell text-xs">{u.email || "—"}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={
                          u.role === "admin"   ? "bg-amber-900/60 text-amber-400 border border-amber-800/40" :
                          u.role === "teacher" ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40" :
                                                 "bg-indigo-900/60 text-indigo-400 border border-indigo-800/40"
                        }>
                          {u.role ?? "student"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-600 text-sm">No users yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Platform Health */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-white text-sm">Platform Health</span>
            </div>
            <div className="p-4 space-y-3">
              {HEALTH_ITEMS.map(({ label, Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">OK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm h-9" asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" /> Manage Users
              </Link>
            </Button>
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm h-9" asChild>
              <Link href="/admin/courses">
                <BookOpen className="mr-2 h-4 w-4" /> Moderate Courses
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
