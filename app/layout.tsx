import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veloce — Project Intake Engine",
  description: "AI-powered project intake and estimation for agencies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
