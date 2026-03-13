import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  const supabase = createAdminClient();
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function PATCH(req: NextRequest) {
  const { userId, action, value } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

  const supabase = createAdminClient();

  if (action === "role") {
    const { error } = await supabase.from("profiles").update({ role: value }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from("notifications").insert({
      user_id: userId,
      message: `Your account role was updated to ${String(value).toUpperCase()}`,
      link: `/${value}/dashboard`,
    });
  } else if (action === "suspend") {
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "reinstate") {
    const { error } = await supabase.from("profiles").update({ is_active: true }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const { email, password, fullName, role } = await req.json();
  if (!email || !password || !role) {
    return NextResponse.json({ error: "email, password and role are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Create auth user (email auto-confirmed)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || "" },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 500 });
  }

  // Upsert profile with the chosen role
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: authData.user.id,
    email,
    full_name: fullName || "",
    role,
    is_active: true,
  });

  if (profileError) {
    // Clean up auth user if profile insert failed
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: authData.user.id });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const supabase = createAdminClient();

  // Delete from auth (cascades to profiles via DB trigger if configured, otherwise manual)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ensure profile row is removed (in case no cascade trigger)
  await supabase.from("profiles").delete().eq("id", userId);

  return NextResponse.json({ success: true });
}
