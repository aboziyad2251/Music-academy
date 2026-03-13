import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("settings").select("*").limit(1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const supabase = createAdminClient();
  // Update the first (and only) settings row
  const { data: existing } = await supabase.from("settings").select("id").limit(1).single();
  if (!existing) return NextResponse.json({ error: "Settings row not found" }, { status: 404 });
  const { error } = await supabase
    .from("settings")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", existing.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
