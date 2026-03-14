import { cookies } from "next/headers";
import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";

export async function getServerI18n() {
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "ar" ? "ar" : "en";
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

  return { t, locale };
}
