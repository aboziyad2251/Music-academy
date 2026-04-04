import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkHourlyRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `
You are an expert Arabic music theory tutor for Academy of the Maqam (أكاديمية المقام).
You specialize in: Arabic maqamat (مقامات), oud playing, Egyptian and Levantine music traditions.
When asked in Arabic, always respond in Arabic. When asked in English, respond in English.
Keep responses educational, encouraging, and appropriate for music students of all levels.
Always use proper Arabic musical terminology (مقام، نغم، سلم موسيقي، etc.).

Provide your response strictly in the following JSON format:
{
  "response": "Your educational and encouraging response directly answering the student.",
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}
Ensure the JSON is strictly well-formed and avoid markdown code fences around the JSON structure.
`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Auth validation
    if (!user) {
      return NextResponse.json(
        { error: "عذراً، يجب تسجيل الدخول للوصول إلى المعلم الذكي.", response: "عذراً، يجب تسجيل الدخول للوصول إلى المعلم الذكي.", suggestions: [] },
        { status: 401 }
      );
    }

    // Rate Limiting (20 requests per user per hour)
    const rateLimit = checkHourlyRateLimit(`tutor_${user.id}`, 20);
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: "لقد تجاوزت الحد المسموح به من الأسئلة (20 سؤال في الساعة). يرجى المحاولة لاحقاً.",
          response: "لقد تجاوزت الحد المسموح به من الأسئلة (20 سؤال في الساعة). يرجى المحاولة لاحقاً.",
          suggestions: [] 
        }, 
        { status: 429 }
      );
    }

    // Parse Request
    const { message, language, context } = await req.json();

    if (!message || typeof message !== 'string') {
        return NextResponse.json(
          { error: "الرجاء إرسال رسالة نصية صحيحة.", response: "الرجاء إرسال رسالة نصية صحيحة.", suggestions: [] },
          { status: 400 }
        );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "لم يتم إعداد مفتاح API بشكل صحيح.", response: "عذراً، خدمة المعلم الذكي غير متوفرة حالياً.", suggestions: [] },
        { status: 503 }
      );
    }

    // Call GLM API
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `System Context: Language preference is ${language || "ar"}. Topic Context: ${context || "general"}.\n\nStudent Message: ${message}` }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API Error:", errorText);
      return NextResponse.json(
        { error: "حدث خطأ في خدمة الذكاء الاصطناعي.", response: "عذراً، خدمة المعلم الذكي غير متوفرة حالياً.", suggestions: [] },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    
    let parsed: any = {};
    try {
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("Failed to parse GLM JSON:", text);
        parsed = { response: text, suggestions: [] };
    }

    // Async logging to database for Admin Analytics
    supabase.from('ai_interactions').insert({
        user_id: user.id,
        endpoint: '/api/ai/music-tutor',
        context: context || 'general',
        prompt: `Language: ${language}, Message: ${message}`,
        response: text,
        model_used: 'deepseek-chat'
    }).then(({ error }) => {
        if (error) console.error("Error logging AI interaction:", error);
    });

    return NextResponse.json({
        response: parsed.response || text,
        suggestions: parsed.suggestions || []
    });
    
  } catch (err: any) {
    console.error("AI Tutor Route Error:", err.message || err);
    
    // Fallback Mocked Response
    return NextResponse.json(
      { 
        response: "مرحباً يا صديقي! أرى أنك تسأل عن المقامات الموسيقية. مقام الراست هو من أشهر المقامات العربية، ويتميز بطابعه الأصيل والفخم. هل تود أن أعزف لك مثالاً أو أشرح لك أبعاده الموسيقية؟ (ملاحظة: هذا رد تجريبي نظراً لعدم إعداد مفتاح API بشكل كامل).", 
        suggestions: ["ما هي أبعاد مقام الراست؟", "كيف أتدرب على العزف؟"] 
      },
      { status: 200 }
    );
  }
}
