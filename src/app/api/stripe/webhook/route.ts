import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If Stripe is disabled, just acknowledge
  if (!stripeKey || stripeKey === "sk_test_..." || !webhookSecret || webhookSecret === "whsec_...") {
    return NextResponse.json({ received: true, note: "Stripe disabled" }, { status: 200 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" as any });

  // Must use admin client — webhook has no user session, RLS would block inserts
  const { createAdminClient } = await import("@/lib/supabase/admin");

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const courseId = session.metadata?.courseId;
    const studentId = session.metadata?.studentId;

    if (courseId && studentId) {
      const supabase = createAdminClient();

      // Idempotency: skip if already enrolled (e.g. webhook delivered twice)
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (!existing) {
        const { error: enrollError } = await supabase.from("enrollments").insert({
          course_id: courseId,
          student_id: studentId,
          stripe_payment_id: session.id,
        });

        if (!enrollError) {
          // Fetch course title for the notification
          const { data: course } = await supabase
            .from("courses")
            .select("title")
            .eq("id", courseId)
            .single();

          // Send in-app notification to student
          await supabase.from("notifications").insert({
            user_id: studentId,
            message: `Payment successful! You are now enrolled in "${course?.title ?? "the course"}".`,
            link: `/student/courses/${courseId}`,
          });
        } else {
          console.error("Webhook enrollment insert failed:", enrollError.message);
        }
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
