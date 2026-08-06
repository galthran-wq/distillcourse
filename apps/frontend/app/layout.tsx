import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import ChatWidget from "@/components/chat/ChatWidget";
import TelegramBanner from "@/components/settings/TelegramBanner";
import { getLessonLinks } from "@/lib/content/site";
import "./globals.css";
import "katex/dist/katex.min.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "distillcourse — short interactive courses on fundamentals",
    template: "%s · distillcourse",
  },
  description:
    "Short interactive courses on engineering fundamentals. Lessons of 5–15 minutes with computations to perform and checks to pass.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          // Applies the stored theme before first paint to avoid a flash.
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('distillcourse.theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
        <TelegramBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-7xl px-4 py-4 font-mono text-[11px] text-faint sm:px-6">
            distillcourse
          </div>
        </footer>
        {/* In the layout rather than on the lesson page: the conversation
            outlives the page it was started on. The lesson set comes from the
            build, as on the profile — it is what a locator in a reply is
            resolved against. */}
        <ChatWidget lessons={getLessonLinks()} />
      </body>
    </html>
  );
}
