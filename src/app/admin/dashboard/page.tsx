import { createServerClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";

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

  return (
    <AdminDashboardClient 
      totalUsers={totalUsers}
      totalTeachers={totalTeachers}
      totalStudents={totalStudents}
      totalRevenue={totalRevenue}
      recentUsers={recentUsers}
    />
  );
}
