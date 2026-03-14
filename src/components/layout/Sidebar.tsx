"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  Library, 
  Target, 
  PlusCircle, 
  Users, 
  GraduationCap, 
  BarChart, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";

interface SidebarProps {
  role: "student" | "teacher" | "admin";
}

const getLinksForRole = (role: string) => {
  switch (role) {
    case "student":
      return [
        { title: "shell.dashboard", href: "/student/dashboard", icon: LayoutDashboard },
        { title: "shell.courses", href: "/student/courses", icon: BookOpen },
        { title: "shell.courses", href: "/courses", icon: Library }, // using 'shell.courses' or could be 'shell.browseCourses'
      ];
    case "teacher":
      return [
        { title: "shell.dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
        { title: "shell.courses", href: "/teacher/courses", icon: Library },
        { title: "shell.create", href: "/teacher/courses/new", icon: PlusCircle },
        { title: "shell.students", href: "/teacher/students", icon: Users },
        { title: "shell.assignments", href: "/teacher/grades", icon: GraduationCap, badgeKey: "grades" },
      ];
    case "admin":
      return [
        { title: "shell.dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "shell.users", href: "/admin/users", icon: Users },
        { title: "shell.courses", href: "/admin/courses", icon: Library },
        { title: "shell.settings", href: "/admin/settings", icon: Settings },
      ];
    default:
      return [];
  }
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = getLinksForRole(role);
  const [isOpen, setIsOpen] = useState(false);
  const [ungradedCount, setUngradedCount] = useState(0);
  const supabase = createClient();

  // Fetch and subscribe to ungraded submissions count for teachers
  useEffect(() => {
    if (role !== "teacher") return;

    const fetchCount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: courses } = await supabase.from("courses").select("id").eq("teacher_id", session.user.id);
      if (!courses || courses.length === 0) return;

      const courseIds = courses.map((c: any) => c.id);
      const { data: lessons } = await supabase.from("lessons").select("id").in("course_id", courseIds);
      if (!lessons || lessons.length === 0) return;

      const lessonIds = lessons.map((l: any) => l.id);
      const { data: assignments } = await supabase.from("assignments").select("id").in("lesson_id", lessonIds);
      if (!assignments || assignments.length === 0) return;

      const assignmentIds = assignments.map((a: any) => a.id);
      const { count } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("assignment_id", assignmentIds)
        .is("score", null);

      setUngradedCount(count || 0);
    };

    fetchCount();

    // Real-time subscription for new submissions
    const channel = supabase
      .channel("sidebar-submissions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "submissions" }, () => {
        fetchCount();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "submissions" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [role]);

  return (
    <>
      <button 
        className="md:hidden fixed bottom-6 end-6 z-50 h-14 w-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 flex-col border-e bg-white transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-1 overflow-auto py-6 px-4">
          <nav className="grid gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const showBadge = (link as any).badgeKey === "grades" && ungradedCount > 0;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive 
                      ? "bg-accent/10 text-accent hover:bg-accent/20" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-accent" : "text-slate-500")} />
                  {t(link.title)}
                  {showBadge && (
                    <span className="ms-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {ungradedCount > 99 ? "99+" : ungradedCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

