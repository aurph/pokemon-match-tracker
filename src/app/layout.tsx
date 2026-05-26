import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Elgyem Control Tracker",
  description: "Local-first Pokémon TCG control-deck match tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col sm:flex-row">
          <Nav />
          <main className="flex-1 p-4 sm:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
