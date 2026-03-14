"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Lang, Translations } from './translations';
import { useRouter } from 'next/navigation';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const defaultContext: LanguageContextType = {
  lang: 'ar',
  setLang: () => {},
  t: translations.ar,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'ar';
    return (localStorage.getItem('maqam_lang') as Lang) || 'ar';
  });

  const setLang = (newLang: Lang) => {
    localStorage.setItem('maqam_lang', newLang);
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    setLangState(newLang);
    
    // Apply RTL/LTR rules globally to the document element here as well
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    // Initial load apply
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const value = {
    lang,
    setLang,
    t: translations[lang] || translations.ar,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
