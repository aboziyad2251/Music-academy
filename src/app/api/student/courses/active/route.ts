import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "course-1",
    title: "أساسيات العود والمقامات الشرقية",
    teacher: "الأستاذ أحمد فؤاد",
    nextLesson: "الدرس الرابع: شرح مبسط لمقام الحجاز",
    progressPct: 45
  });
}
