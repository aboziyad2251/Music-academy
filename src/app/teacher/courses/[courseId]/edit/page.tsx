"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Piano", "Guitar", "Oud", "Vocals", "Drums", "Violin", "Music Theory"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

export default function EditCoursePage({ params }: { params: { courseId: string } }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "Piano", level: "Beginner", price: "", thumbnail_url: "",
  });

  useEffect(() => {
    supabase.from("courses").select("*").eq("id", params.courseId).single().then(({ data, error }) => {
      if (error || !data) { toast.error("Course not found."); router.push("/teacher/courses"); return; }
      setFormData({
        title: data.title ?? "",
        description: data.description ?? "",
        category: data.category ?? "Piano",
        level: data.level ?? "Beginner",
        price: String(data.price ?? "0"),
        thumbnail_url: data.thumbnail_url ?? "",
      });
      if (data.thumbnail_url) setPreviewUrl(data.thumbnail_url);
      setLoading(false);
    });
  }, [params.courseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) { toast.error("Title and Price are required."); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      let thumbnailUrl = formData.thumbnail_url;
      if (file) {
        const ext = file.name.split(".").pop();
        const filePath = `course-thumbnails/${session.user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("course-content").upload(filePath, file);
        if (upErr) throw new Error("Failed to upload thumbnail: " + upErr.message);
        thumbnailUrl = supabase.storage.from("course-content").getPublicUrl(filePath).data.publicUrl;
      }
      const { error } = await supabase.from("courses").update({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        price: parseFloat(formData.price),
        thumbnail_url: thumbnailUrl || null,
      }).eq("id", params.courseId);
      if (error) throw error;
      toast.success("Course updated successfully!");
      router.push(`/teacher/courses/${params.courseId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update course.");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-6">
      <div>
        <Link href={`/teacher/courses/${params.courseId}`} className="text-sm text-slate-500 hover:text-slate-300 mb-4 inline-block transition-colors">
          &larr; Back to Course
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Edit Course</h1>
        <p className="text-slate-400 mt-1 text-sm">Update your course details below.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Course Title <span className="text-red-400">*</span></label>
          <Input placeholder="e.g. Masterclass: Advanced Jazz Piano" value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })} required
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Course Thumbnail</label>
          <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-700 px-6 py-8 hover:border-emerald-700 transition-colors">
            <div className="text-center w-full">
              {previewUrl ? (
                <div className="relative w-full max-w-sm mx-auto aspect-video rounded-lg overflow-hidden mb-4">
                  <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" />
                </div>
              ) : <ImageIcon className="mx-auto h-12 w-12 text-slate-600" />}
              <div className="mt-4 flex flex-col items-center text-sm text-slate-500">
                <label htmlFor="thumb-upload" className="cursor-pointer font-semibold text-emerald-400 hover:text-emerald-300">
                  <span>{previewUrl ? "Change Image" : "Upload a file"}</span>
                  <input id="thumb-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
                <p className="mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Description</label>
          <Textarea placeholder="What will students learn in this course?" value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Instrument / Category</label>
            <select className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 text-slate-200 px-3 py-2 text-sm"
              value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Difficulty Level</label>
            <select className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 text-slate-200 px-3 py-2 text-sm"
              value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Price (USD) <span className="text-red-400">*</span></label>
          <div className="relative">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <Input type="number" min="0" step="0.01" placeholder="0.00"
              className="ps-7 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
              value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
          </div>
        </div>
        <div className="pt-6 border-t border-slate-800">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
