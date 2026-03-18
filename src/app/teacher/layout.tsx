import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TeacherShell from "@/components/teacher/TeacherShell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  // Fetch ungraded submissions count
  const { count: ungradedCount } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .is("score", null)
    .in(
      "assignment_id",
      (
        await supabase
          .from("assignments")
          .select("id")
          .in(
            "lesson_id",
            (
              await supabase
                .from("lessons")
                .select("id")
                .in(
                  "course_id",
                  (
                    await supabase
                      .from("courses")
                      .select("id")
                      .eq("teacher_id", user.id)
                  ).data?.map((c: any) => c.id) ?? []
                )
            ).data?.map((l: any) => l.id) ?? []
          )
      ).data?.map((a: any) => a.id) ?? []
    );

  return (
    <TeacherShell
      user={{
        full_name: profile?.full_name ?? "Teacher",
        avatar_url: profile?.avatar_url ?? null,
        role: profile?.role ?? "teacher",
      }}
      ungradedCount={ungradedCount ?? 0}
    >
      {children}
    </TeacherShell>
  );
}
