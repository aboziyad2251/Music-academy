"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
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

export default function AdminDashboardClient({ 
  totalUsers, 
  totalTeachers, 
  totalStudents, 
  totalRevenue, 
  recentUsers 
}: any) {
  const { t, lang } = useLanguage();

  const statValues: Record<string, string | number> = {
    totalUsers:    totalUsers ?? 0,
    totalTeachers: totalTeachers ?? 0,
    totalStudents: totalStudents ?? 0,
    totalRevenue:  totalRevenue.toLocaleString(),
  };

  const STAT_CONFIG = [
    { key: "totalUsers",    label: t.stats.totalUsers,    icon: Users,         color: "text-[var(--gold)]",  bg: "bg-[var(--gold)]/10",   border: "border-[var(--gold)]/30",   prefix: undefined },
    { key: "totalTeachers", label: t.stats.totalTeachers, icon: GraduationCap, color: "text-[var(--teal)]", bg: "bg-[var(--teal)]/10", border: "border-[var(--teal)]/30", prefix: undefined },
    { key: "totalStudents", label: t.stats.totalStudents, icon: BookOpen,      color: "text-indigo-400",  bg: "bg-indigo-950/60",  border: "border-indigo-800/40",  prefix: undefined },
    { key: "totalRevenue",  label: t.stats.totalRevenue,  icon: DollarSign,    color: "text-[var(--gold-light)]", bg: "bg-[var(--gold)]/10",  border: "border-[var(--gold)]/30",  prefix: "$" },
  ];

  const HEALTH_ITEMS = [
    { label: t.health.database, Icon: Database },
    { label: t.health.auth,     Icon: ShieldCheck },
    { label: t.health.storage,  Icon: HardDrive },
  ];

  const formatDate = (date: string, l: string) =>
    new Date(date).toLocaleDateString(l === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  const getRoleLabel = (role: string) => {
    return t.roles[role as keyof typeof t.roles] || role;
  };

  return (
    <div className="space-y-8 pb-6">
      <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
        <div className="text-sm text-slate-500 hover:text-slate-300 mb-4 inline-block transition-colors flex breadcrumb">
          {t.dashboard.breadcrumb} <span className="mx-2">{lang === 'ar' ? '‹' : '›'}</span> {t.nav.dashboard}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {t.dashboard.title}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">{t.dashboard.subtitle}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, bg, border, prefix }) => (
          <div key={key} className={`stat-card rounded-xl border ${border} ${bg} p-5 space-y-4`}>
            <div className={`h-10 w-10 rounded-lg border ${border} bg-slate-900/60 flex items-center justify-center flex-no-flip`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div dir={lang} className={lang === 'ar' ? 'text-right' : 'text-left'}>
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
            <div className="flex items-center gap-2 flex-no-flip">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-white text-sm">{t.table.recentSignups}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 h-7 text-xs flex-no-flip" asChild>
              <Link href="/admin/users">{t.table.viewAll} <ArrowRight className={lang === "ar" ? "me-1 h-3 w-3 rotate-180" : "ms-1 h-3 w-3"} /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.table.name}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">{t.table.email}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.table.role}</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">{t.table.joined}</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers && recentUsers.length > 0 ? (
                  recentUsers.map((u: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 text-slate-200 font-medium">{u.full_name || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell text-xs">{u.email || "—"}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={`flex-no-flip ${
                          u.role === "admin"   ? "bg-amber-900/60 text-amber-400 border border-amber-800/40" :
                          u.role === "teacher" ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40" :
                                                 "bg-indigo-900/60 text-indigo-400 border border-indigo-800/40"
                        }`}>
                          {getRoleLabel(u.role ?? "student")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell text-xs">
                        {u.created_at ? formatDate(u.created_at, lang) : "—"}
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
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2 flex-no-flip">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-white text-sm">{t.health.title}</span>
            </div>
            <div className="p-4 space-y-3">
              {HEALTH_ITEMS.map(({ label, Icon }) => (
                <div key={label} className="flex items-center justify-between flex-no-flip">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-no-flip">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">{t.health.ok}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <p className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{t.actions.title}</p>
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm h-9 quick-action-btn" asChild>
              <Link href="/admin/users" className="flex items-center">
                <Users className={lang === "ar" ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} /> {t.actions.manageUsers}
              </Link>
            </Button>
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm h-9 quick-action-btn" asChild>
              <Link href="/admin/courses" className="flex items-center">
                <BookOpen className={lang === "ar" ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} /> {t.actions.moderateCourses}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
