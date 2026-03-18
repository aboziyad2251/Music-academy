"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, CheckCircle2, Clock, Star, BookOpen, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  max_score: number;
  due_date: string | null;
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  status: "pending" | "submitted" | "graded";
  submission: {
    id: string;
    score: number | null;
    feedback: string | null;
    submitted_at: string;
  } | null;
};

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  submitted: { label: "Submitted", icon: CheckCircle2, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  graded: { label: "Graded", icon: Star, color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/assignments")
      .then((r) => r.json())
      .then((data) => {
        setAssignments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? assignments : assignments.filter((a) => a.status === filter);

  const counts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--gold)]/10">
          <ClipboardList className="w-6 h-6 text-[var(--gold)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Assignments</h1>
          <p className="text-sm text-slate-400">{counts.all} total · {counts.pending} pending</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "submitted", "graded"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize ${
              filter === tab
                ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                : "bg-slate-800/60 text-slate-300 border-slate-700 hover:border-[var(--gold)]/50"
            }`}
          >
            {tab} {counts[tab] > 0 && <span className="ml-1 opacity-70">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--gold)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <ClipboardList className="w-12 h-12 opacity-30" />
          <p className="text-lg">No {filter === "all" ? "" : filter} assignments</p>
          {filter === "all" && (
            <p className="text-sm">Assignments from your enrolled courses will appear here.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => {
            const cfg = STATUS_CONFIG[assignment.status];
            const StatusIcon = cfg.icon;
            const isOverdue =
              assignment.due_date &&
              assignment.status === "pending" &&
              new Date(assignment.due_date) < new Date();

            return (
              <Card key={assignment.id} className="bg-slate-800/40 border-slate-700/50 hover:border-slate-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Course + Lesson breadcrumb */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <Link
                          href={`/student/courses/${assignment.course_id}`}
                          className="hover:text-[var(--gold)] transition-colors truncate"
                        >
                          {assignment.course_title}
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="truncate">{assignment.lesson_title}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-white text-base leading-tight">{assignment.title}</h3>

                      {/* Description */}
                      {assignment.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{assignment.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2.5">
                        {assignment.due_date && (
                          <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-slate-400"}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            Due {new Date(assignment.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            {isOverdue && " · Overdue"}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">Max score: {assignment.max_score}</span>

                        {/* Graded score */}
                        {assignment.status === "graded" && assignment.submission?.score !== null && (
                          <span className="text-xs font-semibold text-green-400">
                            Score: {assignment.submission!.score}/{assignment.max_score}
                          </span>
                        )}
                      </div>

                      {/* Feedback */}
                      {assignment.status === "graded" && assignment.submission?.feedback && (
                        <p className="text-xs text-slate-300 mt-2 bg-slate-700/40 rounded-md px-3 py-2 italic">
                          "{assignment.submission.feedback}"
                        </p>
                      )}
                    </div>

                    {/* Status badge + action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                      {assignment.status === "pending" && (
                        <Link
                          href={`/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`}
                          className="text-xs text-[var(--gold)] hover:underline whitespace-nowrap"
                        >
                          Go to lesson →
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
