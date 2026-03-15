"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, PlusCircle, Save, Trash2, CheckCircle2 } from "lucide-react";

interface Question {
  question: string;
  choices: [string, string, string, string];
  correctIndex: number;
}

const emptyQuestion = (): Question => ({
  question: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
});

export default function NewQuizPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  const updateQuestion = (idx: number, field: keyof Question, value: any) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateChoice = (qIdx: number, cIdx: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const choices = [...next[qIdx].choices] as [string, string, string, string];
      choices[cIdx] = value;
      next[qIdx] = { ...next[qIdx], choices };
      return next;
    });
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (idx: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Quiz title is required.");
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return toast.error(`Question ${i + 1} is missing its text.`);
      if (q.choices.some((c) => !c.trim())) return toast.error(`Question ${i + 1} has empty answer choices.`);
    }

    setSaving(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: params.courseId,
          title,
          description,
          passingScore,
          questions,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Quiz created successfully!");
      router.push(`/teacher/courses/${params.courseId}/edit`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create quiz.");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Create Quiz</h1>
        <p className="text-slate-400 mt-1 text-sm">Build a multiple-choice quiz for your students.</p>
      </div>

      {/* Quiz Settings */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-300">Quiz Settings</h2>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Quiz Title <span className="text-red-400">*</span></label>
          <Input
            placeholder="e.g. Chapter 1 Knowledge Check"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Description <span className="text-slate-600 font-normal">(optional)</span></label>
          <Textarea
            placeholder="What should students know before taking this quiz?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Passing Score (%)</label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="bg-slate-950 border-slate-700 text-white max-w-[100px]"
            />
            <span className="text-sm text-slate-500">Students need {passingScore}% or higher to pass.</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-no-flip">
          <h2 className="text-base font-semibold text-slate-300">{questions.length} Question{questions.length !== 1 ? "s" : ""}</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addQuestion}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 flex-no-flip"
          >
            <PlusCircle className="me-1.5 h-4 w-4" /> Add Question
          </Button>
        </div>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between flex-no-flip">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question {qIdx + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">Question Text <span className="text-red-400">*</span></label>
              <Textarea
                placeholder="e.g. What is the root note of the C major scale?"
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                rows={2}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">Answer Choices <span className="text-slate-500 font-normal">— click the circle to mark the correct answer</span></label>
              <div className="space-y-2">
                {q.choices.map((choice, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, "correctIndex", cIdx)}
                      className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        q.correctIndex === cIdx
                          ? "border-emerald-500 bg-emerald-950"
                          : "border-slate-600 hover:border-slate-400"
                      }`}
                      title="Mark as correct answer"
                    >
                      {q.correctIndex === cIdx && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </button>
                    <Input
                      placeholder={`Choice ${String.fromCharCode(65 + cIdx)}`}
                      value={choice}
                      onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)}
                      className={`bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 ${
                        q.correctIndex === cIdx ? "border-emerald-700 ring-1 ring-emerald-900" : ""
                      }`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600">
                Correct answer: <span className="text-emerald-400 font-semibold">Choice {String.fromCharCode(65 + q.correctIndex)}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {saving ? (
          <><Loader2 className="me-2 h-4 w-4 animate-spin" /> Saving Quiz...</>
        ) : (
          <><Save className="me-2 h-4 w-4" /> Save Quiz ({questions.length} questions)</>
        )}
      </Button>
    </div>
  );
}
