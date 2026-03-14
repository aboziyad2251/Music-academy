import { NextRequest, NextResponse } from "next/server";
// import Stripe from "stripe";
// import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // In a real app we'd construct the Stripe event:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { ... });
  // const sig = req.headers.get("stripe-signature") as string;
  // const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  console.log("Stripe Webhook received payload");
  
  return NextResponse.json({ received: true });
}
