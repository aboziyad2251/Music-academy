"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  BookOpen,
  TrendingUp,
  ClipboardList,
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

interface StudentShellProps {
  user: {
    full_name: string;
    avatar_url: string | null;
    role: string;
  };
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/courses",   label: "Browse Courses", icon: Library },
  { href: "/student/dashboard", label: "My Courses", icon: BookOpen },
  { href: "/student/progress",  label: "My Progress", icon: TrendingUp },
  { href: "/student/assignments", label: "Assignments", icon: ClipboardList },
];

export default function StudentShell({ user, children }: StudentShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "ST";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarInner = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Music2 className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white text-base">Music Academy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          Student Portal
        </p>
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/student/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-indigo-200" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="px-3 pb-5 pt-3 border-t border-slate-800 space-y-1 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <Avatar className="h-8 w-8 border border-slate-700 flex-shrink-0">
            <AvatarImage src={user.avatar_url ?? ""} />
            <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xs font-semibold">
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

      {/* Mobile Sidebar Overlay */}
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

      {/* Right: topbar + content */}
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
              Welcome back,{" "}
              <span className="font-semibold text-white">
                {user.full_name.split(" ")[0]}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Bell */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
            </button>

            {/* Identity */}
            <div className="hidden sm:flex flex-col items-end leading-none gap-1">
              <span className="text-sm font-semibold text-white">{user.full_name}</span>
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-4 px-1.5 rounded-sm">
                STUDENT
              </Badge>
            </div>
            <Avatar className="h-8 w-8 border-2 border-indigo-500/40">
              <AvatarImage src={user.avatar_url ?? ""} />
              <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
