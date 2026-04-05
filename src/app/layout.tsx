import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Inter, Amiri, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-amiri" });
const ibmMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-ibm-mono" });

export const metadata: Metadata = {
  title: "أكاديمية المقام - ACADEMY OF THE MAQAM",
  description: "Professional online Arabic music education platform",
  manifest: "/manifest.json",
  themeColor: "#f59e0b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "المقام",
  },
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="المقام" />
      </head>
      <body className={`min-h-screen bg-background antialiased ${amiri.className} ${ibmMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LanguageProvider>
            {children}
          </LanguageProvider>
          <FloatingChat />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
