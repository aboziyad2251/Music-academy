import { createServerClient } from "@/lib/supabase/server";
import GradingPanel from "@/components/teacher/GradingPanel";

export default async function TeacherGradesPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  return (
    <div className="space-y-8 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Grades
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Review and grade student submissions.
        </p>
      </div>

      <GradingPanel teacherId={session.user.id} />
    </div>
  );
}
