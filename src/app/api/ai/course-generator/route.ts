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

    const { topic } = await req.json();

    if (!topic || typeof topic !== 'string') {
        return NextResponse.json(
          { error: "الرجاء إدخال موضوع صحيح." },
          { status: 400 }
        );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is missing." },
        { status: 503 }
      );
    }

    const promptText = `Generate a structured music lesson for Arabic maqam education.
Topic: ${topic}
Output format (JSON):
{ 
  "title_ar": "string", 
  "title_en": "string", 
  "objectives": ["string"],
  "content_sections": [{"heading": "string", "body": "string"}],
  "practice_exercises": ["string"], 
  "estimated_duration_minutes": number 
}
Respond ONLY with the JSON object.`;

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
          max_tokens: 2000,
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

    // Optionally log this into ai_interactions
    supabase.from('ai_interactions').insert({
        user_id: user.id,
        endpoint: '/api/ai/course-generator',
        context: 'course_generation',
        prompt: topic,
        response: 'JSON structure generated successfully',
        model_used: 'deepseek-chat'
    }).then(({ error }) => {
        if (error) console.error("Error logging AI interaction:", error);
    });

    return NextResponse.json(parsedResponse);
    
  } catch (err: any) {
    console.error("AI Course Generator Route Error:", err.message || err);
    return NextResponse.json(
      { 
        title_ar: "مقدمة في الموسيقى (محتوى تجريبي)",
        title_en: "Intro to Music (Mock)",
        objectives: ["فهم الأساسيات", "التعرف على الآلات"],
        content_sections: [{ heading: "ما هو المقام؟", body: "هذا نص تجريبي لتوضيح عمل المولد الذكي عند عدم توفر مفتاح التفعيل." }],
        practice_exercises: ["استمع إلى العود", "حاول تمييز النغمات"],
        estimated_duration_minutes: 30
      },
      { status: 200 }
    );
  }
}
