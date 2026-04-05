import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/coupons/validate
// Body: { code: string, courseId: string }
// Returns: { valid, discount_type, discount_value, coupon_id, message }
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, courseId } = await req.json();
  if (!code) return NextResponse.json({ valid: false, message: "No code provided" });

  const admin = createAdminClient();
  const { data: coupon, error } = await admin
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return NextResponse.json({ valid: false, message: "الكود غير صحيح أو غير نشط" });
  }

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, message: "انتهت صلاحية هذا الكود" });
  }

  // Check max uses
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, message: "تم استنفاد استخدامات هذا الكود" });
  }

  // Check course restriction
  if (coupon.course_id && coupon.course_id !== courseId) {
    return NextResponse.json({ valid: false, message: "هذا الكود غير صالح لهذه الدورة" });
  }

  return NextResponse.json({
    valid: true,
    coupon_id: coupon.id,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    message: coupon.discount_type === "percentage"
      ? `خصم ${coupon.discount_value}%`
      : `خصم $${coupon.discount_value}`,
  });
}
