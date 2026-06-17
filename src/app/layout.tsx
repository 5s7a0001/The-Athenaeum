import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, Special_Elite } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "The Athenaeum | A Scholar's Productivity Ritual",
  description: "A dark academia productivity sanctuary inspired by 17th-century Dutch still-life art. Plan, block time, and focus in a candlelit study room.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${ebGaramond.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-garamond overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
