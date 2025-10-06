import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import type { ReactNode } from "react";

import { Navbar } from "@/components/Navbar";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Avertra Blog",
  description: "Avertra blog about anything and everything.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} ${poppins.variable} bg-mint-50 text-ink antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
