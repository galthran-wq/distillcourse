import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/auth/UserMenu";
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
        <header className="border-b border-line">
          <div className="mx-auto flex h-13 w-full max-w-7xl items-center justify-between px-6">
            <Link href="/" className="text-[15px] font-semibold tracking-tight hover:text-accent">
              distillcourse
            </Link>
            <div className="flex items-center gap-4">
              <UserMenu />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-7xl px-6 py-4 font-mono text-[11px] text-faint">
            distillcourse
          </div>
        </footer>
      </body>
    </html>
  );
}
