import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/notes?lessonId=xxx
export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("lesson_notes")
    .select("content, updated_at")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  return NextResponse.json({ content: data?.content ?? "", updated_at: data?.updated_at ?? null });
}

// PUT /api/notes — upsert note
export async function PUT(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, content } = await req.json();
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  if (!content?.trim()) {
    // Delete empty note
    await supabase.from("lesson_notes").delete().eq("student_id", user.id).eq("lesson_id", lessonId);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("lesson_notes")
    .upsert(
      { student_id: user.id, lesson_id: lessonId, content: content.trim(), updated_at: new Date().toISOString() },
      { onConflict: "student_id,lesson_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
