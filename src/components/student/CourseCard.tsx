import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:border-accent hover:shadow-md group">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {course.thumbnail_url ? (
          <Image 
            src={course.thumbnail_url} 
            alt={course.title} 
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Music className="h-12 w-12 text-slate-300" />
        )}
        
        <div className="absolute top-2 right-2 flex gap-2">
          {isEnrolled && (
            <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Enrolled
            </Badge>
          )}
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm capitalize">
            {course.level}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="flex-none pb-2 pt-4">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="text-xs mb-2 text-accent border-accent/20 bg-accent/5 capitalize">
            {course.category}
          </Badge>
          {!isEnrolled && (
            <span className="font-bold text-lg text-slate-900">
              ${course.price}
            </span>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-xl">{course.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="h-3 w-3" />
          </div>
          <span>{course.teacher?.full_name || "Instructor"}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Link href={`/student/courses/${course.id}`} className="w-full">
          <Button 
            className="w-full" 
            variant={isEnrolled ? "outline" : "default"}
          >
            {isEnrolled ? "View Course" : "Buy Now"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
