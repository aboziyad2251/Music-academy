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

    const { action, assignmentTitle, assignmentDescription, maxScore, studentNotes } = await req.json();

    if (action !== "grade_feedback") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        suggestedScore: Math.round(maxScore * 0.75),
        suggestedFeedback: "AI grading is currently unavailable (no DeepSeek key configured). Please provide your own feedback.",
      });
    }

    const prompt = `You are a music instructor grading a student assignment.
Assignment: "${assignmentTitle}"
Description: "${assignmentDescription}"
Max Score: ${maxScore}
Student Notes: "${studentNotes || "None provided"}"

Provide a JSON response with:
- "suggestedScore": a numeric score out of ${maxScore} (be fair but encouraging)
- "suggestedFeedback": 2-3 sentences of constructive feedback about the submission

Return ONLY valid JSON, no markdown fences.`;

    const response = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        suggestedScore: Math.round(maxScore * 0.75),
        suggestedFeedback: "AI service temporarily unavailable. Please grade manually.",
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        suggestedScore: Math.round(maxScore * 0.75),
        suggestedFeedback: text || "Could not parse AI response. Please grade manually.",
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
