"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileVideo, FileAudio, FileText, X, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AddLessonPage({ params }: { params: { courseId: string } }) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState("");
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

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type.startsWith("video/")) return <FileVideo className="h-5 w-5 text-indigo-400" />;
    if (file.type.startsWith("audio/")) return <FileAudio className="h-5 w-5 text-emerald-400" />;
    return <FileText className="h-5 w-5 text-rose-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

      if (file) {
        if (file.type.startsWith("video/")) mediaType = "video_url";
        else if (file.type.startsWith("audio/")) mediaType = "audio_url";
        else if (file.type === "application/pdf") mediaType = "pdf_url";

        const fileExt = file.name.split(".").pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `lessons/${params.courseId}/${fileName}`;

        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 8, 85));
        }, 300);

        const { error: uploadError } = await supabase.storage
          .from("course-content")
          .upload(filePath, file);

        clearInterval(progressInterval);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}. Ensure 'course-content' bucket exists.`);
        }

        setUploadProgress(100);

        const { data: { publicUrl } } = supabase.storage
          .from("course-content")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      const { count } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", params.courseId);

      const payload: any = {
        course_id: params.courseId,
        title,
        description,
        position: (count || 0) + 1,
      };

      if (durationMin) payload.duration_min = parseInt(durationMin, 10);
      if (mediaType && fileUrl) payload[mediaType] = fileUrl;

      const { error: insertError } = await supabase.from("lessons").insert(payload);
      if (insertError) throw insertError;

      toast.success("Lesson added successfully!");
      router.push(`/teacher/courses/${params.courseId}/edit`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add lesson.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div>
        <Link
          href={`/teacher/courses/${params.courseId}/edit`}
          className="text-sm text-slate-500 hover:text-slate-300 mb-4 inline-block transition-colors"
        >
          &larr; Back to Edit Course
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Add New Lesson</h1>
        <p className="text-slate-400 mt-1 text-sm">Upload a video, audio track, or PDF document for your students.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Lesson Title <span className="text-red-400">*</span></label>
          <Input
            placeholder="e.g. Chapter 1: Basic Scales"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Description <span className="text-slate-600 font-normal">(optional)</span></label>
          <Textarea
            placeholder="Brief overview of what this lesson covers..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={loading}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Duration <span className="text-slate-600 font-normal">(minutes, optional)</span></label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 15"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            disabled={loading}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 max-w-[160px]"
          />
        </div>

        {/* Media Upload */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <label className="text-sm font-semibold text-slate-300">
            Upload Material <span className="text-slate-600 font-normal">(optional)</span>
          </label>

          {file ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 border border-slate-700">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {loading && uploadProgress === 100 && (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              )}
            </div>
          ) : (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 px-6 py-10 cursor-pointer hover:border-emerald-700 transition-colors bg-slate-950/50"
            >
              <div className="flex justify-center gap-4 mb-3 text-slate-600">
                <FileVideo className="h-8 w-8" />
                <FileAudio className="h-8 w-8" />
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-emerald-400">Click to upload a file</p>
              <p className="text-xs text-slate-500 mt-1">MP4, WEBM, MP3, WAV, or PDF</p>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                disabled={loading}
                accept="video/mp4,video/webm,audio/mpeg,audio/wav,application/pdf"
              />
            </label>
          )}

          {loading && file && (
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>{uploadProgress < 100 ? "Uploading..." : "Upload complete!"}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-slate-800" />
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-800">
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="me-2 h-4 w-4 animate-spin" /> Publishing Lesson...</>
            ) : (
              <><UploadCloud className="me-2 h-4 w-4" /> Publish Lesson</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
