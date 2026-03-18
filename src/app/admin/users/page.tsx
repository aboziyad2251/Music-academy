"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  UserPlus,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: "student" | "teacher" | "admin";
  is_active: boolean;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { t, lang } = useLanguage();
  const ut = t.usersTable;

  const ROLES = [
    { value: "All",     label: ut.all },
    { value: "student", label: t.roles.student },
    { value: "teacher", label: t.roles.teacher },
    { value: "admin",   label: t.roles.admin },
  ] as const;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(0);

  // Confirm dialog for role/suspend/delete
  const [confirmAction, setConfirmAction] = useState<{
    type: "role" | "suspend" | "delete";
    userId: string;
    value?: string;
  } | null>(null);
  const [actioning, setActioning] = useState(false);

  // Add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "", fullName: "", role: "student" });
  const [adding, setAdding] = useState(false);

  // Enroll in course modal
  const [enrollTarget, setEnrollTarget] = useState<User | null>(null);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const openEnrollModal = async (u: User) => {
    setEnrollTarget(u);
    setSelectedCourseId("");
    if (courses.length === 0) {
      const res = await fetch("/api/admin/courses");
      const json = await res.json();
      setCourses(json.courses ?? []);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollTarget || !selectedCourseId) return;
    setEnrolling(true);
    try {
      const res = await fetch("/api/admin/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: enrollTarget.id, courseId: selectedCourseId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`${enrollTarget.full_name || enrollTarget.email} enrolled successfully.`);
      setEnrollTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  // Invite by email modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("student");
  const [inviting, setInviting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res = await fetch("/api/admin/users?" + params.toString());
    const json = await res.json();
    setUsers(json.users ?? []);
    setLoading(false);
    setPage(0);
  }, [debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = roleFilter === "All" ? users : users.filter((u) => u.role === roleFilter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const applyAction = async () => {
    if (!confirmAction) return;
    setActioning(true);
    try {
      if (confirmAction.type === "delete") {
        const res = await fetch(`/api/admin/users?userId=${confirmAction.userId}`, { method: "DELETE" });
        if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
        toast.success(ut.userDeleted);
      } else {
        const body: any = { userId: confirmAction.userId, action: confirmAction.type };
        if (confirmAction.type === "role") body.value = confirmAction.value;
        if (confirmAction.type === "suspend") {
          const user = users.find((u) => u.id === confirmAction.userId);
          body.action = user?.is_active ? "suspend" : "reinstate";
        }
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
        toast.success(confirmAction.type === "role" ? ut.roleUpdated : ut.userSuspended);
      }
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || ut.actionFailed);
    } finally {
      setActioning(false);
      setConfirmAction(null);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(t.invite.success);
      setShowInviteModal(false);
      setInviteEmail("");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || t.invite.failed);
    } finally {
      setInviting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email || !addForm.password) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(ut.userCreated);
      setShowAddModal(false);
      setAddForm({ email: "", password: "", fullName: "", role: "student" });
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || ut.createFailed);
    } finally {
      setAdding(false);
    }
  };

  const initials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email.slice(0, 2).toUpperCase();
  };

  const locale = lang === "ar" ? "ar-SA" : "en-US";

  const confirmDialogTitle = () => {
    if (confirmAction?.type === "delete") return ut.deleteUser;
    if (confirmAction?.type === "role") return ut.changeRole;
    return ut.updateStatus;
  };

  const confirmDialogBody = () => {
    if (confirmAction?.type === "delete") return ut.confirmDelete;
    if (confirmAction?.type === "role")
      return ut.confirmRoleChange.replace("{role}", t.roles[confirmAction.value as keyof typeof t.roles] ?? confirmAction.value ?? "");
    const u = users.find((u) => u.id === confirmAction?.userId);
    return u?.is_active ? ut.confirmSuspendText : ut.confirmReinstateText;
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Enroll in Course Modal */}
      {enrollTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5 flex-no-flip">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-400" />
                Enroll in Course
              </h3>
              <button onClick={() => setEnrollTarget(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Enroll <span className="text-white font-semibold">{enrollTarget.full_name || enrollTarget.email}</span> into a course without payment.
            </p>
            <form onSubmit={handleEnroll} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Course <span className="text-red-400">*</span></label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">— Choose a course —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2 flex-no-flip">
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setEnrollTarget(null)} disabled={enrolling}>Cancel</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white flex-no-flip" disabled={enrolling || !selectedCourseId}>
                  {enrolling ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <BookOpen className="h-4 w-4 me-2" />}
                  Enroll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 flex-no-flip">
              <ShieldAlert className={`h-6 w-6 flex-shrink-0 ${confirmAction.type === "delete" ? "text-red-400" : "text-amber-400"}`} />
              <h3 className="text-lg font-bold text-white">{confirmDialogTitle()}</h3>
            </div>
            <p className="text-sm text-slate-400">{confirmDialogBody()}</p>
            <div className="flex gap-3 justify-end pt-2 flex-no-flip">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setConfirmAction(null)} disabled={actioning}>
                {ut.cancel}
              </Button>
              <Button
                className={confirmAction.type === "delete" ? "bg-red-600 hover:bg-red-700 text-white" :
                  confirmAction.type === "suspend" ? "bg-red-600 hover:bg-red-700 text-white" :
                  "bg-amber-600 hover:bg-amber-700 text-white"}
                onClick={applyAction} disabled={actioning}
              >
                {actioning ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  confirmAction.type === "delete" ? ut.delete : ut.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite by Email Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5 flex-no-flip">
              <h3 className="text-lg font-bold text-white">{t.invite.modalTitle}</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">{t.invite.inviteUser} — {lang === "ar" ? "سيصل بريد إلكتروني للمستخدم مع رابط لإعداد حسابه" : "The user will receive an email with a link to set up their account."}</p>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.invite.emailLabel} <span className="text-red-400">*</span>
                </label>
                <Input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="student@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2 flex-no-flip">
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowInviteModal(false)} disabled={inviting}>
                  {ut.cancel}
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white flex-no-flip" disabled={inviting}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <UserPlus className="h-4 w-4 me-2" />}
                  {inviting ? t.invite.sending : t.invite.sendBtn}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5 flex-no-flip">
              <h3 className="text-lg font-bold text-white">{ut.addNewUser}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ut.fullName}</label>
                <Input placeholder={lang === "ar" ? "محمد أحمد" : "John Doe"} value={addForm.fullName}
                  onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ut.email} <span className="text-red-400">*</span></label>
                <Input type="email" required dir="ltr" placeholder="user@example.com" value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ut.password} <span className="text-red-400">*</span></label>
                <Input type="password" required minLength={6} placeholder={ut.minChars} value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{ut.role} <span className="text-red-400">*</span></label>
                <select value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                  <option value="student">{t.roles.student}</option>
                  <option value="teacher">{t.roles.teacher}</option>
                  <option value="admin">{t.roles.admin}</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2 flex-no-flip">
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowAddModal(false)} disabled={adding}>{ut.cancel}</Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white flex-no-flip" disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <UserPlus className="h-4 w-4 me-2" />}
                  {ut.createUser}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-no-flip">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{ut.pageTitle}</h1>
          <p className="text-slate-400 mt-1 text-sm">{ut.pageSubtitle}</p>
        </div>
        <div className="flex gap-2 flex-no-flip">
          <Button onClick={() => setShowInviteModal(true)} variant="outline" className="border-indigo-700 text-indigo-300 hover:bg-indigo-900/40 flex-no-flip">
            <UserPlus className="h-4 w-4 me-2" /> {t.invite.inviteUser}
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex-no-flip">
            <UserPlus className="h-4 w-4 me-2" /> {ut.addUser}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder={ut.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-1.5 flex-no-flip">
          {ROLES.map((r) => (
            <button key={r.value} onClick={() => { setRoleFilter(r.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r.value ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{ut.user}</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">{ut.email}</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{ut.role}</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">{ut.status}</th>
                <th className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">{ut.joined}</th>
                <th className="text-end px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{ut.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500 mx-auto" />
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-600">{ut.noMatch}</td></tr>
              ) : paginated.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 flex-no-flip">
                      <Avatar className="h-8 w-8 border border-slate-700 flex-shrink-0">
                        <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-semibold">
                          {initials(u.full_name, u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-slate-200 font-medium whitespace-nowrap">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs hidden md:table-cell" dir="ltr">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <select value={u.role} onChange={(e) => setConfirmAction({ type: "role", userId: u.id, value: e.target.value })}
                      className="bg-transparent text-xs font-semibold rounded-lg px-2 py-1 border border-slate-700 text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500">
                      <option value="student">{t.roles.student}</option>
                      <option value="teacher">{t.roles.teacher}</option>
                      <option value="admin">{t.roles.admin}</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <Badge className={u.is_active ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40" : "bg-red-900/60 text-red-400 border border-red-800/40"}>
                      {u.is_active ? ut.active : ut.suspended}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2 flex-no-flip">
                      {u.role === "student" && (
                        <button onClick={() => openEnrollModal(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-amber-900/30 transition-colors" title="Enroll in course">
                          <BookOpen className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => setConfirmAction({ type: "suspend", userId: u.id })}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${u.is_active ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/70"}`}>
                        {u.is_active ? ut.suspend : ut.reinstate}
                      </button>
                      <button onClick={() => setConfirmAction({ type: "delete", userId: u.id })}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/30 transition-colors" title={ut.delete}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between flex-no-flip">
          <p className="text-xs text-slate-500">
            {filtered.length === 0
              ? `0 ${ut.user}`
              : lang === "ar"
              ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} من ${filtered.length}`
              : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} users`}
          </p>
          <div className="flex items-center gap-1 flex-no-flip">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-400 px-2">{page + 1} / {Math.max(1, totalPages)}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
