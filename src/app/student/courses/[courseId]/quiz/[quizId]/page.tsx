"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
  Trophy,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  choices: string[];
  position: number;
}

interface Submission {
  score: number;
  passed: boolean;
  answers: number[];
}

export default function StudentQuizPage({
  params,
}: {
  params: { courseId: string; quizId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correct: number;
    total: number;
  } | null>(null);
  const [previousSubmission, setPreviousSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetch(`/api/quiz/${params.quizId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          router.push(`/student/courses/${params.courseId}`);
          return;
        }
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(null));
        if (data.submission) {
          setPreviousSubmission(data.submission);
        }
      })
      .catch(() => toast.error("Failed to load quiz."))
      .finally(() => setLoading(false));
  }, [params.quizId]);

  const selectAnswer = (qIdx: number, cIdx: number) => {
    if (result || previousSubmission) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = cIdx;
      return next;
    });
  };

  const handleSubmit = async () => {
    const unanswered = answers.findIndex((a) => a === null);
    if (unanswered !== -1) {
      toast.error(`Please answer question ${unanswered + 1} before submitting.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: params.quizId, answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const displaySubmission = result ?? (previousSubmission ? {
    score: previousSubmission.score,
    passed: previousSubmission.passed,
    correct: 0,
    total: questions.length,
  } : null);

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-6">
      <div>
        <Link
          href={`/student/courses/${params.courseId}`}
          className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="me-2 h-4 w-4" /> Back to Course
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{quiz?.title}</h1>
            {quiz?.description && (
              <p className="text-sm text-slate-400 mt-0.5">{quiz.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Result Banner */}
      {displaySubmission && (
        <div className={`rounded-2xl border p-6 text-center ${
          displaySubmission.passed
            ? "bg-emerald-950/60 border-emerald-800"
            : "bg-red-950/60 border-red-800"
        }`}>
          <div className="flex justify-center mb-3">
            {displaySubmission.passed ? (
              <Trophy className="h-12 w-12 text-amber-400" />
            ) : (
              <XCircle className="h-12 w-12 text-red-400" />
            )}
          </div>
          <h2 className={`text-3xl font-extrabold ${displaySubmission.passed ? "text-emerald-300" : "text-red-300"}`}>
            {displaySubmission.score}%
          </h2>
          <p className={`text-sm mt-1 font-semibold ${displaySubmission.passed ? "text-emerald-400" : "text-red-400"}`}>
            {displaySubmission.passed ? "Passed!" : "Not passed yet"} · Passing score: {quiz?.passing_score ?? 70}%
          </p>
          {result && (
            <p className="text-slate-400 text-sm mt-2">
              {result.correct} out of {result.total} questions correct
            </p>
          )}
          {previousSubmission && !result && (
            <p className="text-slate-500 text-xs mt-2">This is your previous submission.</p>
          )}
          <div className="flex gap-3 justify-center mt-5">
            <Link href={`/student/courses/${params.courseId}`}>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Back to Course
              </Button>
            </Link>
            {!displaySubmission.passed && (
              <Button
                onClick={() => {
                  setResult(null);
                  setPreviousSubmission(null);
                  setAnswers(new Array(questions.length).fill(null));
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      {!displaySubmission && (
        <>
          <div className="text-sm text-slate-500">
            {questions.length} question{questions.length !== 1 ? "s" : ""} · Passing score: {quiz?.passing_score ?? 70}%
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div key={q.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
                <p className="text-sm font-semibold text-white">
                  <span className="text-slate-500 me-2">{qIdx + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.choices.map((choice, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => selectAnswer(qIdx, cIdx)}
                      className={`w-full text-start px-4 py-3 rounded-xl border text-sm transition-all ${
                        answers[qIdx] === cIdx
                          ? "border-indigo-600 bg-indigo-950/60 text-indigo-200"
                          : "border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                      }`}
                    >
                      <span className="font-semibold me-2 text-slate-500">
                        {String.fromCharCode(65 + cIdx)}.
                      </span>
                      {choice}
                    </button>
                  ))}
                </div>
                {answers[qIdx] !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Answer selected
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sticky bottom-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting || answers.some((a) => a === null)}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white text-base shadow-xl"
            >
              {submitting ? (
                <><Loader2 className="me-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                `Submit Quiz (${answers.filter((a) => a !== null).length}/${questions.length} answered)`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
