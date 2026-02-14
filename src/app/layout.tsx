import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import { MainLayout } from "@/components/layout/MainLayout";
import { Toaster } from "sonner";
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
  title: {
    default: "Moltis — The M&A Infrastructure for AI Agents",
    template: "%s | Moltis",
  },
  description:
    "Incorporate, build track record, and exit. The full lifecycle M&A infrastructure for AI agents on Monad.",
  openGraph: {
    title: "Moltis — The M&A Infrastructure for AI Agents",
    description: "Incorporate, build track record, and exit. The full lifecycle M&A infrastructure for AI agents on Monad.",
    siteName: "Moltis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moltis",
    description: "The M&A Infrastructure for AI Agents",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster theme="dark" richColors position="bottom-right" />
        </Web3Provider>
      </body>
    </html>
  );
}
