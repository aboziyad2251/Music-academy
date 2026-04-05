import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEnrollmentEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, couponCode } = await req.json();
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

    const admin = createAdminClient();

    // Check already enrolled
    const { data: existing } = await admin
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .single();

    if (existing) return NextResponse.json({ enrolled: true });

    // Get course title for notification
    const { data: course } = await admin
      .from("courses")
      .select("title, price")
      .eq("id", courseId)
      .single();

    // Validate coupon if provided
    let couponId: string | null = null;
    let discountApplied = 0;

    if (couponCode) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) >= new Date();
        const hasUses = coupon.max_uses === null || coupon.used_count < coupon.max_uses;
        const courseMatch = !coupon.course_id || coupon.course_id === courseId;

        if (notExpired && hasUses && courseMatch) {
          couponId = coupon.id;
          const price = course?.price ?? 0;
          discountApplied = coupon.discount_type === "percentage"
            ? (price * coupon.discount_value) / 100
            : Math.min(coupon.discount_value, price);

          // Increment used_count
          await admin.from("coupons")
            .update({ used_count: coupon.used_count + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    // Enroll
    const { error } = await admin.from("enrollments").insert({
      course_id: courseId,
      student_id: user.id,
      coupon_id: couponId,
      discount_applied: discountApplied,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send in-app notification
    await admin.from("notifications").insert({
      user_id: user.id,
      message: `You are now enrolled in "${course?.title ?? "the course"}".`,
      link: `/student/courses/${courseId}`,
    });

    // Send enrollment email (fire and forget)
    const { data: studentProfile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (studentProfile?.email) {
      sendEnrollmentEmail(
        studentProfile.email,
        studentProfile.full_name ?? "Student",
        course?.title ?? "the course",
        `${process.env.NEXT_PUBLIC_APP_URL}/student/courses/${courseId}`
      ).catch(err => console.error("Enrollment email error:", err));
    }

    return NextResponse.json({ enrolled: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
