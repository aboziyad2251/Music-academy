"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Users,
  ClipboardCheck,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Music2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface TeacherShellProps {
  user: {
    full_name: string;
    avatar_url: string | null;
    role: string;
  };
  ungradedCount: number;
  children: React.ReactNode;
}

export default function TeacherShell({ user, ungradedCount, children }: TeacherShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials =
    user.full_name
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "TC";

  const NAV_LINKS = [
    { href: "/teacher/dashboard",   label: "Dashboard",      icon: LayoutDashboard, badge: null },
    { href: "/teacher/courses",     label: "My Courses",     icon: BookOpen,        badge: null },
    { href: "/teacher/courses/new", label: "Create Course",  icon: PlusCircle,      badge: null },
    { href: "/teacher/students",    label: "My Students",    icon: Users,           badge: null },
    { href: "/teacher/grades",      label: "Grades",         icon: ClipboardCheck,  badge: ungradedCount > 0 ? ungradedCount : null },
    { href: "/teacher/analytics",   label: "Analytics",      icon: BarChart3,       badge: null },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarInner = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <Music2 className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white text-base">Music Academy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          Teacher Portal
        </p>
        {NAV_LINKS.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            pathname === href ||
            (href !== "/teacher/dashboard" &&
              href !== "/teacher/courses/new" &&
              pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-emerald-700 text-white shadow-lg shadow-emerald-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive ? "text-emerald-200" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                {label}
              </div>
              {badge !== null && (
                <span className="h-5 min-w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user + sign out */}
      <div className="px-3 pb-5 pt-3 border-t border-slate-800 space-y-1 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <Avatar className="h-8 w-8 border border-slate-700 flex-shrink-0">
            <AvatarImage src={user.avatar_url ?? ""} />
            <AvatarFallback className="bg-emerald-900 text-emerald-200 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <SidebarInner />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarInner onLinkClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden lg:block text-sm text-slate-400">
              Welcome,{" "}
              <span className="font-semibold text-white">{user.full_name.split(" ")[0]}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Bell with ungraded badge */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Bell className="h-5 w-5" />
              {ungradedCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                  {ungradedCount > 9 ? "9+" : ungradedCount}
                </span>
              )}
            </button>

            {/* Identity */}
            <div className="hidden sm:flex flex-col items-end leading-none gap-1">
              <span className="text-sm font-semibold text-white">{user.full_name}</span>
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-4 px-1.5 rounded-sm">
                TEACHER
              </Badge>
            </div>
            <Avatar className="h-8 w-8 border-2 border-emerald-500/40">
              <AvatarImage src={user.avatar_url ?? ""} />
              <AvatarFallback className="bg-emerald-900 text-emerald-200 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
