"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AdminCreateCoursePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingTeachers, setFetchingTeachers] = useState(true);
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Piano",
    level: "Beginner",
    price: "",
    teacher_id: "",
  });

  useEffect(() => {
    async function loadTeachers() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["teacher", "admin"]);
      
      if (!error && data) {
        setTeachers(data as { id: string; full_name: string }[]);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setFormData(prev => ({ ...prev, teacher_id: session.user.id }));
      }
      
      setFetchingTeachers(false);
    }
    loadTeachers();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.teacher_id) {
      toast.error("Title, Teacher and Price are required.");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let thumbnailUrl = null;

      // 1. Upload thumbnail to Supabase Storage if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `course-thumbnails/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload thumbnail. (${uploadError.message})`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('course-content')
          .getPublicUrl(filePath);
          
        thumbnailUrl = publicUrl;
      }

      // 2. Insert into courses table
      const { data: course, error: insertError } = await supabase
        .from("courses")
        .insert({
          teacher_id: formData.teacher_id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          price: parseFloat(formData.price),
          thumbnail_url: thumbnailUrl,
          status: "draft", // Defaults to draft initially
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Course created successfully!");
      router.push("/admin/courses");

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-6">
      <div>
        <Link href="/admin/courses" className="text-sm text-slate-500 hover:text-slate-300 mb-4 inline-block transition-colors">
          &larr; Back to Admin Courses
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Create New Course</h1>
        <p className="text-slate-400 mt-1 text-sm">Create courses on behalf of your teachers or yourself.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800">

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Course Title <span className="text-red-400">*</span></label>
          <Input
            placeholder="e.g. Masterclass: Advanced Jazz Piano"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        {/* Teacher Assigned */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Teacher <span className="text-red-400">*</span></label>
          <select
            className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 text-slate-200 px-3 py-2 text-sm disabled:opacity-50"
            value={formData.teacher_id}
            onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
            disabled={fetchingTeachers}
            required
          >
            {fetchingTeachers ? (
              <option value="">Loading teachers...</option>
            ) : (
              teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name || t.id}</option>
              ))
            )}
          </select>
        </div>

        {/* Thumbnail Upload */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Course Thumbnail</label>
          <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-700 px-6 py-8 hover:border-emerald-700 transition-colors">
            <div className="text-center">
              {previewUrl ? (
                <div className="relative w-full max-w-sm mx-auto aspect-video rounded-lg overflow-hidden mb-4">
                  <Image 
                    src={previewUrl} 
                    alt="Preview" 
                    fill
                    unoptimized
                    className="object-cover" 
                  />
                </div>
              ) : (
                <ImageIcon className="mx-auto h-12 w-12 text-slate-600" aria-hidden="true" />
              )}
              <div className="mt-4 flex flex-col items-center text-sm leading-6 text-slate-500">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>{previewUrl ? "Change Image" : "Upload a file"}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
                <p className="pl-1 mt-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-slate-600 mt-2">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Description</label>
          <Textarea
            placeholder="What will students learn in this course?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Instrument / Category</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 text-slate-200 px-3 py-2 text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Piano">Piano</option>
              <option value="Guitar">Guitar</option>
              <option value="Oud">Oud</option>
              <option value="Vocals">Vocals</option>
              <option value="Drums">Drums</option>
              <option value="Violin">Violin</option>
              <option value="Music Theory">Music Theory</option>
            </select>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Difficulty Level</label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-950 text-slate-200 px-3 py-2 text-sm"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Price (USD) <span className="text-red-400">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="pl-7 bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {loading ? "Creating Course..." : "Create Course"}
          </Button>
        </div>

      </form>
    </div>
  );
}
