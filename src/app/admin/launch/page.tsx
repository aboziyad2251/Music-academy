"use client";

import { useState, useEffect } from "react";
import { Check, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  category: "Technical" | "Content" | "Marketing" | "Legal";
  label: string;
  status: "مكتمل" | "قيد التنفيذ" | "معلق";
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  // Technical
  { id: "tech_https", category: "Technical", label: "تفعيل شهادة الأمان (HTTPS)", status: "معلق" },
  { id: "tech_env", category: "Technical", label: "تكوين متغيرات البيئة للإنتاج", status: "معلق" },
  { id: "tech_db", category: "Technical", label: "إعداد النسخ الاحتياطي لقاعدة البيانات", status: "معلق" },
  { id: "tech_sentry", category: "Technical", label: "ربط أداة تتبع الأخطاء (Sentry)", status: "معلق" },
  
  // Content
  { id: "content_courses", category: "Content", label: "نشر 5 دورات على الأقل", status: "معلق" },
  { id: "content_ai", category: "Content", label: "اختبار المعلم الذكي وتدقيق إجاباته", status: "معلق" },
  { id: "content_translations", category: "Content", label: "مراجعة جميع الترجمات العربية والإنجليزية", status: "معلق" },

  // Marketing
  { id: "mark_social", category: "Marketing", label: "ربط الحسابات الاجتماعية الخاصة بالأكاديمية", status: "معلق" },
  { id: "mark_seo", category: "Marketing", label: "ضبط علامات SEO للبحث باللغة العربية", status: "معلق" },
  { id: "mark_analytics", category: "Marketing", label: "تفعيل أدوات القياس مثل Google Analytics", status: "معلق" },

  // Legal
  { id: "leg_privacy", category: "Legal", label: "نشر سياسة الخصوصية باللغة العربية", status: "معلق" },
  { id: "leg_terms", category: "Legal", label: "نشر صفحة الشروط والأحكام الكاملة", status: "معلق" },
  { id: "leg_cookie", category: "Legal", label: "تفعيل لافتة الموافقة على ملفات تعريف المواقع (Cookies)", status: "معلق" },
];

export default function LaunchChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In production this would sync to Supabase table or settings JSON
    const loadState = async () => {
        try {
            const saved = localStorage.getItem("launch_checklist_state");
            if (saved) setItems(JSON.parse(saved));
        } finally {
            setIsLoading(false);
        }
    };
    loadState();
  }, []);

  const updateStatus = (id: string, newStatus: ChecklistItem["status"]) => {
    const newItems = items.map(item => item.id === id ? { ...item, status: newStatus } : item);
    setItems(newItems);
    localStorage.setItem("launch_checklist_state", JSON.stringify(newItems));
    toast.success("تم التحديث! حالة المهمة الآن: " + newStatus);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "مكتمل":
        return <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded-full font-sans tracking-wide"><Check className="w-3.5 h-3.5" /> مكتمل</span>;
      case "قيد التنفيذ":
        return <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-amber-950/40 text-amber-400 border border-amber-800/40 rounded-full font-sans tracking-wide"><RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> قيد التنفيذ</span>;
      default:
        return <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-slate-800/60 text-slate-400 border border-slate-700/50 rounded-full font-sans tracking-wide"><Clock className="w-3.5 h-3.5" /> معلق</span>;
    }
  };

  const categories = [
    { key: "Technical", label: "التقنية والإعدادات", icon: "⚙️" },
    { key: "Content", label: "المحتوى والدورات", icon: "📚" },
    { key: "Marketing", label: "التسويق والنشر", icon: "🚀" },
    { key: "Legal", label: "القانونية والسياسات", icon: "⚖️" }
  ];

  const total = items.length;
  const completed = items.filter(i => i.status === "مكتمل").length;
  const progressPct = Math.round((completed / total) * 100);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-[var(--dark)] font-amiri p-6 md:p-12" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Visual Header */}
        <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--gold)]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 text-center md:text-right">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">قائمة مهام الإطلاق <span className="text-[var(--gold)]">أكاديمية المقام</span></h1>
            <p className="text-[var(--muted)] text-lg">لوحة تحكم المدير لمراجعة الجاهزية قبل الإطلاق الرسمي للجمهور.</p>
          </div>

          <div className="relative z-10 bg-[var(--dark)] p-6 rounded-2xl border border-[var(--dark-3)] flex items-center justify-center shrink-0 w-full md:w-auto shadow-inner">
             <div className="text-center">
                <div className="text-4xl font-bold text-[var(--teal)] font-sans">{progressPct}%</div>
                <div className="text-sm text-slate-400 mt-1">جاهزية الإطلاق</div>
             </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-4 bg-[var(--dark-2)] border border-[var(--dark-3)] rounded-full overflow-hidden shadow-inner p-0.5">
           <div 
             className="h-full bg-gradient-to-l from-[var(--teal)] to-[var(--gold)] transition-all duration-1000 ease-out rounded-full" 
             style={{ width: `${progressPct}%` }} 
           />
        </div>

        {/* Checklists Array Rendering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category === cat.key);
            const isAllCompleted = catItems.every(i => i.status === "مكتمل");

            return (
              <div key={cat.key} className={`bg-[var(--dark-2)] border rounded-2xl overflow-hidden transition-colors duration-500 ${isAllCompleted ? 'border-[var(--teal)]/40 shadow-[0_0_20px_rgba(0,168,150,0.05)]' : 'border-[var(--dark-3)]'}`}>
                <div className={`px-6 py-4 flex items-center justify-between border-b transition-colors duration-500 ${isAllCompleted ? 'bg-[var(--teal)]/5 border-[var(--teal)]/20' : 'bg-[var(--dark)]/50 border-[var(--dark-3)]'}`}>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                     <span className="text-2xl">{cat.icon}</span>
                     {cat.label}
                  </h2>
                  {isAllCompleted && <CheckCircle2 className="w-6 h-6 text-[var(--teal)] animate-in zoom-in" />}
                </div>

                <div className="p-3 space-y-1">
                  {catItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-[var(--dark)] rounded-xl transition-colors gap-4 group">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                         {item.status === "مكتمل" ? (
                             <button onClick={() => updateStatus(item.id, "معلق")} className="text-[var(--teal)] mt-1 shrink-0"><CheckCircle2 className="w-5 h-5" /></button>
                         ) : item.status === "قيد التنفيذ" ? (
                             <button onClick={() => updateStatus(item.id, "مكتمل")} className="text-amber-400 mt-1 shrink-0"><RefreshCw className="w-5 h-5" /></button>
                         ) : (
                             <button onClick={() => updateStatus(item.id, "قيد التنفيذ")} className="text-slate-600 group-hover:text-[var(--gold)] mt-1 shrink-0 transition-colors"><div className="w-5 h-5 rounded-full border-2 border-current" /></button>
                         )}
                         <span className={`text-[15px] leading-relaxed transition-colors ${item.status === "مكتمل" ? "text-slate-500 line-through" : "text-[var(--cream)] font-medium"}`}>
                            {item.label}
                         </span>
                      </div>
                      <div className="shrink-0 mb-auto">
                         {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
