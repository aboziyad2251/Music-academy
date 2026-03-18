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
      messages, // Array of { role: 'user' | 'model', parts: [{ text: '...' }] } 
      course_title,
      lesson_title,
      student_level,
      student_name,
    } = body;

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Convert standard { role, content } format to Gemini's format if needed
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content || msg.parts?.[0]?.text || "" }]
    }));

    const systemPrompt = `You are a friendly, expert music tutor assistant embedded inside a lesson on the Music Online Academy learning platform.

CURRENT LESSON CONTEXT:
Course: ${course_title || 'General Music'}
Lesson: ${lesson_title || 'General'}
Student Level: ${student_level || 'beginner'}
Student Name: ${student_name || 'Student'}

YOUR JOB:
- Answer the student's music theory and practice questions directly and helpfully
- Help them understand the specific topics covered in this lesson
- Suggest practice techniques when asked
- Give simple text-based examples where applicable:
  For guitar/bass: use ASCII tab notation (e.g., e|--0--2--3--|)
  For piano: describe hand position or finger numbers
  For theory: show the pattern (e.g., C major scale: C D E F G A B C)

COMMUNICATION RULES:
- Keep answers under 150 words unless technical detail genuinely requires more
- Write in short paragraphs - avoid long bullet lists
- Match language to student level:
  Beginner: simple words, lots of encouragement, avoid jargon
  Intermediate: standard music terminology with brief explanations
  Advanced: full technical vocabulary, assume theory knowledge
- If the question was already answered in the chat history, acknowledge it and provide additional depth rather than repeating the same answer
- If the question is ambiguous, answer the most likely interpretation and ask one clarifying question at the end
- If the student asks something unrelated to music: politely redirect them back to music topics with: 'I'm here to help with music questions!'
- Never make up information - if unsure, say 'I'm not 100% certain, but my best understanding is...'
- Respond in the same language the student writes in (Arabic or English)
- Use the student's first name occasionally to make it feel personal`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiMessages,
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error("Chat Tutor Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
