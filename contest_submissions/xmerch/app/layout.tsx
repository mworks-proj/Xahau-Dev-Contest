import type { Metadata } from "next";
import { Cabin } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/components/WalletContext";
import { NetworkManagerProvider } from "@/components/NetworkManager";


const cabin = Cabin({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cabin",
});

export const metadata: Metadata = {
  title: "xMerch",
  description: "xMERCH - #BuildonXahua",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cabin.variable} bg-white`}>
        <NetworkManagerProvider>
          <WalletProvider>
            {/* Full-width Header */}
            <Header />

            {/* Main content with padding to prevent overlap */}
            <main className="pt-[4rem] max-w-7xl mx-auto px-4">{children}</main>

            {/* Additional features */}
            <Analytics />
            <Toaster richColors />
          </WalletProvider>
        </NetworkManagerProvider>
      </body>
    </html>
  );
}
