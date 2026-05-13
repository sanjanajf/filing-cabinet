import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Sanjana's writing workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen w-screen bg-[#008080] flex items-center justify-center overflow-hidden">
        {children}
      </body>
    </html>
  );
}
