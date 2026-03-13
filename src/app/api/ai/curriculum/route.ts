import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(session.user.id);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const body = await req.json();
    const { 
      course_title, 
      instrument_or_subject, 
      student_level, 
      num_lessons, 
      teacher_goals, 
      special_topics 
    } = body;

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
    }

    const prompt = `Generate a complete course curriculum for the following music course.

Course Title: ${course_title || 'Untitled Course'}
Instrument or Subject: ${instrument_or_subject}
Student Level: ${student_level}
Total Number of Lessons: ${num_lessons || 5}
Teacher's Goals for Students: ${teacher_goals || 'Not specified'}
Special Topics to Cover: ${special_topics || 'None'}

Return a JSON object with EXACTLY this structure — no extra fields. Return ONLY valid JSON, do NOT wrap it in markdown block quotes (\`\`\`json):
{
  "course_summary": "string - 2 to 3 sentence overview of the course",
  "learning_outcomes": ["string", "string", "string"],
  "lessons": [
    {
      "position": 1,
      "title": "string",
      "description": "string - what this lesson covers",
      "duration_min": 30,
      "topics_covered": ["string", "string"],
      "practice_task": "string - what to practice after this lesson",
      "assignment_idea": "string - suggested assignment for this lesson"
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown code blocks. No explanation before or after. Pure JSON only. Lessons array must have exactly ${num_lessons || 5} items. Position numbers must be sequential starting from 1.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      // Clean up markdown fences just in case the model ignores the instruction
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response into JSON" }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
