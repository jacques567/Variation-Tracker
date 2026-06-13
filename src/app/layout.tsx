import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/ui/Footer";
import CookieBanner from "@/components/ui/CookieBanner";
import SkipNav from "@/components/SkipNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL}`
  : "https://www.vartracker.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "VarTracker — Variation & Change Order Tracker",
  description: "Log variations, get client sign-off, export invoices. Built for UK contractors.",
  openGraph: {
    title: "VarTracker — Variation & Change Order Tracker",
    description: "Log variations, get client sign-off, export invoices. Built for UK contractors.",
    url: appUrl,
    siteName: "VarTracker",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SkipNav />
        <main id="main">
          {children}
        </main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
