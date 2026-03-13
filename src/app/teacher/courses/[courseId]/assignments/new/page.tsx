"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Calendar, Target, PlusCircle } from "lucide-react";

export default function AddAssignmentPage({ params }: { params: { courseId: string } }) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    lesson_id: "",
    max_score: "100",
    due_date: "",
  });

  useEffect(() => {
    fetchLessons();
  }, [params.courseId]);

  const fetchLessons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lessons")
      .select("id, title")
      .eq("course_id", params.courseId)
      .order("order_index", { ascending: true });

    const fetchedLessons = data || [];
    setLessons(fetchedLessons);
    if (fetchedLessons.length > 0) {
      setFormData(prev => ({ ...prev, lesson_id: fetchedLessons[0].id }));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.lesson_id) {
      return toast.error("Title and a linked lesson are required.");
    }
    
    setSubmitting(true);
    
    try {
      const payload: any = {
        lesson_id: formData.lesson_id,
        title: formData.title,
        description: formData.description,
        max_score: parseInt(formData.max_score) || 100,
      };

      if (formData.due_date) {
         payload.due_date = new Date(formData.due_date).toISOString();
      }

      const { error } = await supabase.from("assignments").insert(payload);
      if (error) throw error;

      toast.success("Assignment created!");
      router.push(`/teacher/courses/${params.courseId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link href={`/teacher/courses/${params.courseId}`} className="text-sm text-slate-500 hover:text-accent mb-4 inline-block">
          &larr; Back to Course
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add Assignment</h1>
        <p className="text-slate-500 mt-1">Create homework, quizzes, or practice requirements connected to a lesson.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : lessons.length === 0 ? (
         <div className="p-8 text-center border-2 border-dashed rounded-xl bg-orange-50 border-orange-200">
           <p className="text-orange-800 font-medium mb-2">No Lessons Available</p>
           <p className="text-orange-600 text-sm mb-4">You must create at least one lesson before you can add an assignment to this course.</p>
           <Link href={`/teacher/courses/${params.courseId}/lessons/new`}>
             <Button className="bg-orange-600 hover:bg-orange-700">Add Lesson First</Button>
           </Link>
         </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border shadow-sm">
          <div className="space-y-2">
             <label className="text-sm font-semibold text-slate-900">Link to Lesson <span className="text-red-500">*</span></label>
             <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background md:text-sm"
                value={formData.lesson_id}
                onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                required
             >
                <option value="" disabled>Select a lesson</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
             </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Assignment Title <span className="text-red-500">*</span></label>
            <Input 
              placeholder="e.g. Practice C Major Scale" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900">Description / Instructions</label>
            <Textarea 
              placeholder="Record yourself playing... Upload a PDF of..." 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-900 flex items-center gap-1"><Target className="h-4 w-4" /> Max Score</label>
               <Input 
                 type="number" 
                 min="1"
                 value={formData.max_score}
                 onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                 required
               />
             </div>
             
             <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-900 flex items-center gap-1"><Calendar className="h-4 w-4" /> Due Date (Optional)</label>
               <Input 
                 type="datetime-local" 
                 value={formData.due_date}
                 onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
               />
             </div>
          </div>

          <div className="pt-6 border-t">
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {submitting ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
