"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("الرجاء تسجيل الدخول أولاً للمتابعة.");
      setLoading(null);
      return;
    }
    router.push("/student/courses");
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-[var(--dark)] font-amiri text-[var(--cream)] pb-20" dir="rtl">
      {/* Header */}
      <div className="pt-20 pb-16 text-center px-4 relative">
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[300px] bg-[var(--gold)]/5 rounded-full blur-[100px] pointer-events-none" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight relative z-10">اختر خطتك في <span className="text-[var(--gold)]">أكاديمية المقام</span></h1>
        <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto font-sans relative z-10">
          استثمر في رحلتك الموسيقية مع خبراء العود والمقامات الشرقية. خطط مصممة لتناسب جميع المستويات.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        
        {/* Free Plan */}
        <div className="bg-[var(--dark-2)] border border-[var(--dark-3)] rounded-3xl p-8 flex flex-col hover:border-[var(--dark-3)]/80 transition-all">
          <h2 className="text-2xl font-bold text-white mb-2">مجاني</h2>
          <p className="text-[var(--muted)] text-sm mb-6 h-10 font-sans">البداية المثالية لاكتشاف الموسيقى الشرقية</p>
          <div className="text-4xl font-bold text-white mb-6 font-sans">
            $0 <span className="text-lg text-[var(--muted)] font-normal">/ شهر</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--gold)] w-5 h-5 shrink-0" /> الوصول إلى دورتين أساسيتين</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--gold)] w-5 h-5 shrink-0" /> 5 رسائل يومياً للمعلم الذكي</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--gold)] w-5 h-5 shrink-0" /> الدخول إلى مجتمع الطلاب الأساسي</li>
          </ul>
          <button 
            onClick={() => handleSubscribe('free')}
            className="w-full py-4 rounded-xl border-2 border-[var(--dark-3)] text-white font-bold hover:bg-[var(--dark-3)] transition-colors text-lg"
          >
            ابدأ مجاناً
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-[var(--dark-2)] border-2 border-[var(--teal)] rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(0,168,150,0.15)]">
          <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[var(--teal)] text-[var(--dark)] px-4 py-1 rounded-full text-sm font-bold tracking-wide font-sans shadow-lg">
            الأكثر شعبية
          </div>
          <h2 className="text-2xl font-bold text-[var(--teal)] mb-2">احترافي</h2>
          <p className="text-[var(--muted)] text-sm mb-6 h-10 font-sans">كل ما تحتاجه لاحتراف العود والمقامات</p>
          <div className="text-4xl font-bold text-white mb-6 font-sans">
            $15 <span className="text-lg text-[var(--muted)] font-normal">/ شهر</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--teal)] w-5 h-5 shrink-0" /> وصول كامل لجميع الدورات المتاحة</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--teal)] w-5 h-5 shrink-0" /> عدد غير محدود من رسائل المعلم الذكي</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--teal)] w-5 h-5 shrink-0" /> وصول حصري للتمارين التفاعلية</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--teal)] w-5 h-5 shrink-0" /> استخراج شهادات إتمام الدورات</li>
          </ul>
          <button 
            onClick={() => handleSubscribe('pro')}
            disabled={loading === 'pro'}
            className="w-full py-4 rounded-xl bg-[var(--teal)] text-white font-bold hover:bg-[#00bda8] transition-colors text-lg flex justify-center shadow-[0_4px_20px_rgba(0,168,150,0.3)]"
          >
            {loading === 'pro' ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'اشترك الآن'}
          </button>
        </div>

        {/* Master Plan */}
        <div className="bg-[var(--dark-2)] border-2 border-[var(--gold)] rounded-3xl p-8 flex flex-col relative shadow-[0_0_30px_rgba(212,160,23,0.1)]">
          <h2 className="text-2xl font-bold text-[var(--gold)] mb-2">الأستاذ</h2>
          <p className="text-[var(--muted)] text-sm mb-6 h-10 font-sans">التوجيه المباشر والمتابعة الشخصية الحثيثة</p>
          <div className="text-4xl font-bold text-white mb-6 font-sans">
            $35 <span className="text-lg text-[var(--muted)] font-normal">/ شهر</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--gold)] w-5 h-5 shrink-0" /> جميع ميزات الخطة الاحترافية</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--gold)] w-5 h-5 shrink-0" /> جلسات تحليل وتقييم أسبوعية مباشرة</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--gold)] w-5 h-5 shrink-0" /> توجيه شخصي من الأساتذة المحترفين</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--gold)] w-5 h-5 shrink-0" /> أولوية مطلقة في الرد والدعم</li>
          </ul>
          <button 
            onClick={() => handleSubscribe('master')}
            disabled={loading === 'master'}
            className="w-full py-4 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold hover:bg-[var(--gold-light)] transition-colors text-lg flex justify-center shadow-[0_4px_20px_rgba(212,160,23,0.3)]"
          >
            {loading === 'master' ? <div className="w-6 h-6 border-2 border-[var(--dark)]/30 border-t-[var(--dark)] rounded-full animate-spin" /> : 'اشترك الآن'}
          </button>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 mt-32 relative z-10">
        <h2 className="text-3xl font-bold text-white text-center mb-10">الأسئلة الشائعة حول الاشتراك</h2>
        <div className="space-y-6">
          <div className="bg-[var(--dark-2)] p-6 md:p-8 rounded-2xl border border-[var(--dark-3)] shadow-md">
            <h3 className="text-xl font-bold text-white mb-3">هل يمكنني تبديل الخطط لاحقاً؟</h3>
            <p className="text-[var(--muted)] leading-relaxed">نعم، يمكنك الترقية أو العودة إلى خطة أخرى بأي وقت. سيتم احتساب الفرق المالي المتبقي من اشتراكك تلقائياً وتطبيقه على الخطة الجديدة.</p>
          </div>
          <div className="bg-[var(--dark-2)] p-6 md:p-8 rounded-2xl border border-[var(--dark-3)] shadow-md">
            <h3 className="text-xl font-bold text-white mb-3">كيف يتم الدفع؟ وهل بياناتي آمنة؟</h3>
            <p className="text-[var(--muted)] leading-relaxed">تتم جميع معاملاتنا المالية بنسبة 100٪ من خلال بوابة الدفع العالمية الآمنة Stripe. نحن لا نقوم بتخزين أي معلومات متعلقة ببطاقتك الائتمانية على خوادمنا إطلاقاً.</p>
          </div>
          <div className="bg-[var(--dark-2)] p-6 md:p-8 rounded-2xl border border-[var(--dark-3)] shadow-md">
            <h3 className="text-xl font-bold text-white mb-3">ما الذي تشمله الجلسات المباشرة في خطة الأستاذ؟</h3>
            <p className="text-[var(--muted)] leading-relaxed">تشمل جلسة تقييم ومتابعة فردية لمدة 30 دقيقة شهرياً مع أحد أساتذتنا المعتمدين. يتم خلالها مناقشة أدائك، تصحيح الأخطاء، ووضع خطة تدريب مخصصة لرفع مستواك بفاعلية.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
