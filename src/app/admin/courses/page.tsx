"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, Archive, Trash2, ShieldAlert, BookOpen, Users, DollarSign, Loader2, Edit, UserPlus, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Course {
  id: string;
  title: string;
  teacher_name: string;
  thumbnail_url: string | null;
  status: "draft" | "pending_review" | "published" | "archived";
  enrolled: number;
  revenue: number;
}

interface UserResult {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  alreadyEnrolled: boolean;
}

const TABS = ["All", "Pending Review", "Draft", "Published", "Archived"] as const;

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject" | "archive" | "delete"; courseId: string; courseName?: string } | null>(null);
  const [actioning, setActioning] = useState(false);

  // Enroll modal
  const [enrollModal, setEnrollModal] = useState<{ courseId: string; courseTitle: string } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/courses");
    const json = await res.json();
    setCourses(json.courses ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Enroll modal handlers
  const searchUsers = useCallback(async (query: string, courseId: string) => {
    setUserSearchLoading(true);
    const res = await fetch(`/api/admin/enroll?search=${encodeURIComponent(query)}&courseId=${courseId}`);
    if (res.ok) { const d = await res.json(); setUserResults(d.users ?? []); }
    setUserSearchLoading(false);
  }, []);

  useEffect(() => {
    if (!enrollModal) return;
    const t = setTimeout(() => searchUsers(userSearch, enrollModal.courseId), 300);
    return () => clearTimeout(t);
  }, [userSearch, enrollModal, searchUsers]);

  useEffect(() => {
    if (enrollModal) { setUserSearch(""); setUserResults([]); searchUsers("", enrollModal.courseId); }
  }, [enrollModal]);

  const handleEnroll = async (userId: string) => {
    if (!enrollModal) return;
    setEnrolling(userId);
    const res = await fetch("/api/admin/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId: enrollModal.courseId }),
    });
    if (res.ok) {
      toast.success("Student enrolled successfully!");
      searchUsers(userSearch, enrollModal.courseId);
      fetchCourses();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Enrollment failed");
    }
    setEnrolling(null);
  };

  const pendingCount = courses.filter((c) => c.status === "pending_review").length;

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.teacher_name.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "All"
      || (activeTab === "Pending Review" && c.status === "pending_review")
      || c.status.toLowerCase() === activeTab.toLowerCase();
    return matchSearch && matchTab;
  });

  const handleAction = async (type: string, courseId: string) => {
    setActioning(true);
    try {
      if (type === "delete") {
        const res = await fetch(`/api/admin/courses?courseId=${courseId}`, { method: "DELETE" });
        if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
        toast.success("Course deleted.");
      } else {
        const statusMap: Record<string, string> = { approve: "published", reject: "draft", archive: "archived" };
        const res = await fetch("/api/admin/courses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, status: statusMap[type] }),
        });
        if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
        toast.success(type === "approve" ? "Course published." : type === "reject" ? "Course moved to draft." : "Course archived.");
      }
      await fetchCourses();
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setActioning(false);
      setConfirmAction(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      published:      "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40",
      draft:          "bg-slate-700/60 text-slate-300 border border-slate-600/40",
      archived:       "bg-red-900/60 text-red-400 border border-red-800/40",
      pending_review: "bg-amber-900/60 text-amber-400 border border-amber-800/40",
    };
    const labels: Record<string, string> = {
      pending_review: "Pending Review",
    };
    return <Badge className={map[status] || "bg-slate-800 text-slate-400"}>{labels[status] ?? status}</Badge>;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2"><UserPlus className="h-4 w-4 text-indigo-400" /> Enroll User</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">{enrollModal.courseTitle}</p>
              </div>
              <button onClick={() => setEnrollModal(null)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-5 py-4 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="ps-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {userSearchLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>
              ) : userResults.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">No users found</p>
              ) : userResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.full_name ?? "—"}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email} · <span className="capitalize">{u.role}</span></p>
                  </div>
                  {u.alreadyEnrolled ? (
                    <span className="text-xs text-emerald-400 font-semibold flex-shrink-0 ms-3">Enrolled ✓</span>
                  ) : (
                    <button
                      onClick={() => handleEnroll(u.id)}
                      disabled={enrolling === u.id}
                      className="ms-3 flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {enrolling === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                      Enroll
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-400 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">
                {confirmAction.type === "delete" ? "Delete Course?" : confirmAction.type === "approve" ? "Approve Course?" : confirmAction.type === "archive" ? "Archive Course?" : "Reject Course?"}
              </h3>
            </div>
            <p className="text-sm text-slate-400">
              {confirmAction.type === "delete" ? "This is permanent. All lessons, assignments and submissions will be deleted." : `Are you sure you want to ${confirmAction.type} this course?`}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setConfirmAction(null)} disabled={actioning}>Cancel</Button>
              <Button
                className={confirmAction.type === "delete" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
                onClick={() => handleAction(confirmAction.type, confirmAction.courseId)}
                disabled={actioning}
              >
                {actioning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Course Management</h1>
        <p className="text-slate-400 mt-1 text-sm">Moderate, approve, or remove platform courses.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === t ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
              {t}
              {t === "Pending Review" && pendingCount > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input placeholder="Search courses or teachers..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="ps-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500" />
          </div>
          <Link href="/admin/courses/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
              Create New Course
            </Button>
          </Link>
        </div>
      </div>


      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Title</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Teacher</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell"><div className="flex items-center gap-1"><Users className="h-3 w-3" /> Enrolled</div></th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell"><div className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Revenue</div></th>
                <th className="text-end px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-600">No courses match your filter.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                        {c.thumbnail_url ? (
                          <Image src={c.thumbnail_url} alt={c.title} fill className="object-cover" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <span className="text-slate-200 font-medium">{c.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs hidden md:table-cell">{c.teacher_name}</td>
                  <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                  <td className="px-5 py-3.5 text-slate-300 tabular-nums hidden lg:table-cell">{c.enrolled}</td>
                  <td className="px-5 py-3.5 text-emerald-400 font-medium tabular-nums hidden lg:table-cell">${c.revenue}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      {/* Enroll user button — always visible */}
                      <button
                        onClick={() => setEnrollModal({ courseId: c.id, courseTitle: c.title })}
                        className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-900/40"
                        title="Enroll User"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      {c.status === "pending_review" && (
                        <>
                          <button
                            onClick={() => setConfirmAction({ type: "approve", courseId: c.id, courseName: c.title })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-800/60 text-emerald-300 hover:bg-emerald-800 text-xs font-semibold"
                            title="Approve & Publish"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: "reject", courseId: c.id, courseName: c.title })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/70 text-xs font-semibold"
                            title="Reject (move to Draft)"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </>
                      )}
                      {c.status !== "pending_review" && (
                        <>
                          <Link href={`/teacher/courses/${c.id}`} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-900/40" title="Edit / Manage">
                            <Edit className="h-4 w-4" />
                          </Link>
                          {c.status !== "published" && (
                            <button onClick={() => setConfirmAction({ type: "approve", courseId: c.id })} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/40" title="Approve"><CheckCircle className="h-4 w-4" /></button>
                          )}
                          {c.status === "published" && (
                            <button onClick={() => setConfirmAction({ type: "reject", courseId: c.id })} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-900/40" title="Move to Draft"><XCircle className="h-4 w-4" /></button>
                          )}
                          {c.status !== "archived" && (
                            <button onClick={() => setConfirmAction({ type: "archive", courseId: c.id })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700" title="Archive"><Archive className="h-4 w-4" /></button>
                          )}
                        </>
                      )}
                      <button onClick={() => setConfirmAction({ type: "delete", courseId: c.id })} className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/40" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
