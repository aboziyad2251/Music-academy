import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const body = await req.json();
    const {
      assignment_title,
      assignment_description,
      course_title,
      student_level,
      max_score,
      teacher_score,
      student_notes,
      file_type,
      lesson_title,
    } = body;

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
    }

    const prompt = `Write detailed student feedback for the following music assignment submission.

Assignment Title: ${assignment_title || "Untitled"}
Assignment Description: ${assignment_description || "Not provided"}
Course: ${course_title || "Unknown Course"}
Student Level: ${student_level || "beginner"}
Maximum Score: ${max_score || 100}
Teacher's Assigned Score: ${teacher_score || "Not yet scored"}
Student's Submission Notes: ${student_notes || "None provided"}
File Type Submitted: ${file_type || "text"}
Lesson Topic: ${lesson_title || "General"}

Write the feedback following this EXACT structure:

PARAGRAPH 1 — POSITIVE OPENING (2-3 sentences):
Start with one genuine, specific positive observation about what the student did well. Be specific — do not use generic phrases like 'good job'.

PARAGRAPH 2 — THREE IMPROVEMENTS (3-4 sentences):
Give exactly 3 specific, actionable improvement suggestions. Each suggestion must include a concrete example or exercise. Use language appropriate to the student level.

PARAGRAPH 3 — MOTIVATIONAL CLOSE (1-2 sentences):
End with an encouraging, forward-looking sentence that motivates continued practice.

RULES:
- Total response: 150 to 250 words maximum
- Do NOT mention the numeric score anywhere in your response
- Do NOT use bullet points — write in flowing paragraphs
- Use language matching student level (simple for beginner, technical for advanced)
- Write as if speaking directly to the student (use 'you'/'your')

Return ONLY the feedback text. No JSON wrapper. No markdown. Just the three paragraphs.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ feedback: text.trim() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
