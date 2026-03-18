import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkHourlyRateLimit } from "@/lib/rate-limit";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Assuming a generic latest pro specifier, fallback to 2.0 or 1.5 if needed

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

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "لم يتم إعداد مفتاح API بشكل صحيح.", response: "عذراً، خدمة المعلم الذكي غير متوفرة حالياً.", suggestions: [] },
        { status: 503 }
      );
    }

    // Call Gemini API
    const result = await model.generateContent({
        contents: [
            { role: "user", parts: [{ text: `System Context: Language preference is ${language || "ar"}. Topic Context: ${context || "general"}.\n\nStudent Message: ${message}` }] }
        ],
        systemInstruction: {
          role: "system",
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
        }
    });

    const responseText = result.response.text();
    let parsedResponse;

    try {
        // Handle potential markdown formatting from the API
        const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON:", responseText);
        return NextResponse.json(
            { error: "حدث خطأ في قراءة رد الذكاء الاصطناعي.", response: "عذراً، لم أتمكن من صياغة الإجابة بالشكل المطلوب. حاول صياغة سؤالك بطريقة أخرى.", suggestions: [] },
            { status: 500 }
        );
    }

    // Async logging to database for Admin Analytics without blocking the response
    supabase.from('ai_interactions').insert({
        user_id: user.id,
        endpoint: '/api/ai/music-tutor',
        language: language,
        context: context,
        prompt: message,
        response: parsedResponse.response,
        model_used: 'gemini-2.0-flash'
    }).then(({ error }) => {
        if (error) console.error("Error logging AI interaction:", error);
    });

    return NextResponse.json(parsedResponse);
    
  } catch (err: any) {
    console.error("AI Tutor Route Error:", err.message || err);
    
    // Fallback Mocked Response to handle missing/invalid API keys during testing
    return NextResponse.json(
      { 
        response: "مرحباً يا صديقي! أرى أنك تسأل عن المقامات الموسيقية. مقام الراست هو من أشهر المقامات العربية، ويتميز بطابعه الأصيل والفخم. هل تود أن أعزف لك مثالاً أو أشرح لك أبعاده الموسيقية؟ (ملاحظة: هذا رد تجريبي نظراً لعدم إعداد مفتاح API بشكل كامل).", 
        suggestions: ["ما هي أبعاد مقام الراست؟", "كيف أتدرب على العزف؟"] 
      },
      { status: 200 }
    );
  }
}
