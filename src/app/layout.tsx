import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "gitcard — your GitHub, in your Wallet",
  description: "Turn your GitHub contribution graph into an Apple Wallet card that updates itself.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-xs text-muted sm:px-6">
          Powered by{" "}
          <a href="https://cospel.ar" className="underline underline-offset-2 hover:text-foreground">
            Cospel.ar
          </a>
          . Not affiliated with GitHub or Apple.
        </footer>
      </body>
    </html>
  );
}
