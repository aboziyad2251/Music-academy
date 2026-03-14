"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Music2,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface AdminShellProps {
  user: {
    full_name: string;
    avatar_url: string | null;
    role: string;
  };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const NAV_LINKS = [
    { href: "/admin/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/admin/users",     label: t.nav.users,     icon: Users },
    { href: "/admin/courses",   label: t.nav.courses,   icon: BookOpen },
    { href: "/admin/analytics", label: t.nav.analytics, icon: BarChart3 },
    { href: "/admin/settings",  label: t.nav.settings,  icon: Settings },
  ];

  const initials =
    user.full_name
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarInner = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="h-8 w-8 rounded-lg bg-[var(--teal)] flex items-center justify-center flex-shrink-0">
          <Music2 className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-white text-base leading-tight font-amiri">أكاديمية المقام</span>
          <span className="text-[9px] text-[var(--gold)] tracking-widest leading-tight">ACADEMY OF THE MAQAM</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          {t.dashboard.breadcrumb}
        </p>
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-[var(--gold)] text-white shadow-lg shadow-black/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: status + user + sign out */}
      <div className="px-3 pb-5 pt-3 border-t border-slate-800 space-y-3 flex-shrink-0 relative overflow-hidden">
        <svg viewBox="0 0 50 50" className="absolute bottom-0 end-0 w-32 h-32 opacity-[0.06] pointer-events-none fill-[var(--gold)]">
          <polygon points="25,3 28,19 44,19 31,29 36,45 25,36 14,45 19,29 6,19 22,19" />
        </svg>
        {/* Platform Status */}
        <div className="px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800 mb-2">
          <div className="flex flex-no-flip items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-slate-400 font-medium">{t.status.platformOnline}</span>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <Avatar className="h-8 w-8 border border-slate-700 flex-shrink-0">
            <AvatarImage src={user.avatar_url ?? ""} />
            <AvatarFallback className="bg-amber-900 text-amber-200 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate capitalize">{t.roles.admin}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex flex-no-flip justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all"
        >
          <LogOut className="h-4 w-4" />
          {t.nav.signOut}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 border-e border-slate-800 flex-shrink-0 relative before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-[var(--gold)] before:to-[var(--teal)] z-20">
        <SidebarInner />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute start-0 top-0 bottom-0 w-64 bg-slate-900 border-e border-slate-800 flex flex-col z-10 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-[var(--gold)] before:to-[var(--teal)]">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 end-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
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
            <div className="hidden lg:flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-slate-400">
                {t.dashboard.breadcrumb}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex flex-col items-end leading-none gap-1">
              <span className="text-sm font-semibold text-white">{user.full_name}</span>
              <Badge className="bg-[var(--gold)] hover:bg-[var(--gold-light)] text-white text-[10px] h-4 px-1.5 rounded-sm">
                مدير
              </Badge>
            </div>
            <Avatar className="h-8 w-8 border-2 border-amber-500/40">
              <AvatarImage src={user.avatar_url ?? ""} />
              <AvatarFallback className="bg-amber-900 text-amber-200 text-xs font-semibold">
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
