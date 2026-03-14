"use server";

import { cookies } from "next/headers";

export async function setLocaleCookie(locale: "en" | "ar") {
  const cookieStore = cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
    secure: false, // works on localhost too
  });
}
