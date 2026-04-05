import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

// GET /api/admin/coupons — list all coupons
export async function GET() {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select("*, course:course_id(title)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/coupons — create a coupon
export async function POST(req: NextRequest) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { code, discount_type, discount_value, max_uses, expires_at, course_id } = body;

  if (!code || !discount_type || !discount_value) {
    return NextResponse.json({ error: "code, discount_type, and discount_value are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("coupons").insert({
    code: code.toUpperCase().trim(),
    discount_type,
    discount_value: Number(discount_value),
    max_uses: max_uses ? Number(max_uses) : null,
    expires_at: expires_at || null,
    course_id: course_id || null,
    created_by: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
