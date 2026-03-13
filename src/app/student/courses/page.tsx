"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CourseCard from "@/components/student/CourseCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, Music } from "lucide-react";

export default function CourseCatalogPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const { data: coursesData } = await supabase
        .from("courses")
        .select("*, teacher:teacher_id(full_name)")
        .eq("status", "published");

      if (coursesData) setCourses(coursesData);

      if (session?.user.id) {
        const { data: enrollmentData } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", session.user.id);

        if (enrollmentData) {
          setEnrollments(new Set(enrollmentData.map((e: any) => e.course_id)));
        }
      }

      setLoading(false);
    }

    fetchCatalog();
  }, [supabase]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      course.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesLevel =
      levelFilter === "all" ||
      course.level?.toLowerCase() === levelFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Browse Courses
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Discover new skills and master your instrument.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <Input
            placeholder="Search courses..."
            className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="piano">Piano</SelectItem>
            <SelectItem value="guitar">Guitar</SelectItem>
            <SelectItem value="oud">Oud</SelectItem>
            <SelectItem value="vocals">Vocals</SelectItem>
            <SelectItem value="theory">Theory</SelectItem>
            <SelectItem value="drums">Drums</SelectItem>
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-slate-500">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrollments.has(course.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30">
          <Music className="h-12 w-12 text-slate-700 mb-4" />
          <h3 className="text-base font-semibold text-slate-400">No courses found</h3>
          <p className="text-sm text-slate-600 mt-1">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}
    </div>
  );
}
