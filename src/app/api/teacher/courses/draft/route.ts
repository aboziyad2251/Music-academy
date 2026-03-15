import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a teacher or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, title_en, description, duration_min, content_sections, practice_exercises } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // Build a structured description from all AI-generated content
  const fullDescription = [
    description,
    content_sections?.length
      ? content_sections.map((s: any) => `**${s.heading}**\n${s.body}`).join("\n\n")
      : null,
    practice_exercises ? `**التمارين التطبيقية:**\n${practice_exercises}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      teacher_id: session.user.id,
      title,
      description: fullDescription || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Draft save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If duration was provided, create a placeholder first lesson
  if (duration_min && course?.id) {
    await supabase.from("lessons").insert({
      course_id: course.id,
      title: title_en || title,
      description: description || null,
      duration_min: parseInt(duration_min),
      position: 1,
    });
  }

  return NextResponse.json({ id: course.id }, { status: 201 });
}
