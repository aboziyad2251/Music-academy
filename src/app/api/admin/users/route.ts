import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "0");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
  const search = url.searchParams.get("search") || "";

  const supabase = createAdminClient();
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function PATCH(req: NextRequest) {
  const { userId, action, value } = await req.json();
  const supabase = createAdminClient();

  if (action === "role") {
    const { error } = await supabase.from("profiles").update({ role: value }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Notify user of role change
    await supabase.from("notifications").insert({
      user_id: userId,
      message: `Your account role was updated to ${value.toUpperCase()}`,
      link: `/${value}/dashboard`
    });
  } else if (action === "suspend") {
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
