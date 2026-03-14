import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Inter, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Music Online Academy",
  description: "Professional online music education platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as "en" | "ar") || "en";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const fontClass = locale === "ar" ? cairo.className : inter.className;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`min-h-screen bg-background antialiased ${fontClass}`}>
        <I18nProvider initialLocale={locale}>
          {children}
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
