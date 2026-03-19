"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  User,
  Mail,
  BookOpen,
  Award,
  CheckCircle2,
  Pencil,
  X,
  Save,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

interface ProfileData {
  profile: {
    full_name: string;
    email: string;
    bio: string;
    avatar_url: string | null;
    role: string;
  };
  stats: {
    coursesEnrolled: number;
    lessonsCompleted: number;
    certificatesEarned: number;
  };
  courses: Array<{
    id: string;
    title: string;
    category: string | null;
    level: string | null;
    teacherName: string | null;
    progressPct: number;
    completedLessons: number;
    totalLessons: number;
    certificateEarned: boolean;
  }>;
  certificates: Array<{
    id: string;
    title: string;
    teacherName: string | null;
    category: string | null;
  }>;
}

export default function StudentProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("");

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setNameInput(d.profile.full_name);
        setBioInput(d.profile.bio);
        setAvatarInput(d.profile.avatar_url ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    if (!data) return;
    setNameInput(data.profile.full_name);
    setBioInput(data.profile.bio);
    setAvatarInput(data.profile.avatar_url ?? "");
    setEditing(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: nameInput, bio: bioInput, avatar_url: avatarInput }),
      });
      if (!res.ok) throw new Error("Save failed");
      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                full_name: nameInput,
                bio: bioInput,
                avatar_url: avatarInput || null,
              },
            }
          : prev
      );
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) return null;

  const { profile, stats, courses, certificates } = data;

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "ST";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <h1 className="text-2xl font-extrabold text-white tracking-tight">My Profile</h1>

      {/* Profile card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-24 bg-gradient-to-r from-indigo-900/60 via-slate-800 to-indigo-900/60 relative">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 60%)" }} />
        </div>

        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20 border-4 border-slate-900 shadow-xl">
                <AvatarImage src={editing ? avatarInput : (profile.avatar_url ?? "")} />
                <AvatarFallback className="bg-indigo-900 text-indigo-200 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name + role + edit button */}
            <div className="flex-1 min-w-0 pb-1">
              {editing ? (
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="text-lg font-bold bg-slate-800 border-slate-600 text-white max-w-xs"
                  placeholder="Your full name"
                />
              ) : (
                <h2 className="text-xl font-extrabold text-white truncate">{profile.full_name}</h2>
              )}
              <Badge className="mt-1 bg-indigo-600/40 text-indigo-300 border border-indigo-700/50 text-xs capitalize">
                {profile.role}
              </Badge>
            </div>

            {/* Edit / Save / Cancel */}
            <div className="flex gap-2 flex-shrink-0">
              {editing ? (
                <>
                  <Button
                    onClick={saveProfile}
                    disabled={saving || !nameInput.trim()}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 me-1.5" />}
                    Save
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <X className="h-4 w-4 me-1.5" /> Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={startEdit} size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Pencil className="h-4 w-4 me-1.5" /> Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span>{profile.email}</span>
          </div>

          {/* Bio */}
          <div className="mt-3">
            {editing ? (
              <Textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                rows={2}
                className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-600 resize-none text-sm"
              />
            ) : profile.bio ? (
              <p className="text-sm text-slate-400 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-slate-600 italic">No bio yet. Click Edit Profile to add one.</p>
            )}
          </div>

          {/* Avatar URL input (only in edit mode) */}
          {editing && (
            <div className="mt-3">
              <label className="text-xs text-slate-500 mb-1 block">Avatar URL (paste an image link)</label>
              <Input
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
                placeholder="https://..."
                className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-600 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "Courses Enrolled", value: stats.coursesEnrolled, color: "text-indigo-400", bg: "bg-indigo-950/40 border-indigo-800/40" },
          { icon: CheckCircle2, label: "Lessons Completed", value: stats.lessonsCompleted, color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/40" },
          { icon: Award, label: "Certificates Earned", value: stats.certificatesEarned, color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/40" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-extrabold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            Certificates Earned
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="rounded-xl bg-slate-900 border border-amber-800/40 p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{cert.title}</p>
                  {cert.teacherName && (
                    <p className="text-xs text-slate-500 mt-0.5">by {cert.teacherName}</p>
                  )}
                  {cert.category && (
                    <Badge className="mt-1 bg-amber-900/40 text-amber-400 border-amber-800/40 text-xs capitalize">
                      {cert.category}
                    </Badge>
                  )}
                </div>
                <Link
                  href={`/student/courses/${cert.id}/certificate`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex-shrink-0 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All courses progress */}
      {courses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            My Courses
          </h2>
          <div className="rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 overflow-hidden">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/student/courses/${course.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {course.title}
                    </p>
                    {course.certificateEarned && (
                      <Award className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {course.completedLessons}/{course.totalLessons} lessons
                  </p>
                  <Progress value={course.progressPct} className="h-1 mt-1.5 bg-slate-800" />
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${course.progressPct === 100 ? "text-amber-400" : "text-white"}`}>
                  {course.progressPct}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">
            You haven&apos;t enrolled in any courses yet.{" "}
            <Link href="/student/courses" className="text-indigo-400 hover:underline">
              Browse courses
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
