import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/reviews?courseId=xxx
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const supabase = createServerClient();

  const { data: reviews, error } = await supabase
    .from("course_reviews")
    .select("id, rating, review, created_at, student:student_id(full_name, avatar_url)")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ratings = (reviews ?? []).map((r: any) => r.rating);
  const avgRating = ratings.length ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10 : null;

  // Check if current user already reviewed
  const { data: { user } } = await supabase.auth.getUser();
  let myReview = null;
  if (user) {
    myReview = (reviews ?? []).find((r: any) => {
      // We need student_id match — fetch separately
      return false;
    });
    const { data: mine } = await supabase
      .from("course_reviews")
      .select("id, rating, review")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .single();
    myReview = mine ?? null;
  }

  return NextResponse.json({ reviews: reviews ?? [], avgRating, totalReviews: ratings.length, myReview });
}

// POST /api/reviews — submit or update a review
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { courseId, rating, review } = body;

  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "courseId and rating (1-5) required" }, { status: 400 });
  }

  // Must be enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", user.id)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: "You must be enrolled to leave a review" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("course_reviews")
    .upsert(
      { course_id: courseId, student_id: user.id, rating, review: review ?? null },
      { onConflict: "course_id,student_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ review: data });
}

// DELETE /api/reviews?courseId=xxx
export async function DELETE(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("course_reviews")
    .delete()
    .eq("course_id", courseId)
    .eq("student_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
