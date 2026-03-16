import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Music, CheckCircle2 } from "lucide-react";

export interface CourseCardProps {
  course: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    price: number;
    category: string;
    level: string;
    teacher: {
      full_name: string;
    };
  };
  isEnrolled: boolean;
}

export default function CourseCard({ course, isEnrolled }: CourseCardProps) {
  return (
    <div className="flex flex-col h-full rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-700 overflow-hidden transition-all group shadow-lg hover:shadow-indigo-900/20">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Music className="h-10 w-10 text-slate-600" />
        )}
        <div className="absolute top-2 end-2 flex gap-1.5">
          {isEnrolled && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] flex items-center gap-1 px-2 py-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Enrolled
            </Badge>
          )}
          <Badge className="bg-slate-900/80 backdrop-blur-sm text-slate-300 border border-slate-700 text-[10px] capitalize px-2 py-0.5">
            {course.level}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="text-[10px] border-indigo-700/50 text-indigo-400 bg-indigo-950/40 capitalize shrink-0"
          >
            {course.category}
          </Badge>
          {!isEnrolled && (
            <span className="font-bold text-lg text-white leading-none shrink-0">
              ${course.price}
            </span>
          )}
        </div>

        <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 flex-1">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
            <User className="h-2.5 w-2.5 text-slate-400" />
          </div>
          <span className="truncate">{course.teacher?.full_name ?? "Instructor"}</span>
        </div>

        <Link href={`/student/courses/${course.id}`} className="mt-auto">
          <Button
            className={`w-full h-9 text-sm ${
              isEnrolled
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isEnrolled ? "Continue" : "View Course"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
