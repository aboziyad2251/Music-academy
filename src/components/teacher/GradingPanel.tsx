"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, FileText, Play, Music } from "lucide-react";

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
    // Get teacher's courses
    const { data: courses } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", teacherId);

    if (!courses || courses.length === 0) { setLoading(false); return; }

    const courseIds = courses.map((c: any) => c.id);

    // Get lessons for those courses
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .in("course_id", courseIds);

    if (!lessons || lessons.length === 0) { setLoading(false); return; }

    const lessonIds = lessons.map((l: any) => l.id);

    // Get assignments for those lessons
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id, title, description, max_score, lesson_id")
      .in("lesson_id", lessonIds);

    if (!assignments || assignments.length === 0) { setLoading(false); return; }

    const assignmentIds = assignments.map((a: any) => a.id);

    // Get ungraded submissions
    const { data: subs } = await supabase
      .from("submissions")
      .select("*, student:student_id(full_name, email, avatar_url)")
      .in("assignment_id", assignmentIds)
      .is("score", null)
      .order("submitted_at", { ascending: true });

    // Attach assignment info to each submission
    const assignmentMap: Record<string, any> = {};
    assignments.forEach((a: any) => { assignmentMap[a.id] = a; });

    const enriched = (subs || []).map((s: any) => ({
      ...s,
      assignment: assignmentMap[s.assignment_id],
    }));

    setSubmissions(enriched);
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
      const res = await fetch("/api/ai/claude", {
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
        body: JSON.stringify({
          submissionId: selectedSub.id,
          score,
          feedback
        })
      });

      if (!res.ok) throw new Error("Failed to save grade");
      
      toast.success("Grade submitted successfully!");
      setSubmissions((prev) => prev.filter((s) => s.id !== selectedSub.id));
      setSelectedSub(null);
    } catch {
      toast.error("Failed to save grade.");
    } finally {
      setGrading(false);
    }
  };

  const getFileIcon = (url: string) => {
    if (url?.includes(".pdf")) return <FileText className="h-5 w-5" />;
    if (url?.match(/\.(mp4|webm|mov)/i)) return <Play className="h-5 w-5" />;
    return <Music className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedSub ? (
        /* Detail Panel */
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setSelectedSub(null)}>
            &larr; Back to Queue
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedSub.assignment?.title}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    by <span className="font-medium text-slate-700">{selectedSub.student?.full_name}</span>
                    {" · "}Submitted {new Date(selectedSub.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-accent/10 text-accent border-accent/20">
                  Max: {selectedSub.assignment?.max_score}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* File Viewer */}
              <div className="rounded-xl border bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Submitted File</h4>
                {selectedSub.file_url?.match(/\.(mp4|webm|mov)/i) ? (
                  <video src={selectedSub.file_url} controls className="w-full rounded-lg max-h-96" />
                ) : selectedSub.file_url?.match(/\.(mp3|wav|ogg|m4a)/i) ? (
                  <audio src={selectedSub.file_url} controls className="w-full" />
                ) : selectedSub.file_url?.includes(".pdf") ? (
                  <iframe src={selectedSub.file_url} className="w-full h-96 rounded-lg border" />
                ) : (
                  <a href={selectedSub.file_url} target="_blank" className="text-accent underline">
                    Download File
                  </a>
                )}
              </div>

              {selectedSub.notes && (
                <div className="rounded-xl border p-4 bg-blue-50/50">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Student Notes</h4>
                  <p className="text-slate-600 text-sm">{selectedSub.notes}</p>
                </div>
              )}

              {/* Grading Form */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-slate-900">Your Grade</h4>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={selectedSub.assignment?.max_score || 100}
                    placeholder="Score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-slate-500 font-medium">/ {selectedSub.assignment?.max_score}</span>
                </div>
                <Textarea
                  placeholder="Written feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              {/* AI Suggestion */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={getAiSuggestion}
                  disabled={aiLoading}
                  className="border-accent/30 text-accent hover:bg-accent/10"
                >
                  {aiLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Get AI Suggestion</>
                  )}
                </Button>

                {aiSuggestion && (
                  <Card className="border-accent/30 bg-accent/5">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="text-sm font-bold text-accent">AI Suggestion</span>
                      </div>
                      <p className="text-sm text-slate-700">
                        <span className="font-bold">Score:</span> {aiSuggestion.suggestedScore} / {selectedSub.assignment?.max_score}
                      </p>
                      <p className="text-sm text-slate-700">{aiSuggestion.suggestedFeedback}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScore(String(aiSuggestion.suggestedScore));
                          setFeedback(aiSuggestion.suggestedFeedback);
                        }}
                        className="text-xs"
                      >
                        Use Suggestion
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={submitGrade}
                disabled={!score || grading}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {grading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Submit Grade
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        /* Queue List */
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-slate-900">All caught up!</h3>
              <p className="text-slate-500 mt-1">No submissions awaiting grading.</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => openDetail(sub)}
                className="flex items-center justify-between p-5 rounded-2xl border bg-white shadow-sm hover:border-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    {getFileIcon(sub.file_url)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{sub.student?.full_name || "Unknown"}</h4>
                    <p className="text-sm text-slate-500">{sub.assignment?.title}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(sub.submitted_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
