import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    lessonsCompleted: 12,
    practiceHours: 14.5,
    maqamLevel: "مبتدئ",
    pointsEarned: 1250,
    dayStreak: 5,
    unlockedMaqamat: ["راست", "بياتي"],
    recentActivity: [
      { action: "أكمل درس مقدمة في العود", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { action: "تدرب لمدة ساعتين", date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
      { action: "أكمل واجب السلم الموسيقي", date: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString() },
      { action: "حصل على شارة مقام الراست", date: new Date(Date.now() - 74 * 60 * 60 * 1000).toISOString() },
      { action: "انضم إلى دورة أساسيات العود", date: new Date(Date.now() - 98 * 60 * 60 * 1000).toISOString() }
    ]
  });
}
