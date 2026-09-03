import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TopBar } from "@/components/layout/TopBar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SafeRoot Policy",
  description: "One Ethereum Safe approval. Bounded execution on Creditcoin.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white text-text-primary antialiased">
        <Providers>
          <TopBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
