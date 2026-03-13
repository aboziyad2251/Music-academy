import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", session.user.id)
    .single();

  return (
    <AdminShell
      user={{
        full_name: profile?.full_name ?? "Admin",
        avatar_url: profile?.avatar_url ?? null,
        role: profile?.role ?? "admin",
      }}
    >
      {children}
    </AdminShell>
  );
}
