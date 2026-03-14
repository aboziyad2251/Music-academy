import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
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

  const role = profile?.role ?? "student";

  if (role === "admin") {
    redirect("/admin/dashboard");
  } else if (role === "teacher") {
    redirect("/teacher/dashboard");
  } else {
    redirect("/student/dashboard");
  }
}

import { getServerI18n } from "@/lib/i18n/server";
// inside your page...
const { t } = await getServerI18n();
<h1>{t("welcomeMessage")}</h1>

