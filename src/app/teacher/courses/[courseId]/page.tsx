"use client";
import Image from "next/image";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Video, FileText, Music, PlayCircle, Settings, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ManageCoursePage({ params }: { params: { courseId: string } }) {
  const supabase = createClient();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [params.courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    
    // Fetch Course
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", params.courseId)
      .single();
    
    setCourse(courseData);

    // Fetch Lessons
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", params.courseId)
      .order("position", { ascending: true });
    
    setLessons(lessonsData || []);

    // Fetch Assignments linking to these lessons
    if (lessonsData && lessonsData.length > 0) {
      const lessonIds = lessonsData.map((l) => l.id);
      const { data: assnData } = await supabase
        .from("assignments")
        .select("*")
        .in("lesson_id", lessonIds);
      setAssignments(assnData || []);
    } else {
      setAssignments([]);
    }

    setLoading(false);
  };

  const publishCourse = async () => {
    if (lessons.length === 0) {
      toast.error("You must add at least one lesson before publishing.");
      return;
    }
    const { error } = await supabase
      .from("courses")
      .update({ status: "published" })
      .eq("id", params.courseId);
    
    if (error) {
      toast.error("Failed to publish course.");
    } else {
      toast.success("Course published live!");
      setCourse({ ...course, status: "published" });
    }
  };

  const deleteCourse = async () => {
    if (!confirm("Are you sure? This permanently deletes the course and all content.")) return;
    const { error } = await supabase.from("courses").delete().eq("id", params.courseId);
    if (error) {
      toast.error("Failed to delete.");
    } else {
      toast.success("Course deleted.");
      router.push("/teacher/courses");
    }
  };

  const getMediaIcon = (url: string) => {
    if (!url) return <PlayCircle className="h-5 w-5 text-slate-400" />;
    if (url.includes(".pdf")) return <FileText className="h-5 w-5 text-rose-500" />;
    if (url.match(/\.(mp3|wav|ogg)/i)) return <Music className="h-5 w-5 text-emerald-500" />;
    return <Video className="h-5 w-5 text-accent" />;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
  }

  if (!course) {
    return <div className="text-center py-20 text-slate-500">Course not found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="w-full md:w-1/3 aspect-video bg-slate-100 rounded-xl overflow-hidden shrink-0 border relative">
          {course.thumbnail_url ? (
            <Image src={course.thumbnail_url} className="object-cover" fill alt={course.title} />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-400 relative z-10">No Image</div>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={
              course.status === "published" ? "bg-green-100 text-green-700" :
              course.status === "archived" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"
            }>
              {course.status.toUpperCase()}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{course.category}</Badge>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">{course.level}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{course.title}</h1>
          <p className="text-slate-500 mt-2 line-clamp-2">{course.description}</p>
          <div className="mt-auto pt-4 flex gap-3">
             {course.status !== "published" && (
                <Button onClick={publishCourse} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Publish Live
                </Button>
             )}
             <Link href={`/teacher/courses/${course.id}/edit`}>
               <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Edit Course</Button>
             </Link>
             <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 ml-auto" onClick={deleteCourse}>
                <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Curriculum / Lessons */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Curriculum</h2>
            <Link href={`/teacher/courses/${course.id}/lessons/new`}>
              <Button size="sm" className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {lessons.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-500 bg-slate-50">
                No lessons added yet.
              </div>
            ) : (
              lessons.map((lesson, idx) => (
                <div key={lesson.id} className="flex flex-col gap-2 p-4 bg-white border rounded-xl shadow-sm hover:border-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getMediaIcon(lesson.video_url || lesson.audio_url || lesson.pdf_url)}
                          <span className="text-xs text-slate-500 truncate max-w-[200px]">
                            {lesson.video_url ? "Video" : lesson.audio_url ? "Audio" : lesson.pdf_url ? "Document" : "Text"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Nested assignments for this lesson */}
                  {assignments.filter(a => a.lesson_id === lesson.id).map(assn => (
                    <div key={assn.id} className="ml-11 mt-2 p-3 bg-slate-50 border rounded-lg flex justify-between items-center text-sm">
                       <div>
                         <span className="font-semibold text-slate-700">Assignment:</span> {assn.title}
                       </div>
                       <Badge variant="outline">{assn.max_score} pts</Badge>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assignments Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
            <Link href={`/teacher/courses/${course.id}/assignments/new`}>
               <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                 <PlusCircle className="mr-2 h-4 w-4" /> Add Assignment
               </Button>
            </Link>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            {assignments.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-transparent text-slate-500 bg-slate-50">
                No assignments created yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-4 font-semibold text-slate-600">Title</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{a.title}</td>
                      <td className="p-4 text-slate-500">{a.max_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
