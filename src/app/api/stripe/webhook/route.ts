import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If Stripe is disabled, just acknowledge
  if (!stripeKey || stripeKey === "sk_test_..." || !webhookSecret || webhookSecret === "whsec_...") {
    return NextResponse.json({ received: true, note: "Stripe disabled" }, { status: 200 });
  }

  // Dynamic import so it doesn't crash when stripe isn't configured
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" as any });
  const { createServerClient } = await import("@/lib/supabase/server");

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
      const supabase = createServerClient();
      await supabase.from("enrollments").insert({
        course_id: courseId,
        student_id: studentId,
        stripe_payment_id: session.id,
      });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
