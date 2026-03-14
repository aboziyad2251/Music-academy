"use client";
import Image from "next/image";

import { useEffect, useState } from "react";
import { signOut } from "@/lib/insforge/auth";
import { createClient } from "@/lib/supabase/client";
import { Music, LogOut, User, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface NavbarProps {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const supabase = createClient();
  const router = useRouter();
  const { t, lang } = useLanguage();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    // Initial fetch
    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          fetchNotifications(); // Refresh on any change (insert/update)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    setIsOpen(false);
    
    // Mark as read
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }

    if (notif.link) {
      router.push(notif.link);
    }
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-white shadow-sm">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--teal)] flex items-center justify-center flex-shrink-0">
            <Music className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base leading-tight font-amiri">أكاديمية المقام</span>
            <span className="text-[9px] text-[var(--gold)] tracking-widest leading-tight">ACADEMY OF THE MAQAM</span>
          </div>
        </div>
        
        <div className="ms-auto flex items-center space-x-2 md:space-x-4">
          <LanguageSwitcher />
          
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
            >
              <Bell className="h-5 w-5 text-white/90" />
              {unreadCount > 0 && (
                <span className="absolute top-1 end-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-primary">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
              <div className="absolute end-0 mt-2 w-80 rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden z-50 text-slate-900 border">
                <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-medium text-accent hover:text-accent/80">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`flex flex-col gap-1 p-4 border-b text-start transition-colors hover:bg-slate-50 ${!n.is_read ? 'bg-sky-50/50' : ''}`}
                        >
                          <div className="flex justify-between items-start w-full gap-2">
                            <span className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                              {n.message}
                            </span>
                            {!n.is_read && <span className="h-2 w-2 mt-1.5 rounded-full bg-accent shrink-0"></span>}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Backdrop for click outside */}
            {isOpen && (
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setIsOpen(false)}
              ></div>
            )}
          </div>

          <div className="flex items-center gap-3 ps-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium leading-none">
                {user.full_name || "User"}
              </span>
              <span className="mt-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent-foreground uppercase">
                {user.role}
              </span>
            </div>
            
            <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10 flex items-center justify-center border border-white/20 relative">
              {user.avatar_url ? (
                <Image 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-white/70 relative z-10" />
              )}
            </div>
          </div>
          
          <button
            onClick={() => signOut()}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-white/10 text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 md:me-2" />
            <span className="hidden md:inline">{t.nav.signOut}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
