import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Battle - 2 Player Crypto Game",
  description: "Real-time 2-player crypto trading game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
