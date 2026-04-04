import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Auth validation
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const level = body.level || "beginner";

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is missing." },
        { status: 503 }
      );
    }

    const promptText = `Generate 5 ear training quiz questions for Arabic maqam students.
Level: ${level}.
Format as JSON array with the exact following schema:
[{ 
  "question_ar": "string", 
  "question_en": "string", 
  "options": ["string", "string", "string", "string"], 
  "correct_index": number, 
  "explanation_ar": "string", 
  "audio_hint": "string" 
}]

Ensure the options are the actual maqam names in Arabic. Keep it strict JSON. Respond ONLY with the JSON array.`;

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
            { role: "user", content: promptText }
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API Error:", errorText);
      return NextResponse.json(
        { error: "فشل في التواصل مع خدمة الذكاء الاصطناعي." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "";
    let parsedResponse;

    try {
        const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("Failed to parse GLM JSON:", responseText);
        return NextResponse.json(
            { error: "فشل في قراءة الرد. يرجى المحاولة مرة أخرى." },
            { status: 500 }
        );
    }

    // Log this into ai_interactions
    supabase.from('ai_interactions').insert({
        user_id: user.id,
        endpoint: '/api/ai/quiz-generator',
        context: 'ear_training_quiz',
        prompt: `Generate ${level} quiz`,
        response: 'JSON array generated successfully',
        model_used: 'deepseek-chat'
    }).then(({ error }) => {
        if (error) console.error("Error logging AI interaction:", error);
    });

    return NextResponse.json(parsedResponse);
    
  } catch (err: any) {
    console.error("AI Quiz Generator Route Error:", err.message || err);
    return NextResponse.json(
      [
        {
          question_ar: "ما هو المقام الذي يعتمد عليه هذا المقطع؟ (سؤال تجريبي)",
          question_en: "Which maqam is this clip based on? (Mock)",
          options: ["الراست", "البياتي", "السيكاه", "الحجاز"],
          correct_index: 0,
          explanation_ar: "مقام الراست يتميز بأبعاد خاصة تعطي طابعاً مميزاً. (بيانات تجريبية)",
          audio_hint: "rast_example_1"
        },
        {
          question_ar: "أي من هذه المقامات يتميز بطابعه الحزين؟ (سؤال تجريبي)",
          question_en: "Which of these maqams has a sad character? (Mock)",
          options: ["النهاوند", "العجم", "الراست", "الكرد"],
          correct_index: 0,
          explanation_ar: "النهاوند يُعرف بطابعه العاطفي. (بيانات تجريبية)",
          audio_hint: "nahawand_example_1"
        }
      ],
      { status: 200 }
    );
  }
}
