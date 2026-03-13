"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  UserPlus,
  Trash2,
  X,
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
const ROLES = ["All", "student", "teacher", "admin"] as const;

export default function AdminUsersPage() {
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
        toast.success("User deleted.");
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
        toast.success(confirmAction.type === "role" ? "Role updated." : "User status updated.");
      }
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setActioning(false);
      setConfirmAction(null);
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
      toast.success("User created successfully.");
      setShowAddModal(false);
      setAddForm({ email: "", password: "", fullName: "", role: "student" });
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user.");
    } finally {
      setAdding(false);
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin:   "bg-amber-900/60 text-amber-400 border border-amber-800/40",
      teacher: "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40",
      student: "bg-indigo-900/60 text-indigo-400 border border-indigo-800/40",
    };
    return <Badge className={map[role] ?? "bg-slate-800 text-slate-400"}>{role}</Badge>;
  };

  const initials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Confirm Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className={`h-6 w-6 flex-shrink-0 ${confirmAction.type === "delete" ? "text-red-400" : "text-amber-400"}`} />
              <h3 className="text-lg font-bold text-white">
                {confirmAction.type === "delete" ? "Delete User?" :
                 confirmAction.type === "role" ? "Change Role?" : "Update User Status?"}
              </h3>
            </div>
            <p className="text-sm text-slate-400">
              {confirmAction.type === "delete"
                ? "This will permanently delete the user and all their data. This cannot be undone."
                : confirmAction.type === "role"
                ? `Change this user's role to "${confirmAction.value}"?`
                : (() => {
                    const u = users.find((u) => u.id === confirmAction.userId);
                    return u?.is_active ? "This will suspend the user's account." : "This will reinstate the user's account.";
                  })()}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setConfirmAction(null)} disabled={actioning}>
                Cancel
              </Button>
              <Button
                className={confirmAction.type === "delete" ? "bg-red-600 hover:bg-red-700 text-white" :
                  confirmAction.type === "suspend" ? "bg-red-600 hover:bg-red-700 text-white" :
                  "bg-amber-600 hover:bg-amber-700 text-white"}
                onClick={applyAction}
                disabled={actioning}
              >
                {actioning ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  confirmAction.type === "delete" ? "Delete" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add New User</h3>
              <button onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address <span className="text-red-400">*</span></label>
                <Input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password <span className="text-red-400">*</span></label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role <span className="text-red-400">*</span></label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowAddModal(false)} disabled={adding}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage platform accounts and permissions.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-1.5">
          {ROLES.map((r) => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}>
              {r === "All" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500 mx-auto" />
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-600">No users match your filter.</td></tr>
              ) : paginated.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-slate-700 flex-shrink-0">
                        <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-semibold">
                          {initials(u.full_name, u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-slate-200 font-medium whitespace-nowrap">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs hidden md:table-cell">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => setConfirmAction({ type: "role", userId: u.id, value: e.target.value })}
                      className="bg-transparent text-xs font-semibold rounded-lg px-2 py-1 border border-slate-700 text-slate-300 cursor-pointer focus:outline-none focus:border-amber-500"
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <Badge className={u.is_active
                      ? "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40"
                      : "bg-red-900/60 text-red-400 border border-red-800/40"}>
                      {u.is_active ? "active" : "suspended"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmAction({ type: "suspend", userId: u.id })}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          u.is_active
                            ? "bg-red-900/40 text-red-400 hover:bg-red-900/70"
                            : "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/70"
                        }`}
                      >
                        {u.is_active ? "Suspend" : "Reinstate"}
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: "delete", userId: u.id })}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length === 0
              ? "0 users"
              : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} users`}
          </p>
          <div className="flex items-center gap-1">
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
