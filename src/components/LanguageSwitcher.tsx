"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  const handleSwitch = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  return (
    <button 
      type="button"
      onClick={handleSwitch}
      className={`text-slate-400 hover:text-white flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-md transition-colors`}
      title={lang === 'ar' ? 'تغيير اللغة' : 'Change Language'}
    >
      <Globe className="h-4 w-4 text-emerald-400" />
      <span className="text-xs uppercase font-bold tracking-wider text-white font-mono">
        {lang === 'ar' ? 'ENGLISH' : 'العربية'}
      </span>
    </button>
  );
}
