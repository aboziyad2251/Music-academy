import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();

    if (planId === 'free') {
       return NextResponse.json({ url: '/student/dashboard' });
    }

    // In a real application, you'd use the Stripe SDK here:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { ... });
    // const checkoutSession = await stripe.checkout.sessions.create({ ... });
    // return NextResponse.json({ url: checkoutSession.url });

    // Mock response for now until the user actually installs stripe on their environment
    return NextResponse.json({ 
      url: `/dashboard/student?mock_upgrade_success=true&plan=${planId}` 
    });

  } catch (error: any) {
    console.error("Stripe create-checkout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
