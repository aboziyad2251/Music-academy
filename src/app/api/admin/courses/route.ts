import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, status, price, thumbnail_url, created_at, teacher:teacher_id(full_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch enrollment counts per course
  const ids = (data ?? []).map((c: any) => c.id);
  let enrollmentMap: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", ids);
    (enrollments ?? []).forEach((e: any) => {
      enrollmentMap[e.course_id] = (enrollmentMap[e.course_id] ?? 0) + 1;
    });
  }

  const courses = (data ?? []).map((c: any) => ({
    ...c,
    enrolled: enrollmentMap[c.id] ?? 0,
    revenue: (enrollmentMap[c.id] ?? 0) * (c.price ?? 0),
    teacher_name: c.teacher?.full_name ?? "Unknown",
  }));

  return NextResponse.json({ courses });
}

export async function PATCH(req: NextRequest) {
  const { courseId, status } = await req.json();
  if (!courseId || !status) return NextResponse.json({ error: "courseId and status are required" }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from("courses").update({ status }).eq("id", courseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
