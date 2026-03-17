"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle } from "lucide-react";

function getEmbedUrl(url: string): { type: "youtube" | "vimeo" | "file"; embedUrl: string } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1` };
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }
  return { type: "file", embedUrl: url };
}

interface LessonPlayerProps {
  lessonId: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  videoUrl?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  isCompleted?: boolean;
}

export default function LessonPlayer({
  lessonId,
  studentId,
  courseId,
  courseTitle,
  videoUrl,
  audioUrl,
  pdfUrl,
  isCompleted = false,
}: LessonPlayerProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClient();

  const checkCourseCompletion = async () => {
    // Count total lessons in course
    const { count: total } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId);

    if (!total) return;

    // Count completed lessons for this student in this course
    const { data: lessonIds } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId);

    const ids = lessonIds?.map((l: any) => l.id) ?? [];
    const { count: done } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("completed", true)
      .in("lesson_id", ids);

    if (done === total) {
      await supabase.from("notifications").insert({
        user_id: studentId,
        message: `🎉 You completed "${courseTitle}"! View your certificate.`,
        link: `/student/courses/${courseId}/certificate`,
      });
    }
  };

  const handleProgressUpsert = async (pct: number, markedComplete: boolean = false) => {
    try {
      if (!studentId || !lessonId) return;

      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          student_id: studentId,
          lesson_id: lessonId,
          completed: markedComplete || completed,
          watch_pct: parseInt(pct.toFixed(0)),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'student_id, lesson_id' });

      if (error) {
        console.error("Failed to update progress:", error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTimeUpdate = async () => {
    if (!videoRef.current || completed) return;
    
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (duration > 0) {
      const percentage = (current / duration) * 100;
      
      // Auto-complete at 80% mark natively to ensure progress is caught even if they don't click the explicit button
      if (percentage >= 80 && !completed) {
        setCompleted(true);
        await handleProgressUpsert(percentage, true);
        await checkCourseCompletion();
      }
    }
  };

  const markComplete = async () => {
    setLoading(true);
    setCompleted(true);
    
    const currentPct = videoRef.current && videoRef.current.duration > 0 
      ? (videoRef.current.currentTime / videoRef.current.duration) * 100 
      : 100;

    await handleProgressUpsert(currentPct, true);
    await checkCourseCompletion();
    setLoading(false);
  };

  const videoMeta = videoUrl ? getEmbedUrl(videoUrl) : null;

  return (
    <div className="space-y-6">
      {/* Video Content */}
      {videoMeta ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border shadow-lg relative">
          {videoMeta.type === "file" ? (
            <video
              ref={videoRef}
              src={videoMeta.embedUrl}
              controls
              controlsList="nodownload"
              className="h-full w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              poster="/placeholder-video-poster.jpg"
            />
          ) : (
            <iframe
              src={videoMeta.embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      ) : (
        <div className="aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 text-slate-500">
          <PlayCircle className="h-16 w-16 mb-4 opacity-40" />
          <p className="text-sm">No video content for this lesson.</p>
        </div>
      )}

      {/* Audio Content Supplement */}
      {audioUrl && (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Audio Track</h4>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {/* PDF Content Supplement */}
      {pdfUrl && (
        <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Lesson Materials (PDF)</span>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Open PDF
            </Button>
          </a>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={markComplete}
          disabled={completed || loading}
          className={`min-w-[180px] h-12 text-lg transition-all ${
            completed 
              ? "bg-green-500 hover:bg-green-600 text-white" 
              : "bg-accent hover:bg-accent/90 text-white"
          }`}
        >
          {completed ? (
            <>
              <CheckCircle2 className="me-2 h-5 w-5" />
              Completed
            </>
          ) : loading ? (
            "Updating..."
          ) : (
            "Mark as Complete"
          )}
        </Button>
      </div>
    </div>
  );
}
