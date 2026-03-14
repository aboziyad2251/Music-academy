import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Auth validation
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { student_id, score, maqam_level, timestamp } = await req.json();

    if (!student_id || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Since we do not have a specific 'quiz_scores' table requested to be built in the schema,
    // we will log this in the ai_interactions as a telemetry event for now, 
    // or you could establish a table if requested.
    const { error } = await supabase.from('ai_interactions').insert({
        user_id: session.user.id,
        endpoint: '/api/quiz/submit',
        context: 'ear_training_score',
        prompt: `Level: ${maqam_level}`,
        response: `Score: ${score}% at ${timestamp}`,
        model_used: 'system'
    });

    if (error) {
      console.error("Score submission error:", error);
      return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Score saved successfully." });
    
  } catch (err: any) {
    console.error("Quiz Submit Route Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
