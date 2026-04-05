"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight,
  Loader2, Copy, Check, CalendarDays, Hash, Percent, DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  course_id: string | null;
  course: { title: string } | null;
  created_at: string;
}

interface Course { id: string; title: string; }

const EMPTY_FORM = {
  code: "",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: "",
  max_uses: "",
  expires_at: "",
  course_id: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    const res = await fetch("/api/admin/coupons");
    if (res.ok) setCoupons(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetch("/api/admin/courses")
      .then(r => r.ok ? r.json() : [])
      .then(data => setCourses(Array.isArray(data) ? data : data.courses ?? []))
      .catch(() => {});
  }, [fetchCoupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) {
      toast.error("الكود وقيمة الخصم مطلوبان");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discount_type: form.discount_type,
          discount_value: Number(form.discount_value),
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          expires_at: form.expires_at || null,
          course_id: form.course_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("تم إنشاء الكوبون بنجاح");
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "فشل إنشاء الكوبون");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    });
    if (res.ok) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(coupon.is_active ? "تم تعطيل الكوبون" : "تم تفعيل الكوبون");
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success("تم حذف الكوبون");
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("تم نسخ الكود");
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(f => ({ ...f, code }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Tag className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">إدارة كوبونات الخصم</h1>
            <p className="text-sm text-slate-500">{coupons.length} كوبون مُضاف</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          كوبون جديد
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">إنشاء كوبون خصم جديد</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">كود الخصم *</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="مثال: SUMMER30"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                />
                <button type="button" onClick={generateCode}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 text-xs transition-colors whitespace-nowrap">
                  توليد تلقائي
                </button>
              </div>
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">نوع الخصم *</label>
              <div className="flex gap-2">
                {(["percentage", "fixed"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, discount_type: type }))}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                      form.discount_type === type
                        ? "bg-amber-500/10 border-amber-500 text-amber-400"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {type === "percentage" ? <Percent className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                    {type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Value */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">
                قيمة الخصم * {form.discount_type === "percentage" ? "(0–100%)" : "($)"}
              </label>
              <input
                type="number"
                min="0"
                max={form.discount_type === "percentage" ? 100 : undefined}
                value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === "percentage" ? "مثال: 20" : "مثال: 15"}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
              />
            </div>

            {/* Max Uses */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">الحد الأقصى للاستخدام (اتركه فارغاً = غير محدود)</label>
              <input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="مثال: 100"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">تاريخ الانتهاء (اتركه فارغاً = لا ينتهي)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Course Restriction */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">تخصيص لدورة (اتركه فارغاً = جميع الدورات)</label>
              <select
                value={form.course_id}
                onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">جميع الدورات</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                إنشاء الكوبون
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <Tag className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">لا توجد كوبونات بعد. أنشئ أول كوبون!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(coupon => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
            const isExhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;

            return (
              <div
                key={coupon.id}
                className={cn(
                  "bg-slate-900 border rounded-2xl p-5 transition-all",
                  coupon.is_active && !isExpired && !isExhausted
                    ? "border-slate-800"
                    : "border-slate-800/50 opacity-60"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Code + type */}
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-lg tracking-wider">{coupon.code}</span>
                      <button onClick={() => copyCode(coupon.code, coupon.id)} className="text-slate-500 hover:text-slate-300 transition-colors">
                        {copiedId === coupon.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      coupon.discount_type === "percentage"
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}>
                      {coupon.discount_type === "percentage"
                        ? <><Percent className="h-3 w-3" />{coupon.discount_value}%</>
                        : <><DollarSign className="h-3 w-3" />{coupon.discount_value}</>
                      }
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {coupon.used_count}{coupon.max_uses !== null ? `/${coupon.max_uses}` : ""} استخدام
                    </span>
                    {coupon.expires_at && (
                      <span className={cn("flex items-center gap-1", isExpired && "text-red-400")}>
                        <CalendarDays className="h-3 w-3" />
                        {isExpired ? "منتهي — " : ""}
                        {new Date(coupon.expires_at).toLocaleDateString("ar-EG")}
                      </span>
                    )}
                    {coupon.course && (
                      <span className="text-amber-400/80">{coupon.course.title}</span>
                    )}
                    {isExhausted && <span className="text-red-400">نفد الاستخدام</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 transition-colors"
                      title={coupon.is_active ? "تعطيل" : "تفعيل"}
                    >
                      {coupon.is_active
                        ? <><ToggleRight className="h-4 w-4 text-emerald-400" /> نشط</>
                        : <><ToggleLeft className="h-4 w-4 text-slate-500" /> معطّل</>
                      }
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-950 text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
