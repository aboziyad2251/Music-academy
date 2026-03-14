"use client";

import { useTransition } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Globe, Loader2 } from "lucide-react";
import { setLocaleCookie } from "@/lib/i18n/actions";
import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSwitch = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    
    // 1. Optimistic UI update
    setLocale(nextLocale);
    
    // 2. Persist to server using Server Action
    startTransition(async () => {
      await setLocaleCookie(nextLocale);
      
      // 3. Force hard refresh exactly like a traditional app 
      //    to re-evaluate server layout dir/fonts safely.
      window.location.reload();
    });
  };

  return (
    <button 
      type="button"
      disabled={isPending}
      onClick={handleSwitch}
      className={`text-slate-400 hover:text-white flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md transition-colors ${
        isPending ? "opacity-50 cursor-not-allowed" : ""
      }`}
      title="Toggle Language"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
      ) : (
        <Globe className="h-4 w-4 text-emerald-400" />
      )}
      <span className="text-xs uppercase font-bold tracking-wider text-white">
        {locale === "en" ? "عربي" : "English"}
      </span>
    </button>
  );
}
