"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  avatar_url: string | null;
  completionPct: number;
  avgQuiz: number;
  totalScore: number;
  isCurrentUser: boolean;
}

export default function CourseLeaderboard({ courseId }: { courseId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/leaderboard?courseId=${courseId}`)
      .then((r) => r.json())
      .then((data) => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [courseId]);

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
    </div>
  );

  if (entries.length === 0) return (
    <p className="text-sm text-slate-500 text-center py-6">No leaderboard data yet — be the first to complete lessons!</p>
  );

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs font-bold text-slate-500 w-4 text-center">{rank}</span>;
  };

  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div
          key={e.studentId}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
            e.isCurrentUser
              ? "bg-indigo-950/60 border border-indigo-700/40"
              : "hover:bg-slate-800/50"
          )}
        >
          {/* Rank */}
          <div className="w-5 flex items-center justify-center flex-shrink-0">
            {rankIcon(e.rank)}
          </div>

          {/* Avatar */}
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={e.avatar_url ?? ""} />
            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
              {e.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <span className={cn("flex-1 text-sm font-medium truncate", e.isCurrentUser ? "text-indigo-300" : "text-slate-300")}>
            {e.name} {e.isCurrentUser && <span className="text-xs text-indigo-500 ml-1">(You)</span>}
          </span>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
            <span title="Completion">{e.completionPct}%</span>
            {e.avgQuiz > 0 && <span title="Avg Quiz Score" className="text-amber-500">{e.avgQuiz}pts</span>}
            <span className={cn("font-bold", e.isCurrentUser ? "text-indigo-400" : "text-slate-300")}>
              {e.totalScore}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
