"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2, Save, Image as ImageIcon, PlusCircle,
  Video, FileText, Music, PlayCircle, Trash2, GripVertical,
  ClipboardList, SendHorizonal, CheckCircle2, Clock,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Piano", "Guitar", "Oud", "Vocals", "Drums", "Violin", "Music Theory"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

export default function EditCoursePage({ params }: { params: { courseId: string } }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [courseStatus, setCourseStatus] = useState("draft");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "Piano", level: "Beginner", price: "", thumbnail_url: "",
  });

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", params.courseId)
        .single();

      if (error || !data) {
        toast.error("Course not found.");
        router.push("/teacher/courses");
        return;
      }

      setFormData({
        title: data.title ?? "",
        description: data.description ?? "",
        category: data.category ?? "Piano",
        level: data.level ?? "Beginner",
        price: String(data.price ?? "0"),
        thumbnail_url: data.thumbnail_url ?? "",
      });
      setCourseStatus(data.status ?? "draft");
      if (data.thumbnail_url) setPreviewUrl(data.thumbnail_url);

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", params.courseId)
        .order("position", { ascending: true });

      setLessons(lessonsData || []);

      // Load quizzes
      const quizRes = await fetch(`/api/quiz?courseId=${params.courseId}`);
      if (quizRes.ok) {
        const quizJson = await quizRes.json();
        setQuizzes(quizJson.quizzes ?? []);
      }

      setLoading(false);
    }

    load();
  }, [params.courseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) { toast.error("Title and Price are required."); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      let thumbnailUrl = formData.thumbnail_url;
      if (file) {
        const ext = file.name.split(".").pop();
        const filePath = `course-thumbnails/${session.user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("course-content").upload(filePath, file);
        if (upErr) throw new Error("Failed to upload thumbnail: " + upErr.message);
        thumbnailUrl = supabase.storage.from("course-content").getPublicUrl(filePath).data.publicUrl;
      }
      const { error } = await supabase.from("courses").update({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        price: parseFloat(formData.price),
        thumbnail_url: thumbnailUrl || null,
      }).eq("id", params.courseId);
      if (error) throw error;
      toast.success("Course updated successfully!");
      router.push(`/teacher/courses/${params.courseId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update course.");
    } finally { setSaving(false); }
  };

  const submitForReview = async () => {
    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({ status: "pending_review" })
        .eq("id", params.courseId);
      if (error) throw error;
      setCourseStatus("pending_review");
      toast.success("Course submitted for review! An admin will approve it shortly.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit for review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setDeletingId(lessonId);
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) {
      toast.error("Failed to delete lesson.");
    } else {
      toast.success("Lesson deleted.");
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    }
    setDeletingId(null);
  };

  const getMediaIcon = (lesson: any) => {
    if (lesson.video_url) return <Video className="h-4 w-4 text-indigo-400" />;
    if (lesson.audio_url) return <Music className="h-4 w-4 text-emerald-400" />;
    if (lesson.pdf_url) return <FileText className="h-4 w-4 text-rose-400" />;
    return <PlayCircle className="h-4 w-4 text-slate-500" />;
  };

  const getMediaLabel = (lesson: any) => {
    if (lesson.video_url) return "Video";
    if (lesson.audio_url) return "Audio";
    if (lesson.pdf_url) return "PDF";
    return "Text only";
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div>
        <Link
          href={`/teacher/courses/${params.courseId}`}
          className="text-sm text-slate-500 hover:text-slate-300 mb-4 inline-block transition-colors"
        >
          &larr; Back to Course
        </Link>
        <div className="flex items-start justify-between flex-no-flip gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Edit Course</h1>
            <p className="text-slate-400 mt-1 text-sm">Update your course details and manage lesson materials.</p>
          </div>
          {courseStatus === "draft" && (
            <Button
              onClick={submitForReview}
              disabled={submittingReview}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0 flex-no-flip"
            >
              {submittingReview ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="me-2 h-4 w-4" />}
              Submit for Review
            </Button>
          )}
        </div>
      </div>

      {/* Course status banner */}
      {courseStatus === "pending_review" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-800/50 bg-amber-950/40 px-5 py-4">
          <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Pending Admin Review</p>
            <p className="text-xs text-amber-600 mt-0.5">Your course has been submitted and is awaiting approval. You can still make edits.</p>
          </div>
        </div>
      )}
      {courseStatus === "published" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Published</p>
            <p className="text-xs text-emerald-600 mt-0.5">Your course is live and visible to students.</p>
          </div>
        </div>
      )}

      {/* Course Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800">
        <h2 className="text-base font-semibold text-slate-300 -mb-2">Course Details</h2>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Course Title <span className="text-red-400">*</span></label>
          <Input
            placeholder="e.g. Masterclass: Advanced Jazz Piano"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Course Thumbnail</label>
          <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-700 px-6 py-8 hover:border-emerald-700 transition-colors">
            <div className="text-center w-full">
              {previewUrl ? (
                <div className="relative w-full max-w-sm mx-auto aspect-video rounded-lg overflow-hidden mb-4">
                  <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" />
                </div>
              ) : (
                <ImageIcon className="mx-auto h-12 w-12 text-slate-600" />
              )}
              <div className="mt-4 flex flex-col items-center text-sm text-slate-500">
                <label htmlFor="thumb-upload" className="cursor-pointer font-semibold text-emerald-400 hover:text-emerald-300">
                  <span>{previewUrl ? "Change Image" : "Upload a file"}</span>
                  <input id="thumb-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
                <p className="mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Description</label>
          <Textarea
            placeholder="What will students learn in this course?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Instrument / Category</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 text-slate-200 px-3 py-2 text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Difficulty Level</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 text-slate-200 px-3 py-2 text-sm"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Price (USD) <span className="text-red-400">*</span></label>
          <div className="relative">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <Input
              type="number" min="0" step="0.01" placeholder="0.00"
              className="ps-7 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Lessons / Materials Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Course Materials</h2>
            <p className="text-xs text-slate-500 mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? "s" : ""} · Videos, audio, and PDFs</p>
          </div>
          <Link href={`/teacher/courses/${params.courseId}/lessons/new`}>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <PlusCircle className="me-1.5 h-4 w-4" /> Add Lesson
            </Button>
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <PlayCircle className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No lessons yet</p>
            <p className="text-slate-600 text-sm mt-1">Upload video, audio, or PDF materials for your students.</p>
            <Link href={`/teacher/courses/${params.courseId}/lessons/new`} className="mt-4">
              <Button size="sm" variant="outline" className="border-emerald-700 text-emerald-400 hover:bg-emerald-950">
                <PlusCircle className="me-1.5 h-4 w-4" /> Upload First Lesson
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {lessons.map((lesson, idx) => (
              <div key={lesson.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/40 transition-colors group">
                <GripVertical className="h-4 w-4 text-slate-700 flex-shrink-0" />
                <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{lesson.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getMediaIcon(lesson)}
                    <span className="text-xs text-slate-500">{getMediaLabel(lesson)}</span>
                    {lesson.duration_min && (
                      <span className="text-xs text-slate-600">· {lesson.duration_min} min</span>
                    )}
                  </div>
                </div>
                <Badge
                  className={
                    lesson.video_url ? "bg-indigo-950 text-indigo-300 border-indigo-800 text-xs" :
                    lesson.audio_url ? "bg-emerald-950 text-emerald-300 border-emerald-800 text-xs" :
                    lesson.pdf_url ? "bg-rose-950 text-rose-300 border-rose-800 text-xs" :
                    "bg-slate-800 text-slate-400 border-slate-700 text-xs"
                  }
                >
                  {getMediaLabel(lesson)}
                </Badge>
                <button
                  onClick={() => deleteLesson(lesson.id)}
                  disabled={deletingId === lesson.id}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete lesson"
                >
                  {deletingId === lesson.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Quizzes Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Quizzes</h2>
            <p className="text-xs text-slate-500 mt-0.5">{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} · Multiple-choice assessments for students</p>
          </div>
          <Link href={`/teacher/courses/${params.courseId}/quiz/new`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <PlusCircle className="me-1.5 h-4 w-4" /> Create Quiz
            </Button>
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No quizzes yet</p>
            <p className="text-slate-600 text-sm mt-1">Create multiple-choice quizzes to test your students.</p>
            <Link href={`/teacher/courses/${params.courseId}/quiz/new`} className="mt-4">
              <Button size="sm" variant="outline" className="border-indigo-700 text-indigo-400 hover:bg-indigo-950">
                <PlusCircle className="me-1.5 h-4 w-4" /> Create First Quiz
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{quiz.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {quiz.quiz_questions?.[0]?.count ?? 0} questions · Passing: {quiz.passing_score ?? 70}%
                    </p>
                  </div>
                </div>
                <Badge className="bg-indigo-950 text-indigo-300 border-indigo-800 text-xs">Quiz</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
