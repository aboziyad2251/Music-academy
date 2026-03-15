"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  FileText,
  Play,
  Music,
  ArrowLeft,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";

interface GradingPanelProps {
  teacherId: string;
}

export default function GradingPanel({ teacherId }: GradingPanelProps) {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestedScore: number; suggestedFeedback: string } | null>(null);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchUngraded();
  }, []);

  const fetchUngraded = async () => {
    setLoading(true);

    const { data: courses } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", teacherId);

    if (!courses?.length) { setLoading(false); return; }
    const courseIds = courses.map((c: any) => c.id);

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .in("course_id", courseIds);

    if (!lessons?.length) { setLoading(false); return; }
    const lessonIds = lessons.map((l: any) => l.id);

    const { data: assignments } = await supabase
      .from("assignments")
      .select("id, title, description, max_score, lesson_id")
      .in("lesson_id", lessonIds);

    if (!assignments?.length) { setLoading(false); return; }
    const assignmentIds = assignments.map((a: any) => a.id);

    const { data: subs } = await supabase
      .from("submissions")
      .select("*, student:student_id(full_name, email, avatar_url)")
      .in("assignment_id", assignmentIds)
      .is("score", null)
      .order("submitted_at", { ascending: true });

    const assignmentMap: Record<string, any> = {};
    assignments.forEach((a: any) => { assignmentMap[a.id] = a; });

    setSubmissions((subs || []).map((s: any) => ({
      ...s,
      assignment: assignmentMap[s.assignment_id],
    })));
    setLoading(false);
  };

  const openDetail = (sub: any) => {
    setSelectedSub(sub);
    setScore("");
    setFeedback("");
    setAiSuggestion(null);
  };

  const getAiSuggestion = async () => {
    if (!selectedSub) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade_feedback",
          assignmentTitle: selectedSub.assignment?.title,
          assignmentDescription: selectedSub.assignment?.description,
          maxScore: selectedSub.assignment?.max_score || 100,
          studentNotes: selectedSub.notes,
        }),
      });
      const data = await res.json();
      setAiSuggestion(data);
    } catch {
      toast.error("Failed to get AI suggestion.");
    } finally {
      setAiLoading(false);
    }
  };

  const submitGrade = async () => {
    if (!selectedSub || !score) return;
    setGrading(true);
    try {
      const res = await fetch("/api/teacher/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: selectedSub.id, score, feedback }),
      });
      if (!res.ok) throw new Error("Failed to save grade");
      toast.success("Grade submitted!");
      setSubmissions((prev) => prev.filter((s) => s.id !== selectedSub.id));
      setSelectedSub(null);
    } catch {
      toast.error("Failed to save grade.");
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (selectedSub) {
    const maxScore = selectedSub.assignment?.max_score || 100;
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setSelectedSub(null)}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="me-2 h-4 w-4" /> Back to Queue
        </Button>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between flex-no-flip">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedSub.assignment?.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-no-flip">
                <User className="h-3.5 w-3.5" />
                <span className="text-slate-400 font-medium">{selectedSub.student?.full_name || "Unknown"}</span>
                <span>·</span>
                <Clock className="h-3.5 w-3.5" />
                {new Date(selectedSub.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <Badge className="bg-amber-900/60 text-amber-400 border border-amber-800/40">Max: {maxScore}</Badge>
          </div>

          <div className="p-6 space-y-6">
            {/* File Viewer */}
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Submitted File</h4>
              {selectedSub.file_url ? (
                <>
                  {selectedSub.file_url.match(/\.(mp4|webm|mov)/i) ? (
                    <video src={selectedSub.file_url} controls className="w-full rounded-lg max-h-80" />
                  ) : selectedSub.file_url.match(/\.(mp3|wav|ogg|m4a)/i) ? (
                    <audio src={selectedSub.file_url} controls className="w-full" />
                  ) : selectedSub.file_url.includes(".pdf") ? (
                    <iframe src={selectedSub.file_url} className="w-full h-80 rounded-lg border border-slate-700" />
                  ) : (
                    <a href={selectedSub.file_url} target="_blank" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm">
                      <ExternalLink className="h-4 w-4" /> Open File
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-600 italic">No file submitted.</p>
              )}
            </div>

            {/* Student Notes */}
            {selectedSub.notes && (
              <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Student Notes</h4>
                <p className="text-sm text-slate-300">{selectedSub.notes}</p>
              </div>
            )}

            {/* Grading Form */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-bold text-white">Your Grade</h4>
              <div className="flex items-center gap-3 flex-no-flip">
                <Input
                  type="number"
                  min={0}
                  max={maxScore}
                  placeholder="Score"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-28 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                />
                <span className="text-slate-500 font-medium">/ {maxScore}</span>
                {score && (
                  <Badge className={
                    (Number(score) / maxScore) >= 0.8 ? "bg-emerald-900/60 text-emerald-400 border-emerald-800/40" :
                    (Number(score) / maxScore) >= 0.6 ? "bg-amber-900/60 text-amber-400 border-amber-800/40" :
                    "bg-red-900/60 text-red-400 border-red-800/40"
                  }>
                    {Math.round((Number(score) / maxScore) * 100)}%
                  </Badge>
                )}
              </div>
              <Textarea
                placeholder="Written feedback for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>

            {/* AI Suggestion */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={getAiSuggestion}
                disabled={aiLoading}
                className="border-indigo-700 text-indigo-300 hover:bg-indigo-950"
              >
                {aiLoading ? (
                  <><Loader2 className="me-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="me-2 h-4 w-4" /> AI Grade Suggestion</>
                )}
              </Button>

              {aiSuggestion && (
                <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-no-flip">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-bold text-indigo-300">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    <span className="font-bold text-white">Score: </span>
                    {aiSuggestion.suggestedScore} / {maxScore}
                  </p>
                  <p className="text-sm text-slate-400">{aiSuggestion.suggestedFeedback}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScore(String(aiSuggestion.suggestedScore));
                      setFeedback(aiSuggestion.suggestedFeedback);
                    }}
                    className="border-indigo-700 text-indigo-300 hover:bg-indigo-950 text-xs"
                  >
                    Use This Suggestion
                  </Button>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={submitGrade}
              disabled={!score || grading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {grading ? (
                <><Loader2 className="me-2 h-4 w-4 animate-spin" /> Saving Grade...</>
              ) : (
                <><CheckCircle2 className="me-2 h-4 w-4" /> Submit Grade</>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Queue List
  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40">
          <CheckCircle2 className="h-14 w-14 text-emerald-700 mb-4" />
          <h3 className="text-lg font-bold text-white">All caught up!</h3>
          <p className="text-slate-500 mt-1 text-sm">No submissions awaiting grading.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">{submissions.length} submission{submissions.length !== 1 ? "s" : ""} awaiting review</p>
          {submissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => openDetail(sub)}
              className="flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-slate-900 hover:border-amber-700/50 hover:bg-slate-800/60 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4 flex-no-flip">
                <div className="h-11 w-11 rounded-full bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                  {sub.file_url?.includes(".pdf") ? (
                    <FileText className="h-5 w-5" />
                  ) : sub.file_url?.match(/\.(mp4|webm|mov)/i) ? (
                    <Play className="h-5 w-5" />
                  ) : (
                    <Music className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-amber-200 transition-colors">
                    {sub.student?.full_name || "Unknown"}
                  </h4>
                  <p className="text-sm text-slate-500">{sub.assignment?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-no-flip">
                <span className="text-xs text-slate-600">
                  {new Date(sub.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <Badge className="bg-amber-900/60 text-amber-400 border border-amber-800/40 text-xs">Pending</Badge>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
