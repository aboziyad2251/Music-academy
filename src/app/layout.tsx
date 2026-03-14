import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Inter, Amiri, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { FloatingChat } from "@/components/chat/FloatingChat";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri" });
const ibmMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-ibm-mono" });

export const metadata: Metadata = {
  title: "أكاديمية المقام - ACADEMY OF THE MAQAM",
  description: "Professional online music education platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ar";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`min-h-screen bg-background antialiased ${amiri.className} ${ibmMono.variable}`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <FloatingChat />
        <Toaster />
      </body>
    </html>
  );
}
