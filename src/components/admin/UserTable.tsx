"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, ShieldAlert, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function UserTable() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: string; value?: string } | null>(null);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&pageSize=${PAGE_SIZE}&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const executeAction = async () => {
    if (!confirmAction) return;
    const { userId, action, value } = confirmAction;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, value }),
    });
    if (res.ok) {
      toast.success(action === "role" ? "Role updated." : "Account suspended.");
      fetchUsers();
    } else {
      toast.error("Failed to update user.");
    }
    setConfirmAction(null);
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    teacher: "bg-blue-100 text-blue-700",
    student: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirm Action</h3>
            <p className="text-sm text-slate-600">
              {confirmAction.action === "role"
                ? `Change this user's role to "${confirmAction.value}"?`
                : "Suspend this user? They will be unable to log in."}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={executeAction}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="ps-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
          <p className="text-slate-500">No users found.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-start px-6 py-3 font-semibold text-slate-600">User</th>
                <th className="text-start px-6 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-start px-6 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-start px-6 py-3 font-semibold text-slate-600">Joined</th>
                <th className="text-start px-6 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-start px-6 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback>{u.full_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      className={`text-xs font-bold px-2 py-1 rounded-full border-0 cursor-pointer ${roleColors[u.role] || ""}`}
                      value={u.role}
                      onChange={(e) => setConfirmAction({ userId: u.id, action: "role", value: e.target.value })}
                    >
                      <option value="student">student</option>
                      <option value="teacher">teacher</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <Badge className={u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {u.is_active ? "Active" : "Suspended"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => setConfirmAction({ userId: u.id, action: "suspend" })}
                      >
                        <ShieldAlert className="me-1 h-3 w-3" /> Suspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-4 w-4 me-1" /> Previous
        </Button>
        <span className="text-sm text-slate-500">Page {page + 1}</span>
        <Button variant="outline" disabled={users.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4 ms-1" />
        </Button>
      </div>
    </div>
  );
}
