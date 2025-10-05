import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { Navbar } from "@/components/Navbar";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Avertra Blog",
  description: "Avertra blog about anything and everything.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-mint-50 text-ink antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
