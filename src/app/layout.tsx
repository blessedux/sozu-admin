import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sozu Network Intelligence",
  description: "Internal operational dashboard for the Sozu payment network — admin.sozu.capital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} dark`}>
      <body className={`${manrope.variable} min-h-screen bg-black font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
