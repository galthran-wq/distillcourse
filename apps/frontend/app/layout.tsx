import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import ChatWidget from "@/components/chat/ChatWidget";
import TelegramBanner from "@/components/settings/TelegramBanner";
import { getLessonLinks } from "@/lib/content/site";
import "./globals.css";
import "katex/dist/katex.min.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
      // The site scrolls smoothly because the table of contents needs it to.
      // Next 16 no longer suspends that for a route change unless it is told
      // the page has it, and a route change that smooth-scrolls to the top
      // drags the new page up through the transition to it.
      data-scroll-behavior="smooth"
      className={`${sourceSans.variable} ${plexMono.variable} h-full antialiased`}
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
          <div className="mx-auto w-full max-w-7xl px-4 py-4 text-[13px] text-faint sm:px-6">
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
