"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileVideo, FileAudio, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AddLessonPage({ params }: { params: { courseId: string } }) {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ["video/mp4", "video/webm", "audio/mpeg", "audio/wav", "application/pdf"];
      if (!validTypes.includes(selected.type)) {
        toast.error("Unsupported file type. Please upload MP4, MP3, WAV, or PDF.");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required.");

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let fileUrl = null;
      let mediaType = "";

      // Upload if a file is selected
      if (file) {
        if (file.type.startsWith("video/")) mediaType = "video_url";
        else if (file.type.startsWith("audio/")) mediaType = "audio_url";
        else if (file.type === "application/pdf") mediaType = "pdf_url";

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `lessons/${params.courseId}/${fileName}`;

        // Simulated progress for UX (since edge functions don't emit real progress easily in standard js client without custom XMLHTTPReq)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 300);

        const { error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(filePath, file);

        clearInterval(progressInterval);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}. Ensure 'course-content' bucket exists.`);
        }

        setUploadProgress(100);

        const { data: { publicUrl } } = supabase.storage
          .from('course-content')
          .getPublicUrl(filePath);
          
        fileUrl = publicUrl;
      }

      // Determine order index
      const { count } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", params.courseId);

      // Insert lesson
      const payload: any = {
        course_id: params.courseId,
        title,
        description,
        position: (count || 0) + 1,
      };

      if (mediaType && fileUrl) {
        payload[mediaType] = fileUrl;
      }

      const { error: insertError } = await supabase.from("lessons").insert(payload);
      if (insertError) throw insertError;

      toast.success("Lesson added successfully!");
      router.push(`/teacher/courses/${params.courseId}`);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add lesson.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link href={`/teacher/courses/${params.courseId}`} className="text-sm text-slate-500 hover:text-accent mb-4 inline-block">
          &larr; Back to Course
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Lesson</h1>
        <p className="text-slate-500 mt-1">Upload instructional videos, sheet music PDFs, or audio tracks.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">Lesson Title <span className="text-red-500">*</span></label>
          <Input 
            placeholder="e.g. Chapter 1: Basic Scales" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900">Description</label>
          <Textarea 
            placeholder="Brief overview of the lesson..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Media Upload */}
        <div className="space-y-2 pt-4 border-t">
          <label className="text-sm font-semibold text-slate-900">Media Content (Optional)</label>
          <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 hover:border-accent transition-colors bg-slate-50">
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-4 text-slate-400">
                <FileVideo className="h-8 w-8" />
                <FileAudio className="h-8 w-8" />
                <FileText className="h-8 w-8" />
              </div>
              <div className="mt-4 flex flex-col items-center text-sm leading-6 text-slate-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white font-semibold text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 hover:text-accent/80"
                >
                  <span>{file ? file.name : "Upload a file"}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={loading} accept="video/mp4,video/webm,audio/mpeg,audio/wav,application/pdf" />
                </label>
                {!file && <p className="ps-1 mt-1">or drag and drop</p>}
              </div>
              <p className="text-xs leading-5 text-slate-500 mt-2">MP4, WEBM, MP3, WAV or PDF</p>
            </div>
          </div>
          
          {loading && file && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Uploading {file.name}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-slate-100" />
            </div>
          )}
        </div>

        <div className="pt-6 border-t">
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
            {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <UploadCloud className="me-2 h-4 w-4" />}
            {loading ? "Publishing Lesson..." : "Publish Lesson"}
          </Button>
        </div>
      </form>
    </div>
  );
}
