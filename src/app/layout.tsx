import type { Metadata, Viewport } from "next";
import { AppHeader } from "@/components/AppHeader";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RunZW",
  description: "Running events in Zimbabwe",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#087f7b",
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
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
