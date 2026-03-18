import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { courseId } = await req.json();
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripeDisabled = !stripeKey || stripeKey === "sk_test_...";

    if (stripeDisabled) {
      // Fetch course to check price
      const { data: courseCheck } = await supabase
        .from("courses")
        .select("price")
        .eq("id", courseId)
        .single();

      if (courseCheck && courseCheck.price > 0) {
        return NextResponse.json(
          { error: "Payment processing is not configured. Please contact the administrator." },
          { status: 503 }
        );
      }

      // Free course — enroll directly
      const { error } = await supabase
        .from("enrollments")
        .insert({
          course_id: courseId,
          student_id: user.id,
          stripe_payment_id: "free_enrollment",
        });

      if (error && error.code !== "23505") {
        return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.json({ url: `${appUrl}/student/courses/${courseId}?enrolled=true` });
    }

    // Stripe is enabled — normal checkout flow
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" as any });

    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (error || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: course.title,
            description: course.description || "Music Academy Course",
            images: course.thumbnail_url ? [course.thumbnail_url] : [],
          },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      }],
      client_reference_id: user.id,
      metadata: { courseId: course.id, studentId: user.id },
      success_url: `${appUrl}/student/courses/${course.id}?enrolled=true`,
      cancel_url: `${appUrl}/student/courses/${course.id}`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("Checkout Error:", err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
