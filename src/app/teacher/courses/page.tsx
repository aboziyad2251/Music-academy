"use client";
import Image from "next/image";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, PlusCircle, Search, Edit, Image as ImageIcon, Trash2 } from "lucide-react";

export default function TeacherCoursesPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch courses created by this teacher, including enrollment counts and revenue
    const { data: teacherCourses } = await supabase
      .from("courses")
      .select("*, enrollments(id)")
      .eq("teacher_id", session.user.id)
      .order("created_at", { ascending: false });

    // Calculate metrics
    const enriched = (teacherCourses || []).map((course) => {
      const studentCount = course.enrollments?.length || 0;
      const revenue = studentCount * (course.price || 0);
      return { ...course, studentCount, revenue };
    });

    setCourses(enriched);
    setLoading(false);
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course? All data will be lost.")) return;
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
      toast.success("Course deleted successfully.");
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete course.");
    }
  };

  const filtered = courses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      published:      "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40",
      draft:          "bg-slate-700/60 text-slate-300 border border-slate-600/40",
      archived:       "bg-red-900/60 text-red-400 border border-red-800/40",
      pending_review: "bg-amber-900/60 text-amber-400 border border-amber-800/40",
    };
    const labels: Record<string, string> = { pending_review: "In Review" };
    return <Badge className={map[status] || "bg-slate-800 text-slate-400"}>{labels[status] ?? status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Courses</h1>
          <p className="text-slate-500 mt-1">Manage your courses, lessons, and assignments.</p>
        </div>
        <Link href="/teacher/courses/new">
          <Button className="bg-accent hover:bg-accent/90">
            <PlusCircle className="me-2 h-4 w-4" /> Create New Course
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search your courses..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="ps-10" 
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
          <p className="text-slate-500 mb-4">You haven't created any courses matching that search.</p>
          <Link href="/teacher/courses/new">
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
              Create Your First Course
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
             <div key={c.id} className="group flex flex-col rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
               <div className="aspect-video bg-slate-100 relative overflow-hidden">
                 {c.thumbnail_url ? (
                   <Image src={c.thumbnail_url} alt={c.title} fill className="object-cover" />
                 ) : (
                   <div className="flex items-center justify-center w-full h-full text-slate-400">
                     <ImageIcon className="h-10 w-10 opacity-50" />
                   </div>
                 )}
                 <div className="absolute top-3 start-3">
                   {statusBadge(c.status)}
                 </div>
                 <div className="absolute top-3 end-3">
                   <Badge className="bg-black/70 text-white border-0">${c.price || 0}</Badge>
                 </div>
               </div>
               
               <div className="p-5 flex-1 flex flex-col">
                 <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{c.title}</h3>
                 <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{c.description || "No description provided."}</p>
                 
                 <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t text-sm">
                   <div>
                     <p className="text-slate-500 text-xs font-semibold uppercase">Students</p>
                     <p className="font-medium text-slate-900">{c.studentCount}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 text-xs font-semibold uppercase">Revenue</p>
                     <p className="font-medium text-green-600">${c.revenue}</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-2 mt-4">
                   <Link href={`/teacher/courses/${c.id}`} className="flex-1">
                     <Button variant="outline" className="w-full group-hover:bg-accent group-hover:text-white transition-colors">
                       <Edit className="me-2 h-4 w-4" /> Manage
                     </Button>
                   </Link>
                   <Button variant="outline" onClick={() => handleDelete(c.id)} className="px-3 border-red-200 text-red-500 hover:bg-red-50">
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
