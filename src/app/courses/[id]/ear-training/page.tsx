"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Music, CheckCircle2, XCircle, ChevronLeft, Sparkles, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Question {
  question_ar: string;
  question_en: string;
  options: string[];
  correct_index: number;
  explanation_ar: string;
  audio_hint: string;
}

export default function EarTrainingQuiz() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Load User & Generate Questions
  useEffect(() => {
    async function init() {
      // Get user
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUserId(session.user.id);

      // Fetch questions
      setIsLoading(true);
      try {
        const res = await fetch("/api/ai/quiz-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level: "beginner" })
        });
        if (!res.ok) throw new Error("Failed to load questions");
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        toast.error("حدث خطأ أثناء تحميل الاختبار");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [supabase.auth]);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    if (index === questions[currentIdx].correct_index) {
        setScore(s => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Finish Quiz
      setQuizCompleted(true);
      const finalScore = score + (selectedAnswer === questions[currentIdx].correct_index ? 1 : 0);
      const percentage = (finalScore / questions.length) * 100;

      if (userId) {
          try {
             await fetch("/api/quiz/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  student_id: userId,
                  score: percentage,
                  maqam_level: "beginner",
                  timestamp: new Date().toISOString()
              })
             });
          } catch (e) {
             console.error("Score submit failed", e);
          }
      }
    }
  };

  const currentQ = questions[currentIdx];

  // Feedback Message System
  const getFeedbackMessage = (pct: number) => {
    if (pct < 40) return { msg: "تحتاج إلى مزيد من التدريب", color: "text-red-400" };
    if (pct <= 70) return { msg: "أداء جيد! استمر", color: "text-amber-400" };
    if (pct <= 90) return { msg: "ممتاز! أنت تتحسن", color: "text-[var(--teal)]" };
    return { msg: "رائع! أنت خبير المقام", color: "text-[var(--gold)]" };
  };

  // UI Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--dark)] flex flex-col items-center justify-center font-amiri" dir="rtl">
        <div className="w-16 h-16 rounded-full border-4 border-[var(--teal)]/20 border-t-[var(--teal)] animate-spin mb-4" />
        <h2 className="text-2xl text-[var(--gold)] font-bold animate-pulse">يتم توليد أسئلة التدريب السمعي...</h2>
        <p className="text-slate-400 font-sans mt-2">عبر الذكاء الاصطناعي الخاص بأكاديمية المقام</p>
      </div>
    );
  }

  // UI Error State
  if (!questions || questions.length === 0) {
    return (
        <div className="min-h-screen bg-[var(--dark)] flex items-center justify-center font-amiri" dir="rtl">
            <div className="text-center space-y-4">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h2 className="text-2xl text-white">عذراً، فشل تحميل الاختبار.</h2>
                <button onClick={() => window.location.reload()} className="bg-[var(--teal)] text-white px-6 py-2 rounded-xl">حاول مجدداً</button>
            </div>
        </div>
    );
  }

  // Final Score Card
  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const feedback = getFeedbackMessage(percentage);
    const perfect = percentage > 90;

    return (
        <div className="min-h-screen bg-[var(--dark)] flex items-center justify-center font-amiri p-4 relative overflow-hidden" dir="rtl">
            {perfect && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full absolute bg-[var(--gold)]/5 animate-ping" style={{ animationDuration: '3s' }} />
                    <Sparkles className="w-96 h-96 text-[var(--gold)]/20 animate-spin-slow absolute" />
                    {[...Array(10)].map((_, i) => (
                        <Star key={i} className="absolute text-[var(--gold)] animate-bounce" style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`
                        }} />
                    ))}
                </div>
            )}
            
            <div className={`bg-[var(--dark-2)] border ${perfect ? 'border-[var(--gold)]' : 'border-[var(--dark-3)]'} p-8 md:p-12 rounded-3xl max-w-xl w-full relative z-10 shadow-2xl text-center`}>
                <h1 className="text-4xl font-bold text-white mb-6">النتيجة النهائية</h1>
                
                <div className="w-48 h-48 mx-auto relative flex items-center justify-center mb-8">
                    <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--dark-3)" strokeWidth="10" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke={perfect ? 'var(--gold)' : 'var(--teal)'} strokeWidth="10" 
                                strokeDasharray="283" 
                                strokeDashoffset={283 - (283 * percentage) / 100} 
                                className="transition-all duration-1500 ease-out" />
                    </svg>
                    <span className="absolute text-5xl font-bold text-white font-sans">{percentage}%</span>
                </div>

                <h2 className={`text-3xl font-bold mb-4 ${feedback.color}`}>{feedback.msg}</h2>
                <p className="text-slate-400 text-lg mb-8">أجبت بشكل صحيح على {score} من أصل {questions.length} أسئلة.</p>
                
                <div className="flex gap-4 justify-center">
                    <button onClick={() => router.push('/student/dashboard')} className="bg-[var(--dark-3)] hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-colors font-sans tracking-wide">
                        العودة للوحة
                    </button>
                    <button onClick={() => window.location.reload()} className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] font-bold py-3 px-8 rounded-xl transition-colors font-sans tracking-wide">
                        إعادة الاختبار
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Quiz active UI
  return (
    <div className="min-h-screen bg-[var(--dark)] flex flex-col font-amiri" dir="rtl">
        {/* Header Progress */}
        <div className="bg-[var(--dark-2)] border-b border-[var(--dark-3)] p-4 sticky top-0 z-10">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-6">
                <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6 rtl:-rotate-180" />
                </button>
                
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm text-[var(--cream)]/80 font-sans tracking-wide font-bold">
                        <span>السؤال {currentIdx + 1} من {questions.length}</span>
                        <span>{Math.round(((currentIdx) / questions.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-l from-[var(--teal)] to-[var(--teal)]/50 rounded-full transition-all duration-500"
                            style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[var(--gold)] font-bold font-sans">
                    <Star className="w-5 h-5" />
                    {score}
                </div>
            </div>
        </div>

        {/* Question Body */}
        <div className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col justify-center gap-10">
            
            <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center p-4 bg-[var(--dark-3)]/50 rounded-2xl border border-[var(--dark-3)] mb-4">
                     <Music className="w-8 h-8 text-[var(--teal)]" />
                     {currentQ.audio_hint && <span className="ml-4 font-sans text-sm text-slate-400">{currentQ.audio_hint}</span>}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                    {currentQ.question_ar}
                </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === currentQ.correct_index;
                    const showCorrect = isAnswered && isCorrect;
                    const showWrong = isAnswered && isSelected && !isCorrect;

                    return (
                        <button
                            key={idx}
                            disabled={isAnswered}
                            onClick={() => handleAnswer(idx)}
                            className={cn(
                                "relative overflow-hidden p-6 rounded-2xl text-2xl font-bold transition-all duration-300 border-2 text-center",
                                !isAnswered ? "bg-[var(--dark-2)] border-[var(--dark-3)] hover:border-[var(--teal)]/50 text-white hover:-translate-y-1" :
                                showCorrect ? "bg-emerald-950/40 border-[var(--gold)] text-[var(--gold)] shadow-[0_0_20px_rgba(212,160,23,0.3)] z-10 scale-105" :
                                showWrong ? "bg-red-950/40 border-red-500 text-red-500" :
                                "bg-[var(--dark-2)] border-transparent opacity-40 text-slate-500"
                            )}
                        >
                            {/* Flash Animation backgrounds */}
                            {showCorrect && <div className="absolute inset-0 bg-[var(--gold)]/10 animate-pulse" />}
                            {showWrong && <div className="absolute inset-0 bg-red-500/10 animate-pulse" />}
                            
                            <span className="relative z-10">{opt}</span>
                            
                            {showCorrect && <CheckCircle2 className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-[var(--gold)]" />}
                            {showWrong && <XCircle className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-red-500" />}
                        </button>
                    );
                })}
            </div>

            {/* Explanation Area */}
            {isAnswered && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] p-6 rounded-2xl relative">
                         <div className={`absolute top-0 right-0 w-2 h-full rounded-r-2xl ${selectedAnswer === currentQ.correct_index ? 'bg-[var(--gold)]' : 'bg-red-500'}`} />
                         <h4 className="text-xl font-bold text-white mb-2">الشرح:</h4>
                         <p className="text-slate-300 text-lg leading-relaxed">{currentQ.explanation_ar}</p>
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full bg-[var(--teal)] hover:bg-[#00bda8] text-white font-bold py-4 px-8 rounded-2xl text-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-[0_4px_20px_rgba(0,168,150,0.3)] font-sans tracking-wide"
                    >
                        {currentIdx < questions.length - 1 ? "السؤال التالي" : "عرض النتيجة"}
                        <ChevronLeft className="w-6 h-6 rtl:-rotate-180" />
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}
