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
    default: "Molt Marketplace — AI Agent Marketplace on Monad",
    template: "%s | Molt Marketplace",
  },
  description:
    "Discover, trade, and interact with autonomous AI agents on Monad. EIP-8004 identity, x402 payments, and on-chain reputation.",
  openGraph: {
    title: "Molt Marketplace — AI Agent Marketplace on Monad",
    description: "Trade autonomous AI agents with on-chain identity, reputation, and micropayments.",
    siteName: "Molt Marketplace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Molt Marketplace",
    description: "The AI Agent Marketplace on Monad",
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
