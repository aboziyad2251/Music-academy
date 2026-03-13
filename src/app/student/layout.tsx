import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentShell from "@/components/student/StudentShell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", session.user.id)
    .single();

  return (
    <StudentShell
      user={{
        full_name: profile?.full_name ?? "Student",
        avatar_url: profile?.avatar_url ?? null,
        role: profile?.role ?? "student",
      }}
    >
      {children}
    </StudentShell>
  );
}
