"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Download, Printer, Search } from "lucide-react";

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  lessonsCompleted: number;
  assignmentsSubmitted: number;
  avgScore: number | null;
  lastActive: string | null;
  progress?: any[];
}

export default function TeacherStudentsPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", session.user.id);
      setCourses(data || []);
      if (data && data.length > 0) setSelectedCourse(data[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchStudents(selectedCourse);
  }, [selectedCourse]);

  const fetchStudents = async (courseId: string) => {
    setLoading(true);

    // Get enrollments for this course
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id, enrolled_at, student:student_id(id, full_name, email)")
      .eq("course_id", courseId);

    if (!enrollments || enrollments.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    // Get lessons in this course
    const { data: lessons } = await supabase.from("lessons").select("id").eq("course_id", courseId);
    const lessonIds = lessons?.map((l: any) => l.id) || [];

    // Get assignment IDs
    let assignmentIds: string[] = [];
    if (lessonIds.length > 0) {
      const { data: assigns } = await supabase.from("assignments").select("id").in("lesson_id", lessonIds);
      assignmentIds = assigns?.map((a: any) => a.id) || [];
    }

    const rows: StudentRow[] = [];
    for (const enr of enrollments) {
      const student = enr.student as any;
      const sid = student?.id;
      if (!sid) continue;

      // Lessons completed
      let lessonsCompleted = 0;
      if (lessonIds.length > 0) {
        const { count } = await supabase
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("student_id", sid)
          .in("lesson_id", lessonIds)
          .eq("completed", true);
        lessonsCompleted = count || 0;
      }

      // Assignments submitted & avg score
      let assignmentsSubmitted = 0;
      let avgScore: number | null = null;
      if (assignmentIds.length > 0) {
        const { data: subs } = await supabase
          .from("submissions")
          .select("score")
          .eq("student_id", sid)
          .in("assignment_id", assignmentIds);

        assignmentsSubmitted = subs?.length || 0;
        const graded = subs?.filter((s: any) => s.score !== null) || [];
        if (graded.length > 0) {
          avgScore = Math.round(graded.reduce((a: number, s: any) => a + s.score, 0) / graded.length);
        }
      }

      // Last active
      let lastActive: string | null = null;
      if (lessonIds.length > 0) {
        const { data: last } = await supabase
          .from("lesson_progress")
          .select("updated_at")
          .eq("student_id", sid)
          .in("lesson_id", lessonIds)
          .order("updated_at", { ascending: false })
          .limit(1);
        lastActive = last?.[0]?.updated_at || null;
      }

      rows.push({
        id: sid,
        full_name: student.full_name || "Unknown",
        email: student.email || "",
        lessonsCompleted,
        assignmentsSubmitted,
        avgScore,
        lastActive,
      });
    }

    setStudents(rows);
    setLoading(false);
  };

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const header = "Name,Email,Lessons Completed,Assignments Submitted,Average Score,Last Active\n";
    const rows = filtered.map(
      (s) => `"${s.full_name}","${s.email}",${s.lessonsCompleted},${s.assignmentsSubmitted},${s.avgScore ?? "N/A"},"${s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "N/A"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_grades.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    window.print();
  };

  const selectedTitle = courses.find((c) => c.id === selectedCourse)?.title || "Course";

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Students</h1>
        <p className="text-slate-400 mt-1 text-sm">View enrolled student progress and performance.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <select
          className="rounded-lg border border-slate-700 bg-slate-900 text-slate-200 px-4 py-2 text-sm font-medium"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={exportCSV} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            <Printer className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40">
          <p className="text-slate-500">No students found for {selectedTitle}.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-left px-6 py-3 font-semibold text-slate-400">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-400 hidden md:table-cell">Lessons</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-400 hidden md:table-cell">Assignments</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-400">Avg Score</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-400 hidden lg:table-cell">Last Active</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <>
                  <tr
                    key={s.id}
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{s.full_name}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{s.lessonsCompleted}</td>
                    <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{s.assignmentsSubmitted}</td>
                    <td className="px-6 py-4">
                      {s.avgScore !== null ? (
                        <Badge className={
                          s.avgScore >= 80 ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40" :
                          s.avgScore >= 60 ? "bg-amber-900/60 text-amber-400 border border-amber-800/40" :
                          "bg-red-900/60 text-red-400 border border-red-800/40"
                        }>
                          {s.avgScore}%
                        </Badge>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-500">
                      {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 text-slate-500">
                      {expandedId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr key={`${s.id}-detail`}>
                      <td colSpan={6} className="px-6 py-6 bg-slate-950/40">
                        <div className="grid grid-cols-3 gap-4 max-w-md">
                          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{s.lessonsCompleted}</div>
                            <div className="text-xs text-slate-500 mt-1">Lessons Done</div>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
                            <div className="text-2xl font-bold text-indigo-400">{s.assignmentsSubmitted}</div>
                            <div className="text-xs text-slate-500 mt-1">Submitted</div>
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
                            <div className="text-2xl font-bold text-amber-400">{s.avgScore ?? "—"}</div>
                            <div className="text-xs text-slate-500 mt-1">Avg Score</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
