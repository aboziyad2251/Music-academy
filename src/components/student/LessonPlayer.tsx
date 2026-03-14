"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PlayCircle } from "lucide-react";

interface LessonPlayerProps {
  lessonId: string;
  studentId: string;
  videoUrl?: string | null;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  isCompleted?: boolean;
}

export default function LessonPlayer({
  lessonId,
  studentId,
  videoUrl,
  audioUrl,
  pdfUrl,
  isCompleted = false,
}: LessonPlayerProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClient();

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

  const handleTimeUpdate = () => {
    if (!videoRef.current || completed) return;
    
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (duration > 0) {
      const percentage = (current / duration) * 100;
      
      // Auto-complete at 80% mark natively to ensure progress is caught even if they don't click the explicit button
      if (percentage >= 80 && !completed) {
        setCompleted(true);
        handleProgressUpsert(percentage, true);
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
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Video Content */}
      {videoUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border shadow-lg relative">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nodownload"
            className="h-full w-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            // For placeholder demo functionality when bad URLs are provided:
            poster="/placeholder-video-poster.jpg" 
          />
        </div>
      ) : (
        <div className="aspect-video w-full rounded-xl bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 text-slate-400">
          <PlayCircle className="h-16 w-16 mb-4 opacity-50" />
          <p>No video content available for this lesson.</p>
        </div>
      )}

      {/* Audio Content Supplement */}
      {audioUrl && (
        <div className="p-4 bg-slate-50 border rounded-xl">
          <h4 className="text-sm font-semibold mb-2">Lesson Audio track:</h4>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {/* PDF Content Supplement */}
      {pdfUrl && (
        <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium">Lesson Materials (PDF)</span>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
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
