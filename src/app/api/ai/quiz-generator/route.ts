import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    if (!process.env.GOOGLE_AI_API_KEY) {
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

Ensure the options are the actual maqam names in Arabic. Keep it strict JSON.`;

    const result = await model.generateContent({
        contents: [
            { role: "user", parts: [{ text: promptText }] }
        ],
        generationConfig: {
            temperature: 0.7,
        }
    });

    const responseText = result.response.text();
    let parsedResponse;

    try {
        const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON:", responseText);
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
        model_used: 'gemini-2.0-flash'
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
