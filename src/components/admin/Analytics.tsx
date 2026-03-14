"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const supabase = createClient();
  const { t, lang } = useLanguage();
  const [usersByDay, setUsersByDay] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // New users per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at");

    const dayMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      dayMap[d.toISOString().split("T")[0]] = 0;
    }
    recentUsers?.forEach((u: any) => {
      const key = new Date(u.created_at).toISOString().split("T")[0];
      if (dayMap[key] !== undefined) dayMap[key]++;
    });
    setUsersByDay(Object.entries(dayMap).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      users: count,
    })));

    // Top 5 courses by enrollment
    const { data: enrollments } = await supabase.from("enrollments").select("course_id");
    const courseCount: Record<string, number> = {};
    enrollments?.forEach((e: any) => {
      courseCount[e.course_id] = (courseCount[e.course_id] || 0) + 1;
    });
    const sorted = Object.entries(courseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const courseIds = sorted.map((s) => s[0]);
    const { data: courseData } = await supabase.from("courses").select("id, title").in("id", courseIds);
    const courseNames: Record<string, string> = {};
    courseData?.forEach((c: any) => { courseNames[c.id] = c.title; });

    setTopCourses(sorted.map((s) => ({ name: courseNames[s[0]]?.slice(0, 20) || "Untitled", enrollments: s[1] })));

    // Recent transactions
    const { data: recentEnrollments } = await supabase
      .from("enrollments")
      .select("enrolled_at, student:student_id(full_name), course:course_id(title, price)")
      .order("enrolled_at", { ascending: false })
      .limit(10);
    setTransactions(recentEnrollments || []);
  };

  const isRtl = lang === 'ar';

  return (
    <div className={cn("space-y-8", isRtl ? "text-right font-arabic" : "text-left")}>
      {/* New Users Chart */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t.analytics.newUsersTitle}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={usersByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" reversed={isRtl} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" orientation={isRtl ? "right" : "left"} />
            <Tooltip />
            <Line type="monotone" dataKey="users" name={t.analytics.users} stroke="#7C4DFF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Courses Chart */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t.analytics.topCoursesTitle}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topCourses}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" reversed={isRtl} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" orientation={isRtl ? "right" : "left"} />
            <Tooltip />
            <Bar dataKey="enrollments" name={t.analytics.enrollments} fill="#7C4DFF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{t.analytics.recentTransactionsTitle}</h3>
        </div>
        <table className="w-full text-sm" dir={isRtl ? "rtl" : "ltr"}>
          <thead>
            <tr className="border-b bg-slate-50/50">
              <th className="text-start px-6 py-3 font-semibold text-slate-600 font-arabic">{t.analytics.student}</th>
              <th className="text-start px-6 py-3 font-semibold text-slate-600 font-arabic">{t.analytics.course}</th>
              <th className="text-start px-6 py-3 font-semibold text-slate-600 font-arabic">{t.analytics.amount}</th>
              <th className="text-start px-6 py-3 font-semibold text-slate-600 font-arabic">{t.analytics.date}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t_item: any, i: number) => (
              <tr key={i} className="border-b hover:bg-slate-50">
                <td className="px-6 py-3 font-medium">{t_item.student?.full_name || "—"}</td>
                <td className="px-6 py-3 text-slate-600">{t_item.course?.title || "—"}</td>
                <td className="px-6 py-3 text-green-600 font-semibold">
                  {isRtl ? `${t_item.course?.price || 0}$` : `$${t_item.course?.price || 0}`}
                </td>
                <td className="px-6 py-3 text-slate-500">
                  {new Date(t_item.enrolled_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">{t.analytics.noTransactions}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
