import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

// One family carries the whole brand (Media Party spec): Poppins,
// 300 (subtitle) → 800 (wordmark).
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: { default: "HackDash", template: "%s · HackDash" },
  description: "The fastest way to make a hackathon's work visible.",
};

// Applies the persisted theme before first paint (three-state dark mode:
// no attribute = system; data-theme = explicit choice). Kept inline and tiny
// so there is never a flash of the wrong theme.
const THEME_INIT = `try{var t=localStorage.getItem("hd-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
