"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";

type Dictionary = typeof en;

const I18nContext = createContext<{
  locale: "en" | "ar",
  t: (keyPath: string, vars?: Record<string, any>) => string,
  setLocale: (loc: "en" | "ar") => void
}>({
  locale: "en",
  t: (k) => k,
  setLocale: () => {}
});

export function I18nProvider({ children, initialLocale }: { children: React.ReactNode, initialLocale: "en" | "ar" }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<"en" | "ar">(initialLocale);

  const swapLocale = (loc: "en" | "ar") => {
    // 1. Set the cookie reliably
    document.cookie = `NEXT_LOCALE=${loc}; path=/; max-age=31536000; SameSite=Lax`;
    
    // 2. Set client state
    setLocaleState(loc);
    
    // 3. Force full document reload so <html> dir="rtl" and fonts apply correctly
    window.location.reload();
  };

  const dictionary = locale === "ar" ? ar : en;

  const t = (keyPath: string, vars?: Record<string, any>) => {
    const keys = keyPath.split(".");
    let val: any = dictionary;
    for (const k of keys) {
      if (val) val = val[k];
    }
    
    let res = val || keyPath;
    if (typeof res === "string" && vars) {
      Object.keys(vars).forEach(k => {
        res = res.replace(`{${k}}`, String(vars[k]));
      });
    }
    return typeof res === "string" ? res : keyPath;
  };

  return (
    <I18nContext.Provider value={{ locale, t, setLocale: swapLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
