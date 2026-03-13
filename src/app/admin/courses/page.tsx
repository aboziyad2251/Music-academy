"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  Archive,
  Trash2,
  ShieldAlert,
  BookOpen,
  Users,
  DollarSign,
} from "lucide-react";

interface MockCourse {
  id: string;
  title: string;
  teacher: string;
  status: "draft" | "published" | "archived";
  enrolled: number;
  revenue: number;
}

const MOCK_COURSES: MockCourse[] = [
  { id: "1", title: "Jazz Piano Masterclass",          teacher: "Sofia Martinez",  status: "published", enrolled: 34,  revenue: 1360 },
  { id: "2", title: "Acoustic Guitar for Beginners",   teacher: "James Okafor",    status: "published", enrolled: 52,  revenue: 1300 },
  { id: "3", title: "Classical Violin Essentials",      teacher: "Priya Nair",      status: "draft",     enrolled: 0,   revenue: 0 },
  { id: "4", title: "Music Theory Bootcamp",           teacher: "Sofia Martinez",  status: "archived",  enrolled: 18,  revenue: 540 },
  { id: "5", title: "Advanced Drum Techniques",         teacher: "James Okafor",    status: "draft",     enrolled: 0,   revenue: 0 },
  { id: "6", title: "Vocal Training: Pop & R&B",       teacher: "Priya Nair",      status: "published", enrolled: 27,  revenue: 1080 },
];

const TABS = ["All", "Draft", "Published", "Archived"] as const;

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<MockCourse[]>(MOCK_COURSES);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "archive" | "delete";
    courseId: string;
  } | null>(null);

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      activeTab === "All" || c.status.toLowerCase() === activeTab.toLowerCase();
    return matchSearch && matchTab;
  });

  const handleAction = (type: string, courseId: string) => {
    if (type === "approve") {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: "published" as const } : c))
      );
      toast.success("Course approved and published.");
    } else if (type === "reject") {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: "draft" as const } : c))
      );
      toast.success("Course rejected and moved to draft.");
    } else if (type === "archive") {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: "archived" as const } : c))
      );
      toast.success("Course archived.");
    } else if (type === "delete") {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      toast.success("Course permanently deleted.");
    }
    setConfirmAction(null);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      published: "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40",
      draft:     "bg-slate-700/60 text-slate-300 border border-slate-600/40",
      archived:  "bg-red-900/60 text-red-400 border border-red-800/40",
    };
    return <Badge className={map[status] || "bg-slate-800 text-slate-400"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Confirm Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-400 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">
                {confirmAction.type === "delete"
                  ? "Delete Course?"
                  : confirmAction.type === "approve"
                  ? "Approve Course?"
                  : confirmAction.type === "archive"
                  ? "Archive Course?"
                  : "Reject Course?"}
              </h3>
            </div>
            <p className="text-sm text-slate-400">
              {confirmAction.type === "delete"
                ? "This is permanent. All lessons, assignments and submissions will be deleted."
                : `Are you sure you want to ${confirmAction.type} this course?`}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </Button>
              <Button
                className={
                  confirmAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }
                onClick={() => handleAction(confirmAction.type, confirmAction.courseId)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Course Management
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Moderate, approve, or remove platform courses.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === t
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search courses or teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Course Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Teacher
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> Enrolled
                  </div>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Revenue
                  </div>
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-14 text-center text-slate-600"
                  >
                    No courses match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-4 w-4 text-amber-400" />
                        </div>
                        <span className="text-slate-200 font-medium whitespace-nowrap">
                          {c.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs hidden md:table-cell">
                      {c.teacher}
                    </td>
                    <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                    <td className="px-5 py-3.5 text-slate-300 tabular-nums hidden lg:table-cell">
                      {c.enrolled}
                    </td>
                    <td className="px-5 py-3.5 text-emerald-400 font-medium tabular-nums hidden lg:table-cell">
                      ${c.revenue}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        {c.status !== "published" && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                type: "approve",
                                courseId: c.id,
                              })
                            }
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/40 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {c.status !== "draft" && c.status !== "archived" && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                type: "reject",
                                courseId: c.id,
                              })
                            }
                            className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-900/40 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {c.status !== "archived" && (
                          <button
                            onClick={() =>
                              setConfirmAction({
                                type: "archive",
                                courseId: c.id,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: "delete",
                              courseId: c.id,
                            })
                          }
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/40 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
