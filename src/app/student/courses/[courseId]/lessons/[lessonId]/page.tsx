"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LessonPlayer from "@/components/student/LessonPlayer";
import LessonNotes from "@/components/student/LessonNotes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Send,
  UploadCloud,
  GraduationCap,
  Sparkles,
  X,
  Bot,
  ListVideo,
  CheckCircle2,
  Circle,
} from "lucide-react";
import SubmissionForm from "@/components/student/SubmissionForm";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function LessonDetailPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [lesson, setLesson] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseTeacherId, setCourseTeacherId] = useState<string>("");
  const [progress, setProgress] = useState<any>(null);
  const [siblings, setSiblings] = useState<{ prev: any; next: any }>({ prev: null, next: null });
  const [comments, setComments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string>("");
  const [isPosting, setIsPosting] = useState(false);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [navOpen, setNavOpen] = useState(false);

  // AI Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function loadLessonContext() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      setStudentId(session.user.id);

      // Verify enrollment
      const { data: isEnrolled } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", params.courseId)
        .eq("student_id", session.user.id)
        .single();

      if (!isEnrolled) {
        return router.push(`/student/courses/${params.courseId}`);
      }

      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", params.lessonId)
        .single();

      setLesson(lessonData);

      const { data: courseData } = await supabase
        .from("courses")
        .select("title, teacher_id")
        .eq("id", params.courseId)
        .single();
      if (courseData) {
        setCourseTitle(courseData.title);
        setCourseTeacherId(courseData.teacher_id ?? "");
      }

      if (lessonData) {
        const { data: progressData } = await supabase
          .from("lesson_progress")
          .select("*")
          .eq("lesson_id", params.lessonId)
          .eq("student_id", session.user.id)
          .single();

        setProgress(progressData);

        const { data: allLessonsData } = await supabase
          .from("lessons")
          .select("id, position, title")
          .eq("course_id", params.courseId)
          .order("position", { ascending: true });

        if (allLessonsData) {
          const currentIndex = allLessonsData.findIndex((l: any) => l.id === params.lessonId);
          setSiblings({
            prev: currentIndex > 0 ? allLessonsData[currentIndex - 1] : null,
            next: currentIndex < allLessonsData.length - 1 ? allLessonsData[currentIndex + 1] : null,
          });
          setAllLessons(allLessonsData);

          // Load completion status for all lessons
          const { data: progressRows } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("student_id", session.user.id)
            .eq("completed", true)
            .in("lesson_id", allLessonsData.map((l: any) => l.id));

          setCompletedIds(new Set((progressRows ?? []).map((r: any) => r.lesson_id)));
        }
      }

      const { data: commentData } = await supabase
        .from("comments")
        .select("*, author:author_id(full_name, avatar_url)")
        .eq("lesson_id", params.lessonId)
        .order("created_at", { ascending: true });

      if (commentData) setComments(commentData);

      const { data: assignmentData } = await supabase
        .from("assignments")
        .select("*")
        .eq("lesson_id", params.lessonId);

      if (assignmentData && assignmentData.length > 0) {
        setAssignments(assignmentData);
        const assignmentIds = assignmentData.map((a: any) => a.id);
        const { data: subData } = await supabase
          .from("submissions")
          .select("*")
          .eq("student_id", session.user.id)
          .in("assignment_id", assignmentIds);

        if (subData) {
          const subMap: Record<string, any> = {};
          subData.forEach((s: any) => { subMap[s.assignment_id] = s; });
          setSubmissions(subMap);
        }
      }

      setLoading(false);
    }

    loadLessonContext();
  }, [params, supabase, router]);

  // Realtime comments
  useEffect(() => {
    if (!params.lessonId) return;

    const channel = supabase
      .channel(`comments:${params.lessonId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `lesson_id=eq.${params.lessonId}` },
        async (payload: any) => {
          const { data: freshComment } = await supabase
            .from("comments")
            .select("*, author:author_id(full_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (freshComment) setComments((prev) => [...prev, freshComment]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.lessonId, supabase]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !studentId) return;
    setIsPosting(true);
    await supabase.from("comments").insert({
      lesson_id: params.lessonId,
      author_id: studentId,
      content: newComment.trim(),
    });
    setNewComment("");
    setIsPosting(false);
  };

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated,
          lesson_title: lesson?.title ?? "",
          course_title: courseTitle,
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.response ?? data.message ?? data.content ?? "AI tutor is temporarily unavailable. Please try again later.";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center text-slate-500">Lesson not found.</div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-8 pb-24">
        {/* Back + Lesson navigator toggle */}
        <div className="flex items-center justify-between">
          <Link
            href={`/student/courses/${params.courseId}`}
            className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="me-2 h-4 w-4" /> Back to Syllabus
          </Link>
          <button
            onClick={() => setNavOpen(true)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ListVideo className="h-4 w-4" />
            <span className="hidden sm:inline">Lessons</span>
            <span className="text-xs text-slate-600">
              ({completedIds.size}/{allLessons.length})
            </span>
          </button>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Lesson {lesson.position}: {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-slate-400 border-s-2 border-indigo-600 ps-4 py-1">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Player */}
        <LessonPlayer
          lessonId={lesson.id}
          studentId={studentId}
          courseId={params.courseId}
          courseTitle={courseTitle}
          videoUrl={lesson.video_url}
          audioUrl={lesson.audio_url}
          pdfUrl={lesson.pdf_url}
          isCompleted={progress?.completed}
        />

        {/* Notes */}
        <LessonNotes lessonId={params.lessonId} />

        {/* Prev / Next */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {siblings.prev ? (
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              asChild
            >
              <Link href={`/student/courses/${params.courseId}/lessons/${siblings.prev.id}`}>
                <ArrowLeft className="me-2 h-4 w-4" /> Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}
          {siblings.next && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              asChild
            >
              <Link href={`/student/courses/${params.courseId}/lessons/${siblings.next.id}`}>
                Next Lesson <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Assignments */}
        {assignments.length > 0 && (
          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <UploadCloud className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Assignments</h2>
            </div>

            {assignments.map((assignment) => {
              const submission = submissions[assignment.id];
              const isGraded = submission && submission.score !== null;
              const pct = isGraded ? (submission.score / assignment.max_score) * 100 : 0;
              const gradeColor = pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
              const gradeBg = pct >= 80 ? "bg-emerald-950 border-emerald-800" : pct >= 60 ? "bg-amber-950 border-amber-800" : "bg-red-950 border-red-800";

              return (
                <div
                  key={assignment.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden"
                >
                  <div className="p-5 bg-slate-800/50 border-b border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{assignment.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{assignment.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                        Max: {assignment.max_score} pts
                      </Badge>
                      {assignment.due_date && (
                        <span className="text-xs text-slate-500">
                          Due {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    {submission ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-700 text-slate-200 text-xs">Submitted</Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                        </div>

                        {isGraded ? (
                          <div className={`rounded-xl border p-5 ${gradeBg}`}>
                            <div className="flex items-center gap-3 mb-3">
                              <GraduationCap className={`h-5 w-5 ${gradeColor}`} />
                              <h4 className={`font-bold ${gradeColor}`}>
                                {submission.score} / {assignment.max_score} points
                              </h4>
                            </div>
                            {submission.feedback && (
                              <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Teacher Feedback
                                </span>
                                <p className="text-sm text-slate-300">{submission.feedback}</p>
                              </div>
                            )}
                            {submission.ai_feedback && (
                              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-1">
                                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-400">
                                  <Sparkles className="h-3 w-3" /> AI Notes
                                </span>
                                <p className="text-sm text-slate-400 italic">{submission.ai_feedback}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border-2 border-dashed border-amber-800/50 bg-amber-950/30 p-5 text-center">
                            <h4 className="text-amber-300 font-medium text-sm">Awaiting Grade</h4>
                            <p className="text-amber-600/80 text-xs mt-1">
                              Your teacher will review your submission shortly.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <SubmissionForm
                        assignmentId={assignment.id}
                        studentId={studentId}
                        onSuccess={() => {
                          supabase
                            .from("submissions")
                            .select("*")
                            .eq("student_id", studentId)
                            .eq("assignment_id", assignment.id)
                            .single()
                            .then(({ data }: { data: any }) => {
                              if (data) setSubmissions((prev) => ({ ...prev, [assignment.id]: data }));
                            });
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Discussion */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Class Discussion</h2>
          </div>

          <ScrollArea className="h-80 px-5 py-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-3 py-8">
                <MessageSquare className="h-10 w-10 opacity-20" />
                <p className="text-sm">Be the first to start the discussion!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {comments.map((comment) => {
                  const isTeacher = comment.author_id === courseTeacherId;
                  return (
                  <div key={comment.id} className={`flex gap-3 ${isTeacher ? "flex-row" : ""}`}>
                    <Avatar className={`h-8 w-8 flex-shrink-0 border ${isTeacher ? "border-amber-600/60" : "border-slate-700"}`}>
                      <AvatarImage src={comment.author?.avatar_url ?? ""} />
                      <AvatarFallback className={`text-xs ${isTeacher ? "bg-amber-900 text-amber-300" : "bg-indigo-900 text-indigo-300"}`}>
                        {comment.author?.full_name?.substring(0, 2).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-xs ${isTeacher ? "text-amber-400" : "text-slate-300"}`}>
                          {comment.author?.full_name ?? "Student"}
                        </span>
                        {isTeacher && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-700/50 px-1.5 py-0.5 rounded-full">
                            Teacher
                          </span>
                        )}
                        <span className="text-xs text-slate-600">
                          {new Date(comment.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className={`text-sm text-slate-300 rounded-tr-xl rounded-b-xl px-3 py-2 leading-relaxed border ${
                        isTeacher
                          ? "bg-amber-950/40 border-amber-800/50 text-amber-100"
                          : "bg-slate-800 border-slate-700/50"
                      }`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <form onSubmit={postComment} className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 border border-slate-700 hidden sm:flex flex-shrink-0">
                <AvatarFallback className="bg-indigo-900 text-indigo-300 text-xs">ME</AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Ask a question or share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[72px] pe-12 resize-none bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newComment.trim() || isPosting}
                  className="absolute bottom-2 end-2 h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isPosting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── Floating AI Chat Button ── */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 end-6 z-40 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-900/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open AI Chat"
      >
        <Bot className="h-6 w-6 text-white" />
      </button>

      {/* ── AI Chat Panel ── */}
      <div
        className={`fixed top-0 end-0 bottom-0 z-50 w-full sm:w-96 bg-slate-950 border-s border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          chatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Ask Gemini AI</p>
              <p className="text-xs text-slate-500">Lesson tutor assistant</p>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="h-14 w-14 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-sm text-slate-400 font-medium">Hi! I&apos;m your AI tutor.</p>
              <p className="text-xs text-slate-600 leading-relaxed px-4">
                Ask me anything about{" "}
                <span className="text-indigo-400">{lesson?.title}</span> or
                music theory in general.
              </p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-indigo-600"
                      : "bg-slate-800 border border-slate-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span className="text-[10px] font-bold text-white">ME</span>
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {chatLoading && (
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about this lesson..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              className="min-h-[44px] max-h-[120px] resize-none bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500 text-sm"
              rows={1}
            />
            <Button
              onClick={sendChatMessage}
              disabled={!chatInput.trim() || chatLoading}
              size="icon"
              className="h-11 w-11 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">
            Powered by Gemini AI · Press Enter to send
          </p>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setChatOpen(false)}
        />
      )}

      {/* ── Lesson Navigator Panel ── */}
      <div
        className={`fixed top-0 start-0 bottom-0 z-50 w-full sm:w-80 bg-slate-950 border-e border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <div>
            <p className="font-semibold text-white text-sm truncate">{courseTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedIds.size} / {allLessons.length} completed
            </p>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-800 flex-shrink-0">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${allLessons.length > 0 ? (completedIds.size / allLessons.length) * 100 : 0}%` }}
          />
        </div>

        {/* Lesson list */}
        <div className="flex-1 overflow-y-auto py-2">
          {allLessons.map((l: any) => {
            const isCurrent = l.id === params.lessonId;
            const isDone = completedIds.has(l.id);
            return (
              <Link
                key={l.id}
                href={`/student/courses/${params.courseId}/lessons/${l.id}`}
                onClick={() => setNavOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors group ${
                  isCurrent
                    ? "bg-indigo-950/60 border-s-2 border-indigo-500"
                    : "hover:bg-slate-800/50 border-s-2 border-transparent"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className={`h-4 w-4 flex-shrink-0 ${isCurrent ? "text-indigo-400" : "text-slate-600"}`} />
                )}
                <div className="min-w-0">
                  <p className={`text-xs font-medium leading-snug truncate ${
                    isCurrent ? "text-indigo-200" : isDone ? "text-slate-400" : "text-slate-300"
                  }`}>
                    {l.position}. {l.title}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Backdrop for lesson nav on mobile */}
      {navOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}
    </>
  );
}
