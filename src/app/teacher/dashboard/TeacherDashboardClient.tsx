"use client";

import { useState } from "react";
import { Users, BookOpen, ClipboardCheck, DollarSign, PlusCircle, MessageCircle, X, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface StudentRow {
  name: string;
  course: string;
  lastActive: string;
  progress: number;
}

interface Props {
  activeStudents: number;
  publishedCourses: number;
  pendingReviews: number;
  totalEarnings: number;
  roster: StudentRow[];
}

export default function TeacherDashboardClient({ activeStudents, publishedCourses, pendingReviews, totalEarnings, roster }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [generatedData, setGeneratedData] = useState<any>(null);
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [objectives, setObjectives] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const [exercises, setExercises] = useState("");
  const [duration, setDuration] = useState("");

  const STATS = [
    { label: "الطلاب النشطين", value: activeStudents.toString(), icon: Users, color: "text-indigo-400", bgColor: "bg-indigo-950/60", borderColor: "border-indigo-800/40" },
    { label: "الدورات المنشورة", value: publishedCourses.toString(), icon: BookOpen, color: "text-emerald-400", bgColor: "bg-emerald-950/60", borderColor: "border-emerald-800/40" },
    { label: "مراجعات معلقة", value: pendingReviews.toString(), icon: ClipboardCheck, color: "text-amber-400", bgColor: "bg-amber-950/60", borderColor: "border-amber-800/40" },
    { label: "إجمالي الأرباح", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-teal-400", bgColor: "bg-teal-950/60", borderColor: "border-teal-800/40" },
  ];

  const handleGenerate = async () => {
    if (!topicInput.trim()) {
      toast.error("الرجاء إدخال موضوع الدرس");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/course-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput }),
      });

      if (!res.ok) throw new Error("فشل توليد المحتوى");
      const data = await res.json();

      setGeneratedData(data);
      setTitleAr(data.title_ar || "");
      setTitleEn(data.title_en || "");
      setObjectives(data.objectives?.join("\n") || "");
      setSections(data.content_sections || []);
      setExercises(data.practice_exercises?.join("\n") || "");
      setDuration(data.estimated_duration_minutes?.toString() || "");

      toast.success("تم توليد محتوى الدرس بنجاح!");
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالمعلم الذكي");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!titleAr) {
      toast.error("العنوان بالعربية مطلوب");
      return;
    }

    try {
      const res = await fetch("/api/teacher/courses/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleAr,
          title_en: titleEn,
          description: objectives,
          duration_min: duration ? parseInt(duration) : null,
          content_sections: sections,
          practice_exercises: exercises,
        }),
      });

      if (!res.ok) throw new Error("فشل الحفظ");

      toast.success("تم حفظ الدورة بنجاح كمسودة!");
      setIsModalOpen(false);
      setGeneratedData(null);
      setTopicInput("");
    } catch (err) {
      console.error(err);
      toast.error("فشل حفظ المسودة. حاول مرة أخرى.");
    }
  };

  return (
    <div className="space-y-8 pb-8 font-amiri" dir="rtl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">لوحة المعلم 🎓</h1>
          <p className="text-[var(--cream)]/60 text-lg">مرحباً بك في لوحة التحكم الخاصة بك.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-[0_4px_20px_rgba(212,160,23,0.3)] shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-lg tracking-wide">إنشاء دورة جديدة</span>
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div key={i} className={`bg-[var(--dark-2)] border ${stat.borderColor} p-6 rounded-2xl`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <h3 className="text-[var(--cream)]/70 text-sm md:text-base font-sans tracking-wide">{stat.label}</h3>
            </div>
            <p className="text-4xl font-bold text-white tracking-widest">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* STUDENT ROSTER TABLE */}
      <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[var(--dark-3)] bg-[var(--dark-2)]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--teal)]" />
            سجل الطلاب
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[var(--cream)]/80">
            <thead className="bg-[var(--dark)]/50 text-sm font-sans tracking-wide">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">اسم الطالب</th>
                <th className="px-6 py-4 font-semibold w-2/5">الدورة المسجلة</th>
                <th className="px-6 py-4 font-semibold w-1/6">آخر نشاط</th>
                <th className="px-6 py-4 font-semibold w-1/6">التقدم</th>
                <th className="px-6 py-4 font-semibold text-center w-24">مراسلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dark-3)]">
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">لا يوجد طلاب مسجلون بعد</td>
                </tr>
              ) : (
                roster.map((student, i) => (
                  <tr key={i} className="hover:bg-[var(--dark-3)]/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                    <td className="px-6 py-4 text-[var(--brand-muted)]">{student.course}</td>
                    <td className="px-6 py-4 text-xs font-sans text-slate-400">{student.lastActive}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-l from-[var(--teal)] to-[var(--gold)] rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-sans tracking-wide font-bold">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-[var(--teal)] hover:text-white hover:bg-[var(--teal)]/20 p-2 rounded-lg transition-colors inline-block">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI COURSE CREATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] w-full max-w-4xl rounded-3xl shadow-2xl relative my-auto flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--dark-3)] flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                مولد محتوى الدورات بالذكاء الاصطناعي
                <Sparkles className="w-5 h-5 text-[var(--teal)]" />
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-[var(--dark)] p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              <div className="bg-[var(--dark)]/50 p-6 rounded-2xl border border-[var(--dark-3)]/50 space-y-4">
                <label className="block text-lg text-[var(--cream)]">عن ماذا تريد أن تعلم اليوم؟ (Topic)</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="مثال: شرح مبسط لمقام الحجاز على العود..."
                    className="flex-1 bg-[var(--dark)] border border-slate-700 focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)] rounded-xl px-4 py-3 text-white font-sans outline-none"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topicInput.trim()}
                    className="bg-[var(--teal)] hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shrink-0 font-sans tracking-wide"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    توليد المحتوى
                  </button>
                </div>
                <p className="text-sm text-slate-500 font-sans">سيقوم الذكاء الاصطناعي ببناء هيكل كامل للدرس فوراً.</p>
              </div>

              {generatedData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 border-t border-[var(--dark-3)]">
                  <h3 className="text-xl font-bold text-[var(--gold)] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    المحتوى المقترح (قابل للتعديل)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400 font-sans">عنوان الدرس (عربي)</label>
                      <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="w-full bg-[var(--dark)] border border-slate-700 rounded-lg px-4 py-2 text-white font-amiri outline-none focus:border-[var(--gold)]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400 font-sans">Lesson Title (English)</label>
                      <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" className="w-full bg-[var(--dark)] border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-sm outline-none focus:border-[var(--gold)]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-sans">الأهداف التعليمية (سطر لكل هدف)</label>
                    <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={4} className="w-full bg-[var(--dark)] border border-slate-700 rounded-lg px-4 py-3 text-white font-amiri leading-relaxed outline-none focus:border-[var(--gold)] resize-none" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm text-slate-400 font-sans">هيكل محتوى الدرس</label>
                    {sections.map((sec, idx) => (
                      <div key={idx} className="bg-[var(--dark)] p-4 rounded-xl border border-slate-700 space-y-3">
                        <input
                          value={sec.heading}
                          onChange={(e) => { const s = [...sections]; s[idx].heading = e.target.value; setSections(s); }}
                          className="w-full bg-transparent border-b border-slate-600 px-2 py-1 text-lg font-bold text-white font-amiri outline-none focus:border-[var(--teal)]"
                        />
                        <textarea
                          value={sec.body}
                          onChange={(e) => { const s = [...sections]; s[idx].body = e.target.value; setSections(s); }}
                          rows={3}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-[var(--cream)]/80 font-amiri leading-relaxed outline-none focus:border-[var(--teal)] resize-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-2">
                      <label className="text-sm text-slate-400 font-sans">التمارين التطبيقية</label>
                      <textarea value={exercises} onChange={(e) => setExercises(e.target.value)} rows={3} className="w-full bg-[var(--dark)] border border-slate-700 rounded-lg px-4 py-3 text-white font-amiri leading-relaxed outline-none focus:border-[var(--gold)] resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400 font-sans">مدة الدرس (دقائق)</label>
                      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-[var(--dark)] border border-slate-700 rounded-lg px-4 py-3 text-3xl text-center text-[var(--teal)] font-bold font-sans outline-none focus:border-[var(--gold)]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--dark-3)] bg-[var(--dark-2)] rounded-b-3xl shrink-0 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white font-sans font-bold transition-colors">
                إلغاء
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={!generatedData}
                className="bg-[var(--gold)] hover:bg-[var(--gold-light)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--dark)] font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg font-sans tracking-wide"
              >
                حفظ كمسودة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
