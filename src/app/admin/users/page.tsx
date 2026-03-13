"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";

interface MockUser {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  status: "active" | "suspended";
  joined: string;
  avatar: string;
}

const MOCK_USERS: MockUser[] = [
  { id: "1", full_name: "Tariq Al-Rashid",   email: "tarj123@gmail.com",         role: "admin",   status: "active",    joined: "2024-01-10", avatar: "TR" },
  { id: "2", full_name: "Sofia Martinez",    email: "sofia.m@example.com",        role: "teacher", status: "active",    joined: "2024-02-14", avatar: "SM" },
  { id: "3", full_name: "James Okafor",      email: "j.okafor@example.com",       role: "teacher", status: "active",    joined: "2024-02-28", avatar: "JO" },
  { id: "4", full_name: "Lena Fischer",      email: "lena.f@example.com",         role: "student", status: "active",    joined: "2024-03-05", avatar: "LF" },
  { id: "5", full_name: "Chen Wei",          email: "chen.wei@example.com",       role: "student", status: "active",    joined: "2024-03-18", avatar: "CW" },
  { id: "6", full_name: "Amira Hassan",      email: "a.hassan@example.com",       role: "student", status: "suspended", joined: "2024-04-01", avatar: "AH" },
  { id: "7", full_name: "Daniel Park",       email: "d.park@example.com",         role: "student", status: "active",    joined: "2024-04-22", avatar: "DP" },
  { id: "8", full_name: "Priya Nair",        email: "priya.n@example.com",        role: "teacher", status: "active",    joined: "2024-05-03", avatar: "PN" },
  { id: "9", full_name: "Marcus Bell",       email: "m.bell@example.com",         role: "student", status: "active",    joined: "2024-05-17", avatar: "MB" },
  { id: "10", full_name: "Yuki Tanaka",      email: "yuki.t@example.com",         role: "student", status: "active",    joined: "2024-06-01", avatar: "YT" },
];

const PAGE_SIZE = 5;
const ROLES = ["All", "student", "teacher", "admin"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [page, setPage] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ type: "role" | "suspend"; userId: string; value?: string } | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const applyRoleChange = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole as MockUser["role"] } : u))
    );
    toast.success(`Role updated to ${newRole}.`);
    setConfirmAction(null);
  };

  const toggleSuspend = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "suspended" ? "active" : "suspended" }
          : u
      )
    );
    const user = users.find((u) => u.id === userId);
    toast.success(user?.status === "suspended" ? "User reinstated." : "User suspended.");
    setConfirmAction(null);
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin:   "bg-amber-900/60 text-amber-400 border border-amber-800/40",
      teacher: "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40",
      student: "bg-indigo-900/60 text-indigo-400 border border-indigo-800/40",
    };
    return <Badge className={map[role] ?? "bg-slate-800 text-slate-400"}>{role}</Badge>;
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
                {confirmAction.type === "role" ? "Change Role?" : "Suspend User?"}
              </h3>
            </div>
            <p className="text-sm text-slate-400">
              {confirmAction.type === "role"
                ? `Change this user's role to "${confirmAction.value}"?`
                : `This will ${users.find((u) => u.id === confirmAction.userId)?.status === "suspended" ? "reinstate" : "suspend"} this user's account.`}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                className={confirmAction.type === "suspend" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
                onClick={() => {
                  if (confirmAction.type === "role" && confirmAction.value) {
                    applyRoleChange(confirmAction.userId, confirmAction.value);
                  } else {
                    toggleSuspend(confirmAction.userId);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Users</h1>
        <p className="text-slate-400 mt-1 text-sm">Manage platform accounts and permissions.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? "bg-amber-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-600">No users match your filter.</td>
                </tr>
              ) : (
                paginated.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-700 flex-shrink-0">
                          <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-semibold">
                            {u.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-200 font-medium whitespace-nowrap">{u.full_name}</span>
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
                      <Badge className={u.status === "suspended"
                        ? "bg-red-900/60 text-red-400 border border-red-800/40"
                        : "bg-emerald-900/60 text-emerald-400 border border-emerald-800/40"
                      }>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 text-xs">
                      {new Date(u.joined).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setConfirmAction({ type: "suspend", userId: u.id })}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          u.status === "suspended"
                            ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/70"
                            : "bg-red-900/40 text-red-400 hover:bg-red-900/70"
                        }`}
                      >
                        {u.status === "suspended" ? "Reinstate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length === 0 ? "0 users" : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} users`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-400 px-2">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
