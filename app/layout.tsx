import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "İlan Skoru",
  description: "Decision engine for real estate listing analysis"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
