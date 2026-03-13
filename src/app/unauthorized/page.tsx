import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UnauthorizedPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role || "student";
  
  let dashboardUrl = "/student/dashboard";
  let dashboardLabel = "Student Dashboard";
  
  if (role === "admin") {
    dashboardUrl = "/admin/dashboard";
    dashboardLabel = "Admin Dashboard";
  } else if (role === "teacher") {
    dashboardUrl = "/teacher/dashboard";
    dashboardLabel = "Teacher Dashboard";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Access Denied
        </h1>
        
        <p className="mb-6 text-slate-500 text-sm">
          You do not have the required permissions to access this page.
        </p>

        <div className="mb-8 rounded-lg bg-slate-50 p-4 border border-slate-100">
          <p className="text-sm text-slate-600 mb-1">Your current role:</p>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent uppercase tracking-wider">
            {role}
          </span>
        </div>

        <Link href={dashboardUrl} passHref>
          <Button className="w-full bg-accent hover:bg-accent/90 text-white h-12 text-lg">
            Return to {dashboardLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
